import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity({ name: "user_activity_log" })
export class UserActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "badge" })
  user: User;

  @Column({ type: "varchar", length: 50 })
  activityType: string; // 'login' or 'view_accomplishment'

  @CreateDateColumn({ name: "timestamp" })
  timestamp: Date;

  @Column({ nullable: true, name: "accomplishment_id" })
  accomplishmentId: number | null;

  @Column({ type: "nvarchar", length: 500, nullable: true })
  metadata: string | null; // JSON string for additional data
}
