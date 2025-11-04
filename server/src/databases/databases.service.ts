import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Database } from "../entities/Database.entity";
import { DatabaseLogin } from "../entities/Database_Login.entity";
import { CreateDatabaseDto } from "../dto/create-database.dto";
import { UpdateDatabaseDto } from "../dto/update-database.dto";
import { CreateLoginDto } from "../dto/create-login.dto";
import { UpdateLoginDto } from "../dto/update-login.dto";
import { CryptoService } from "../security/crypto.service";

type SafeLogin = Omit<DatabaseLogin, "password"> & { password?: undefined };
type SafeDatabase = Omit<Database, "logins"> & { logins: SafeLogin[] };

@Injectable()
export class DatabasesService {
  constructor(
    @InjectRepository(Database) private readonly dbRepo: Repository<Database>,
    @InjectRepository(DatabaseLogin) private readonly loginRepo: Repository<DatabaseLogin>,
    private readonly crypto: CryptoService,
  ) {}

  /** Strip password from logins before returning to the client */
  private sanitize(db: Database): SafeDatabase {
    const { logins = [], ...rest } = db;
    const safeLogins = (logins || []).map(({ password, ...l }) => l as SafeLogin);
    return { ...(rest as any), logins: safeLogins };
  }

  async findAll(): Promise<SafeDatabase[]> {
    const rows = await this.dbRepo.find();
    return rows.map((d) => this.sanitize(d));
  }

  async findOne(id: number): Promise<SafeDatabase> {
    const db = await this.dbRepo.findOne({ where: { id } });
    if (!db) throw new NotFoundException("Database not found");
    return this.sanitize(db);
  }

  async createDatabase(dto: CreateDatabaseDto): Promise<SafeDatabase> {
    const entity = this.dbRepo.create(dto);
    const saved = await this.dbRepo.save(entity);
    return this.sanitize(saved);
  }

  async updateDatabase(id: number, dto: UpdateDatabaseDto): Promise<SafeDatabase> {
    const db = await this.dbRepo.findOne({ where: { id } });
    if (!db) throw new NotFoundException("Database not found");
    Object.assign(db, dto);
    const saved = await this.dbRepo.save(db);
    return this.sanitize(saved);
  }

  async removeDatabase(id: number): Promise<void> {
    // No cascade set on entities; delete child logins first.
    await this.loginRepo
      .createQueryBuilder()
      .delete()
      .from(DatabaseLogin)
      .where("database_id = :id", { id })
      .execute();

    await this.dbRepo.delete(id);
  }

  async addLogin(dbId: number, dto: CreateLoginDto): Promise<SafeDatabase> {
    const database = await this.dbRepo.findOne({ where: { id: dbId } });
    if (!database) throw new NotFoundException("Database not found");

    const login = this.loginRepo.create({
      database,
      role: dto.role,
      username: dto.username,
      password: this.crypto.encrypt(dto.password),
    });
    await this.loginRepo.save(login);

    const updated = await this.dbRepo.findOne({ where: { id: dbId } });
    if (!updated) throw new NotFoundException("Database not found");
    return this.sanitize(updated);
  }

  async updateLogin(dbId: number, loginId: number, dto: UpdateLoginDto): Promise<SafeDatabase> {
    const login = await this.loginRepo.findOne({
      where: { id: loginId },
      relations: ["database"],
    });
    if (!login || login.database.id !== dbId) {
      throw new NotFoundException("Login not found");
    }

    if (dto.role !== undefined) login.role = dto.role;
    if (dto.username !== undefined) login.username = dto.username;
    if (dto.password) {
      login.password = this.crypto.encrypt(dto.password);
    }
    await this.loginRepo.save(login);

    const updated = await this.dbRepo.findOne({ where: { id: dbId } });
    if (!updated) throw new NotFoundException("Database not found");
    return this.sanitize(updated);
  }

  async removeLogin(dbId: number, loginId: number): Promise<SafeDatabase> {
    const login = await this.loginRepo.findOne({
      where: { id: loginId },
      relations: ["database"],
    });
    if (!login || login.database.id !== dbId) {
      throw new NotFoundException("Login not found");
    }

    await this.loginRepo.delete(loginId);

    const updated = await this.dbRepo.findOne({ where: { id: dbId } });
    if (!updated) throw new NotFoundException("Database not found");
    return this.sanitize(updated);
  }

  /** Admin-only: return the decrypted password for a specific login */
  async revealPassword(dbId: number, loginId: number): Promise<{ password: string }> {
    const login = await this.loginRepo.findOne({
      where: { id: loginId },
      relations: ["database"],
    });
    if (!login || login.database.id !== dbId) {
      throw new NotFoundException("Login not found");
    }
    const password = this.crypto.decrypt(login.password);
    return { password };
  }
}
