import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('project_timeline_delay_notes')
export class ProjectTimelineDelayNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
  })
  projectId: number;

  @Column({
    type: 'int',
  })
  timelineRuleId: number;

  /*
   * Genuine reason why the milestone could not
   * be completed within the configured timeline.
   */
  @Column({
    type: 'text',
  })
  remark: string;

  /*
   * Optional date communicated by staff for
   * expected resolution/completion.
   *
   * This does NOT automatically extend the SLA.
   */
  @Column({
    type: 'date',
    nullable: true,
  })
  expectedResolutionDate: string;

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