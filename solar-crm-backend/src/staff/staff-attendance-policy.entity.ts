import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StaffAttendanceLocationRule {
  ANYWHERE_ALLOWED = 'ANYWHERE_ALLOWED',
  OFFICE_LOCATION_REQUIRED = 'OFFICE_LOCATION_REQUIRED',
}

@Entity()
@Index(['staffId'], {
  unique: true,
})
export class StaffAttendancePolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  staffId: number;

  @Column({ nullable: true })
  staffName: string;

  @Column({
    type: 'enum',
    enum: StaffAttendanceLocationRule,
    default: StaffAttendanceLocationRule.ANYWHERE_ALLOWED,
  })
  punchInRule: StaffAttendanceLocationRule;

  @Column({
  type: 'int',
  nullable: true,
})
punchInLocationId: number | null;

  @Column({
    type: 'enum',
    enum: StaffAttendanceLocationRule,
    default: StaffAttendanceLocationRule.ANYWHERE_ALLOWED,
  })
  punchOutRule: StaffAttendanceLocationRule;

  @Column({
  type: 'int',
  nullable: true,
})
punchOutLocationId: number | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({
  type: 'int',
  nullable: true,
})
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({
  type: 'int',
  nullable: true,
})
  updatedBy: number;

  @Column({ nullable: true })
  updatedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}