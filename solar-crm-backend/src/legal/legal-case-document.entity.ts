import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('legal_case_document')
export class LegalCaseDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  caseId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'text' })
  filePath: string;

  @Column({ type: 'varchar', length: 150 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: string;

  @Column({ type: 'int', nullable: true })
  uploadedBy: number | null;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  hiddenAt: Date | null;

  @Column({ type: 'int', nullable: true })
  hiddenBy: number | null;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}