import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

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