import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CustomerAnnouncementAudienceType {
  ALL = 'ALL',
  RUNNING_PROJECT = 'RUNNING_PROJECT',
  AFTER_SALES = 'AFTER_SALES',
  WITHOUT_PROJECT = 'WITHOUT_PROJECT',
  SPECIFIC_CUSTOMERS = 'SPECIFIC_CUSTOMERS',
}

export enum CustomerAnnouncementPublishType {
  NOW = 'NOW',
  SCHEDULED = 'SCHEDULED',
}

@Entity()
@Index(['isActive'])
@Index(['publishAt'])
export class CustomerAnnouncement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 250 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: CustomerAnnouncementAudienceType,
    default: CustomerAnnouncementAudienceType.ALL,
  })
  audienceType: CustomerAnnouncementAudienceType;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => "'[]'",
  })
  cities: string[];

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => "'[]'",
  })
  branches: string[];

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => "'[]'",
  })
  projectStatuses: string[];

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => "'[]'",
  })
  specificCustomerIds: number[];

  @Column({ default: true })
  popupRequired: boolean;

  @Column({ default: true })
  pushRequired: boolean;

  @Column({
    type: 'enum',
    enum: CustomerAnnouncementPublishType,
    default: CustomerAnnouncementPublishType.NOW,
  })
  publishType: CustomerAnnouncementPublishType;

  @Column({ type: 'timestamp', nullable: true })
  publishAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'int', nullable: true })
  createdBy?: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  createdByName?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  createdByRole?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}