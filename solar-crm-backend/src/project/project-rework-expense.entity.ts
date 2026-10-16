
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectReworkExpenseCategory {
  LABOUR = 'LABOUR',
  CONTRACTOR = 'CONTRACTOR',
  TRANSPORTATION = 'TRANSPORTATION',
  OTHER = 'OTHER',
}

@Entity('project_rework_expense')
@Index(['reworkId'])
@Index(['projectId'])
export class ProjectReworkExpense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  reworkId: number;

  @Column({ type: 'integer' })
  projectId: number;

  @Column({
    type: 'enum',
    enum: ProjectReworkExpenseCategory,
    default: ProjectReworkExpenseCategory.OTHER,
  })
  category: ProjectReworkExpenseCategory;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
  })
  amount: number;

  @Column({ type: 'date', nullable: true })
  expenseDate: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'integer', nullable: true })
  createdBy: number | null;

  @Column({ type: 'text', nullable: true })
  createdByName: string | null;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
