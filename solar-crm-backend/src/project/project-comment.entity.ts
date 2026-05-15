import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ProjectCommentDepartment {
  GENERAL = 'GENERAL',
  LOAN = 'LOAN',
  SUBSIDY = 'SUBSIDY',
  ELECTRICITY = 'ELECTRICITY',
  PROJECT = 'PROJECT',
  PAYMENT = 'PAYMENT',
}

@Entity()
export class ProjectComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({
  type: 'enum',
  enum: ProjectCommentDepartment,
  default: ProjectCommentDepartment.GENERAL,
})
department: ProjectCommentDepartment;

  @Column({ type: 'text' })
  comment: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByRole: string;

  @Column({ default: false })
  visibleToCustomer: boolean;

  @CreateDateColumn()
  createdAt: Date;
}