import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

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

  @Column({ nullable: true })
  uploadedBy: number;

  @Column({ nullable: true })
  uploadedByName: string;

  @CreateDateColumn()
  createdAt: Date;
}