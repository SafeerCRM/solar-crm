import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PerformanceTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  templateName: string;

  @Column()
  applicableRole: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  branchName: string;

  @Column({ default: true })
  isDefault: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable:true })
  createdByName:string;

  @CreateDateColumn()
  createdAt:Date;

  @UpdateDateColumn()
  updatedAt:Date;
}