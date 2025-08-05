import { Entity,PrimaryGeneratedColumn,ManyToOne,JoinColumn,Column } from "typeorm";
@Entity()
export class Server {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hostname: string;

  @Column()
  ipAddress: string;

  @Column()
  os: string;

  @Column()
  status: string;

  @Column()
  environment: string;

  @Column()
  role: string;

  @Column()
  location: string;

  @Column({ nullable: true })
  folder: string;
}

