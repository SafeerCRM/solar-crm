import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import {
  ProjectTimelineModule,
} from './project-timeline-rule.entity';

@Entity('project_timeline_events')
export class ProjectTimelineEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
  })
  projectId: number;

  /*
   * Which CRM department produced the event.
   */
  @Column({
    type: 'enum',
    enum: ProjectTimelineModule,
  })
  module: ProjectTimelineModule;

  /*
   * Actual CRM milestone/status.
   *
   * Examples:
   * INVERTER_INSTALLED
   * IN_PRINCIPAL_GENERATED
   * SUBSIDY_REQUESTED
   * NET_METER_INSTALLED
   * PAYMENT_PERCENT_REACHED
   */
  @Column({
    type: 'text',
  })
  milestone: string;

  /*
   * Used for numeric events.
   *
   * Example:
   * PAYMENT_PERCENT_REACHED = 20
   */
  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  value: number;

  /*
   * When the milestone actually happened.
   */
  @Column({
    type: 'timestamp',
  })
  achievedAt: Date;

  /*
   * Optional source table record ID.
   *
   * Execution activity ID,
   * loan detail ID,
   * subsidy detail ID,
   * electricity detail ID,
   * installment ID, etc.
   */
  @Column({
    type: 'int',
    nullable: true,
  })
  sourceId: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  recordedBy: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  recordedByName: string;

  @CreateDateColumn()
  createdAt: Date;
}