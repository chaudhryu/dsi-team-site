import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
  ForbiddenException,
} from "@nestjs/common";
import { DatabasesService } from "../databases/databases.service";
import { CreateDatabaseDto } from "../dto/create-database.dto";
import { UpdateDatabaseDto } from "../dto/update-database.dto";
import { CreateLoginDto } from "../dto/create-login.dto";
import { UpdateLoginDto } from "../dto/update-login.dto";

@Controller("databases")
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class DatabasesController {
  constructor(private readonly svc: DatabasesService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDatabaseDto) {
    return this.svc.createDatabase(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateDatabaseDto) {
    return this.svc.updateDatabase(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.svc.removeDatabase(id);
  }

  @Post(":id/logins")
  addLogin(@Param("id", ParseIntPipe) id: number, @Body() dto: CreateLoginDto) {
    return this.svc.addLogin(id, dto);
  }

  @Patch(":id/logins/:loginId")
  updateLogin(
    @Param("id", ParseIntPipe) id: number,
    @Param("loginId", ParseIntPipe) loginId: number,
    @Body() dto: UpdateLoginDto,
  ) {
    return this.svc.updateLogin(id, loginId, dto);
  }

  @Delete(":id/logins/:loginId")
  removeLogin(
    @Param("id", ParseIntPipe) id: number,
    @Param("loginId", ParseIntPipe) loginId: number,
  ) {
    return this.svc.removeLogin(id, loginId);
  }

  /** Admin-only: reveal the decrypted password (no-store to avoid caching) */
  @Post(":id/logins/:loginId/reveal")
  @Header("Cache-Control", "no-store")
  async reveal(
    @Param("id", ParseIntPipe) id: number,
    @Param("loginId", ParseIntPipe) loginId: number,
    @Req() req: any,
  ) {
    // If you have guards, prefer @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('admin').
    const roles: string[] = req?.user?.roles ?? [];
    if (!roles.includes("admin")) {
      throw new ForbiddenException("Admin privileges required");
    }
    return this.svc.revealPassword(id, loginId);
  }
}
