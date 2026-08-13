import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectDealerOrderDocument {
  @PrimaryGeneratedColumn()
  id: number;

  /*
   * Permanent link to the Dealer Order / DO.
   */
  @Column()
  dealerOrderId: number;

  /*
   * Stored as well so dealer ownership checks
   * do not depend only on the order lookup.
   */
  @Column()
  dealerId: number;

  @Column({ nullable: true })
  dealerName: string;

  /*
   * Completely flexible metadata.
   *
   * No enums intentionally:
   * client/dealer can introduce new document
   * categories/types without code changes.
   */
  @Column()
  title: string;

  @Column()
  category: string;

  @Column()
  documentType: string;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  tags: string[];

  @Column({
    type: 'text',
    nullable: true,
  })
  remarks: string;

  /*
   * Uploaded file information.
   */
  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({
    nullable: true,
  })
  filePath: string;

  @Column({
    nullable: true,
  })
  mimeType: string;

  @Column({
    type: 'int',
    default: 0,
  })
  fileSize: number;

  /*
   * Audit information.
   *
   * uploadedSource clearly tells us whether
   * the document came from CRM or Dealer Portal.
   */
  @Column({
    nullable: true,
  })
  uploadedBy: number;

  @Column({
    nullable: true,
  })
  uploadedByName: string;

  @Column({
    nullable: true,
  })
  uploadedByRole: string;

  @Column({
    default: 'CRM',
  })
  uploadedSource: string;

  /*
   * Soft-delete / restore support.
   *
   * We do not physically delete the file because
   * these documents form the permanent DO record.
   */
  @Column({
    default: false,
  })
  isHidden: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  hiddenAt: Date;

  @Column({
    nullable: true,
  })
  hiddenBy: number;

  @Column({
    nullable: true,
  })
  hiddenByName: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  hiddenReason: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  restoredAt: Date;

  @Column({
    nullable: true,
  })
  restoredBy: number;

  @Column({
    nullable: true,
  })
  restoredByName: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  restoreReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}