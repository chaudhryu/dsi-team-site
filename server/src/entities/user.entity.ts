
import { Entity, PrimaryGeneratedColumn, Column, OneToMany,ManyToMany,PrimaryColumn } from 'typeorm';
import { WeeklyAccomplishment } from './WeeklyAccomplishment.entity';

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
  position: number;

  @Column({ default: 0 })
  readOnly: number;


  @OneToMany(() => WeeklyAccomplishment, wa => wa.user)
  weeklyAccomplishments: WeeklyAccomplishment[];}