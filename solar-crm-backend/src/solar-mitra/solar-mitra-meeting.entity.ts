import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SolarMitraMeetingStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

@Entity('solar_mitra_meeting')
export class SolarMitraMeeting {
  @PrimaryGeneratedColumn()
  id: number;

  /*
   * Filled after the prospect becomes a
   * Solar Mitra, or immediately when the
   * meeting belongs to an existing Mitra.
   */
  @Index()
  @Column({
  type: 'integer',
  nullable: true,
})
solarMitraId: number | null;

  @Column({ type: 'text', nullable: true })
  solarMitraName: string | null;

  /*
   * Prospect / person details.
   * These remain as a historical snapshot
   * even after Solar Mitra creation.
   */
  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  primaryPhone: string;

  @Column({ type: 'text', nullable: true })
  businessName: string | null;

  @Column({ type: 'text', nullable: true })
  area: string | null;

  @Column({ type: 'text', nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  /*
   * GPS captured during the meeting.
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  gpsLatitude: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  gpsLongitude: number | null;

  @Column({ type: 'text', nullable: true })
  gpsAddress: string | null;

  /*
   * Maximum two meeting/site photos will
   * be enforced by the service.
   */
  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  photoUrls: string[];

  @Column({ type: 'text', nullable: true })
  audioUrl: string | null;

  @Column({
    type: 'enum',
    enum: SolarMitraMeetingStatus,
    default:
      SolarMitraMeetingStatus.SCHEDULED,
  })
  status: SolarMitraMeetingStatus;

  @Column({
    type: 'timestamp without time zone',
  })
  meetingDateTime: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    type: 'timestamp without time zone',
    nullable: true,
  })
  nextFollowUpAt: Date | null;

  /*
   * Franchise Manager responsible for
   * this meeting.
   */
  @Index()
  @Column()
  franchiseManagerId: number;

  @Column({ type: 'text' })
  franchiseManagerName: string;

  /*
   * Conversion information.
   */
  @Column({ default: false })
  convertedToSolarMitra: boolean;

  @Column({
    type: 'timestamp without time zone',
    nullable: true,
  })
  convertedAt: Date | null;

  @Column({
  type: 'integer',
  nullable: true,
})
convertedBy: number | null;

  @Column({ type: 'text', nullable: true })
  convertedByName: string | null;

  @Column({ default: false })
  isHidden: boolean;

  @Column({
  type: 'integer',
  nullable: true,
})
createdBy: number | null;

  @Column({ type: 'text', nullable: true })
  createdByName: string | null;

  @Column({
  type: 'integer',
  nullable: true,
})
updatedBy: number | null;

  @Column({ type: 'text', nullable: true })
  updatedByName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}