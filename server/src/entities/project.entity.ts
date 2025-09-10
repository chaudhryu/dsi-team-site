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

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  status: string;

  @Column()
  client: string;

  @Column({
    type: "text",
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
