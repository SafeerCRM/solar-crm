import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('solar_mitra_meeting_document')
export class SolarMitraMeetingDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  meetingId: number;

  /*
   * Generic on purpose.
   * Examples later could be Aadhaar,
   * PAN, visiting card, agreement, etc.
   */
  @Column({ type: 'text', nullable: true })
  documentName: string | null;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ type: 'text', nullable: true })
  fileName: string | null;

  @Column({ type: 'text', nullable: true })
  mimeType: string | null;

  @Column({ default: false })
  isHidden: boolean;

  @Column({
  type: 'integer',
  nullable: true,
})
uploadedBy: number | null;

  @Column({ type: 'text', nullable: true })
  uploadedByName: string | null;

  @CreateDateColumn()
  createdAt: Date;
}