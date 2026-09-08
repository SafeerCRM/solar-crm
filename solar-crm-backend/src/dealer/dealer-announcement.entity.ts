import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DealerAnnouncementAudienceType {
  ALL_DEALERS = 'ALL_DEALERS',
  SPECIFIC_DEALERS = 'SPECIFIC_DEALERS',
}

export enum DealerAnnouncementPublishType {
  NOW = 'NOW',
  SCHEDULED = 'SCHEDULED',
}

@Entity('dealer_announcement')
@Index(['isActive'])
@Index(['publishAt'])
export class DealerAnnouncement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 250,
  })
  title: string;

  @Column({
    type: 'text',
  })
  message: string;

  @Column({
    type: 'enum',
    enum: DealerAnnouncementAudienceType,
    default:
      DealerAnnouncementAudienceType.ALL_DEALERS,
  })
  audienceType:
    DealerAnnouncementAudienceType;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  specificDealerIds:
    number[] | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  popupRequired: boolean;

  @Column({
    type: 'boolean',
    default: true,
  })
  pushRequired: boolean;

  @Column({
    type: 'enum',
    enum: DealerAnnouncementPublishType,
    default:
      DealerAnnouncementPublishType.NOW,
  })
  publishType:
    DealerAnnouncementPublishType;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  publishAt:
    Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  publishedAt:
    Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  expiresAt:
    Date | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  isHidden: boolean;

  @Column({
    type: 'int',
    nullable: true,
  })
  createdBy:
    number | null;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  createdByName:
    string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  createdByRole:
    string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}