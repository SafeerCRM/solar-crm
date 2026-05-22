import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectEditHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column()
  fieldName: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string;

  @Column({ type: 'text', nullable: true })
  newValue: string;

  @Column({ nullable: true })
  changedBy: number;

  @Column({ nullable: true })
  changedByName: string;

  @Column({ nullable: true })
  changedByRole: string;

  @CreateDateColumn()
  createdAt: Date;
}