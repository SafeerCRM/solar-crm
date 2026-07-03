import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class PerformanceTemplateMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  templateId: number;

  @Column()
  metricName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  targetValue: number;

  @Column({ default: 'NUMBER' })
  metricType: string;

  @Column({ default: 'COUNT' })
  metricUnit: string;

  @Column({ default: false })
  mandatory: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  weightage: number;

  @CreateDateColumn()
  createdAt: Date;
}