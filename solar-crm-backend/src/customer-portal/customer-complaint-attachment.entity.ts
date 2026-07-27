import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum CustomerComplaintAttachmentPurpose {
  CUSTOMER_ATTACHMENT = 'CUSTOMER_ATTACHMENT',
  BEFORE_PHOTO = 'BEFORE_PHOTO',
  AFTER_PHOTO = 'AFTER_PHOTO',
  COMPLETION_PHOTO = 'COMPLETION_PHOTO',
  OTHER = 'OTHER',
}

@Entity()
export class CustomerComplaintAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  complaintId: number;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  fileName: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({
  type: 'enum',
  enum: CustomerComplaintAttachmentPurpose,
  default: CustomerComplaintAttachmentPurpose.CUSTOMER_ATTACHMENT,
})
purpose: CustomerComplaintAttachmentPurpose;

@Column({ nullable: true })
mimeType: string;

@Column({ type: 'text', nullable: true })
remarks: string;

@Column({ nullable: true })
uploadedByRole: string;

  @Column({ nullable: true })
  uploadedBy: number;

  @Column({ nullable: true })
  uploadedByName: string;

  @CreateDateColumn()
  createdAt: Date;
}