import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class GlobalDocumentVault {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  category: string;

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

  @Column({
  type: 'timestamp',
  nullable: true,
})
lastEditedAt: Date;

@Column({
  nullable: true,
})
lastEditedBy: number;

@Column({
  nullable: true,
})
lastEditedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}