// src/entities/WeeklyAccomplishment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column /*, Index*/,
} from "typeorm";
import { User } from "./user.entity";
import { Application } from "./Application.entity";

// If you want to be explicit, set the table name to match your DB
@Entity({ name: "weekly_accomplishment" })
// Optional: enforce one record per user+week on the DB side
// @Index('UX_weekly_accomplishment_user_week', ['user', 'startWeekDate', 'endWeekDate'], { unique: true })
export class WeeklyAccomplishment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "badge" }) // assumes User has PK/unique 'badge'
  user: User;

  @ManyToOne(() => Application, { eager: true, nullable: true })
  @JoinColumn({ name: "application_id" })
  application: Application | null;

  @ManyToOne(() => WeeklyAccomplishment, { nullable: true })
  @JoinColumn({ name: "last_week_id" })
  lastWeek: WeeklyAccomplishment;

  // ⬇️ Pin to NVARCHAR(MAX) so TypeORM will NOT revert it to 255
  @Column({
    type: "nvarchar",
    length: "MAX",
    nullable: true,
    name: "accomplishments",
  })
  accomplishments: string | null;

  // The rest can stay strings if your table is nvarchar.
  // If your columns are DATE in SQL Server, change type to 'date'.
  @Column({ nullable: true, name: "dateSubmitted" })
  dateSubmitted: string | null;

  @Column({ nullable: true, name: "startWeekDate" })
  startWeekDate: string | null;

  @Column({ nullable: true, name: "endWeekDate" })
  endWeekDate: string | null;

  @Column({ nullable: true, name: "taskStatus" })
  taskStatus: string | null;

  @Column({ nullable: true, name: "costCenter" })
  costCenter: number | null;
}
