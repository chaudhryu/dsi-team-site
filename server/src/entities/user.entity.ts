import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  PrimaryColumn,
  JoinTable,
} from "typeorm";
import { WeeklyAccomplishment } from "./WeeklyAccomplishment.entity";
import { Project } from "./project.entity";

@Entity()
export class User {
  @PrimaryColumn()
  badge: number;

  @Column({ nullable: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  costCenter: number;

  @Column({ nullable: true })
  reportToLevelOne: number;

  @Column({ nullable: true })
  reportToLevelTwo: number;

  @Column({ default: 0 })
  readOnly: number;

  @OneToMany(() => WeeklyAccomplishment, (wa) => wa.user)
  weeklyAccomplishments: WeeklyAccomplishment[];
}
