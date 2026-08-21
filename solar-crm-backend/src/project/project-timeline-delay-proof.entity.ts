import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('project_timeline_delay_proofs')
export class ProjectTimelineDelayProof {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
  })
  delayNoteId: number;

  @Column({
    type: 'int',
  })
  projectId: number;

  @Column({
    type: 'int',
  })
  timelineRuleId: number;

  @Column({
    type: 'text',
  })
  fileUrl: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  uploadedBy: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  uploadedByName: string;

  @CreateDateColumn()
  createdAt: Date;
}