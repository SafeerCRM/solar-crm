import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('project_stock_files')
export class ProjectStockFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  allocationType: string | null;

  @Column({ type: 'int', nullable: true })
  dealerId: number | null;

  @Column({ type: 'text', nullable: true })
  dealerName: string | null;

  @Column({ type: 'text', nullable: true })
  dealerProjectReference: string | null;

  @Column({ type: 'int', nullable: true })
  projectId: number | null;

  @Column({ type: 'text', nullable: true })
  projectName: string | null;

  @Column({ type: 'text', nullable: true })
  projectKNumber: string | null;

  @Column({ type: 'text' })
  originalFileName: string;

  @Column({ type: 'text' })
  filePath: string;

  @Column({ type: 'text', nullable: true })
  mimeType: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ type: 'int', nullable: true })
  uploadedBy: number;

  @Column({ type: 'text', nullable: true })
  uploadedByName: string;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;
}