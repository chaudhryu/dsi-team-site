import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Technology } from "./technlogy.entity";
import { Repository } from "../objects/repository";

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 125 })
  name: string;

  @Column({ type: "varchar", length: "MAX" })
  description: string;

  @Column({ type: "varchar", length: 25 })
  status: string;

  @Column({ type: "varchar", length: 75 })
  client: string;

  @Column({
    type: "varchar",
    length: 150,
    transformer: {
      to: (value: any) => JSON.stringify(value), // array -> string
      from: (value: string) => JSON.parse(value), // string -> array
    },
  })
  repositories: Repository[];

  @ManyToMany(() => User, { eager: true })
  @JoinTable()
  projectMembers: User[];

  @ManyToMany(() => Technology, { cascade: true })
  @JoinTable()
  technologies: Technology[];
}
