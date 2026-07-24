import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class AttendanceLocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
  })
  latitude: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
  })
  longitude: number;

  @Column({
    type: 'int',
    default: 150,
  })
  allowedRadiusMeters: number;

  @Column({ nullable: true })
  branchName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}