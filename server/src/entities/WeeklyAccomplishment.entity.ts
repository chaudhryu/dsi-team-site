import { Entity,PrimaryGeneratedColumn,ManyToOne,JoinColumn,Column } from "typeorm";

import { User } from "./user.entity";
import { Application } from "./Application.entity";
@Entity()
export class WeeklyAccomplishment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Application, { eager: true })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @ManyToOne(() => WeeklyAccomplishment, { nullable: true })
  @JoinColumn({ name: 'last_week_id' })
  lastWeek: WeeklyAccomplishment;

  @Column({ nullable: true })
  accomplishments: string;

  @Column({ nullable: true })
  dateSubmitted: string;

  @Column({ nullable: true })
  weeklyPeriod: string;

  @Column({ nullable: true })
  taskStatus: string;
}
