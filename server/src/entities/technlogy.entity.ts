import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Project } from "./project.entity";

@Entity()
export class Technology {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
