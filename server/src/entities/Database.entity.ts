import { Entity,PrimaryGeneratedColumn,ManyToOne,JoinColumn,Column ,OneToMany } from "typeorm";
import { DatabaseLogin } from "./Database_Login.entity";
@Entity()
export class Database {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  host: string;

  @Column()
  serviceName: string;

  @Column()
  port: string;

  @Column()
  engine: string;

  @Column()
  status: string;
  @OneToMany(() => DatabaseLogin, login => login.database, { eager: true })
  logins: DatabaseLogin[];
}

