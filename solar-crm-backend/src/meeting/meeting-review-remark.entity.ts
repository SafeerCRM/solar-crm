import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('meeting_review_remark')
export class MeetingReviewRemark {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  meetingId: number;

  @Column({ nullable: true })
  meetingGroupId?: number;

  @Column({ type: 'text' })
  remark: string;

  @Column({ nullable: true })
  createdBy?: number;

  @Column({ type: 'text', nullable: true })
  createdByName?: string;

  @Column({ type: 'text', nullable: true })
  createdByRole?: string;

  @CreateDateColumn()
  createdAt: Date;
}