import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from "typeorm";
import { User } from "./user.entity";
import { Server } from "./Server.entity";
import { Database } from "./Database.entity";
@Entity()
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "owner_badge" })
  owner: User;

  @ManyToOne(() => Server, { eager: true })
  @JoinColumn({ name: "dev_server_id" })
  devServer: Server;

  @ManyToOne(() => Server, { eager: true })
  @JoinColumn({ name: "prod_server_id" })
  prodServer: Server;

  @ManyToOne(() => Database, { eager: true })
  @JoinColumn({ name: "dev_database_id" })
  devDatabase: Database;

  @ManyToOne(() => Database, { eager: true })
  @JoinColumn({ name: "prod_database_id" })
  prodDatabase: Database;

  @Column()
  appName: string;

  @Column({ nullable: true })
  appDescription: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  devDomain: string;

  @Column({ type: "datetime", nullable: true })
  lastUpdated: Date;

  @Column({ nullable: true })
  lastUpdatedBy: string;
}
