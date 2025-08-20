// src/entities/WeeklyAccomplishment.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { User } from './user.entity';
import { Application } from './Application.entity';

@Entity()
export class WeeklyAccomplishment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'badge' })
  user: User;

  // 👇 allow nulls
  @ManyToOne(() => Application, { eager: true, nullable: true })
  @JoinColumn({ name: 'application_id' })
  application: Application | null;

  @ManyToOne(() => WeeklyAccomplishment, { nullable: true })
  @JoinColumn({ name: 'last_week_id' })
  lastWeek: WeeklyAccomplishment;

  @Column({ nullable: true })
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
