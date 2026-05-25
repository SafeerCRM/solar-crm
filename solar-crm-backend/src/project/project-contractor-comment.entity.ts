import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectContractorComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column()
  assignmentId: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'text', nullable: true })
  commentType: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ type: 'text', nullable: true })
  createdByName: string;

  @Column({ type: 'text', nullable: true })
  createdByRole: string;

  @CreateDateColumn()
  createdAt: Date;
}