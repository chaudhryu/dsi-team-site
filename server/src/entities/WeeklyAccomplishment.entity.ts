// src/entities/WeeklyAccomplishment.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, Index, Unique } from 'typeorm';
import { User } from './user.entity';
import { Application } from './Application.entity';

@Entity()
@Unique('uq_user_app_week', ['user', 'application', 'weeklyPeriod']) // optional but useful
export class WeeklyAccomplishment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'badge', referencedColumnName: 'badge' }) // <-- ensure this matches User.badge
  user: User;

  @ManyToOne(() => Application, { eager: true })
  @JoinColumn({ name: 'application_id', referencedColumnName: 'id' })
  application: Application;

  @ManyToOne(() => WeeklyAccomplishment, { nullable: true })
  @JoinColumn({ name: 'last_week_id' })
  lastWeek: WeeklyAccomplishment;

  @Index()
  @Column({ length: 8 })               // e.g. "2025-W25"
  weeklyPeriod: string;

  @Column({ nullable: true, type: 'text' })
  accomplishments: string;

  @Column({ nullable: true })
  dateSubmitted: string;

  @Column({ nullable: true })
  startWeekDate: string;

  @Column({ nullable: true })
  endWeekDate: string;

  @Column({ nullable: true })
  taskStatus: string;
}
