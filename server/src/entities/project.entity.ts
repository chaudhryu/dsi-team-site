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

  @Column({ nullable: true }) // Allow this column to be nu ll
  githubUrl: string;

  @ManyToMany(() => User, { eager: true })
  @JoinTable()
  projectMembers: User[];

  @ManyToMany(() => Technology, { cascade: true })
  @JoinTable()
  technologies: Technology[];
}
