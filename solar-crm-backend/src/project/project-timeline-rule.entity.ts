import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectTimelineModule {
  EXECUTION = 'EXECUTION',
  LOAN = 'LOAN',
  SUBSIDY = 'SUBSIDY',
  ELECTRICITY = 'ELECTRICITY',
  PAYMENT = 'PAYMENT',
  CONTRACTOR = 'CONTRACTOR',
}

export enum ProjectTimelineTriggerType {
  PAYMENT_PERCENT_REACHED =
    'PAYMENT_PERCENT_REACHED',

  PROJECT_CREATED =
    'PROJECT_CREATED',
}

export enum ProjectTimelineApplicableProjectType {
  ALL = 'ALL',
  CASH = 'CASH',
  LOAN = 'LOAN',
}

@Entity('project_timeline_rules')
export class ProjectTimelineRule {
  @PrimaryGeneratedColumn()
  id: number;

  /*
   * Friendly OWNER-defined name.
   *
   * Examples:
   * Installation Completion
   * Generation Started
   * Loan Disbursement
   */
  @Column({ type: 'text' })
  name: string;

  /*
 * What starts the timeline.
 *
 * Supported triggers:
 *
 * PAYMENT_PERCENT_REACHED
 * -> starts when approved project payment
 *    reaches the configured percentage.
 *
 * PROJECT_CREATED
 * -> starts from the project's createdAt date.
 */
  @Column({
    type: 'enum',
    enum: ProjectTimelineTriggerType,
    default:
      ProjectTimelineTriggerType.PAYMENT_PERCENT_REACHED,
  })
  triggerType: ProjectTimelineTriggerType;

  /*
   * Example:
   * 20 = timeline starts when approved payment
   * reaches 20% of applicable project amount.
   */
  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 20,
  })
  triggerValue: number;

  /*
   * Module containing the target milestone.
   */
  @Column({
    type: 'enum',
    enum: ProjectTimelineModule,
  })
  targetModule: ProjectTimelineModule;

  /*
   * Exact existing CRM milestone/status value.
   *
   * Examples:
   * INVERTER_INSTALLED
   * GENERATION_STARTED
   * IN_PRINCIPAL_GENERATED
   * SUBSIDY_REQUESTED
   * NET_METER_INSTALLED
   * PAYMENT_PERCENT_REACHED
   *
   * This is intentionally text because every
   * CRM department uses its own enum.
   */
  @Column({ type: 'text' })
  targetMilestone: string;

  /*
   * Used where the target itself requires a value.
   *
   * Example:
   * PAYMENT + PAYMENT_PERCENT_REACHED + 100
   *
   * Not required for Execution / Loan /
   * Subsidy / Electricity statuses.
   */
  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  targetValue: number;

  /*
   * ALL / CASH / LOAN.
   */
  @Column({
    type: 'enum',
    enum: ProjectTimelineApplicableProjectType,
    default:
      ProjectTimelineApplicableProjectType.ALL,
  })
  applicableProjectType:
    ProjectTimelineApplicableProjectType;

  /*
   * OWNER controlled SLA duration.
   *
   * Examples: 2, 7, 10, 20, 30.
   */
  @Column({
    type: 'int',
    default: 0,
  })
  allowedDays: number;

  /*
   * Whether staff should provide a reason when
   * the target has crossed its timeline.
   */
  @Column({
    type: 'boolean',
    default: true,
  })
  requireDelayExplanation: boolean;

  /*
   * Whether delay evidence photo(s) are expected.
   */
  @Column({
    type: 'boolean',
    default: false,
  })
  requireDelayPhoto: boolean;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({
    type: 'int',
    default: 0,
  })
  sortOrder: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  createdBy: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  createdByName: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  updatedBy: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  updatedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}