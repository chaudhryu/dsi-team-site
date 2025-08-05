import { Entity,PrimaryGeneratedColumn,ManyToOne,JoinColumn,Column } from "typeorm";
import { Database } from "./Database.entity";
@Entity()
export class DatabaseLogin {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Database)
  @JoinColumn({ name: 'database_id' })
  database: Database;

  @Column()
  role: string;

  @Column()
  username: string;

  @Column()
  password: string;
}
