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

  @Column({ default: 0 })
  readOnly: number;

  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  reportToLevelOne: string;

  @Column({ nullable: true })
  reportToLevelTwo: string;

  @OneToMany(() => WeeklyAccomplishment, (wa) => wa.user)
  weeklyAccomplishments: WeeklyAccomplishment[];
}
