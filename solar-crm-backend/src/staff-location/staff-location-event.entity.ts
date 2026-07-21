import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  StaffLocationEventType,
  StaffLocationTrackingStatus,
} from './staff-location.enums';

@Entity('staff_location_event')
@Index('IDX_staff_location_event_session_occurred', [
  'sessionId',
  'occurredAt',
])
@Index('IDX_staff_location_event_user_occurred', [
  'staffUserId',
  'occurredAt',
])
@Index('IDX_staff_location_event_type_occurred', [
  'eventType',
  'occurredAt',
])
export class StaffLocationEvent {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: string;

  @Column({ type: 'int' })
  sessionId: number;

  @Column({ type: 'int' })
  staffUserId: number;

  /**
   * User who caused the event when applicable.
   *
   * Examples:
   * - OWNER starting/stopping tracking
   * - staff accepting the request
   *
   * Null means the system/device produced the event.
   */
  @Column({ type: 'int', nullable: true })
  actorUserId: number | null;

  @Column({
    type: 'enum',
    enum: StaffLocationEventType,
  })
  eventType: StaffLocationEventType;

  @Column({
    type: 'enum',
    enum: StaffLocationTrackingStatus,
    nullable: true,
  })
  previousStatus: StaffLocationTrackingStatus | null;

  @Column({
    type: 'enum',
    enum: StaffLocationTrackingStatus,
    nullable: true,
  })
  newStatus: StaffLocationTrackingStatus | null;

  @Column({ type: 'varchar', length: 500 })
  message: string;

  /**
   * Structured technical information such as:
   * battery state, accuracy, platform, app version, or device error.
   *
   * It must never contain an authentication token.
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  /**
   * Time supplied by the phone/system when the event happened.
   */
  @Column({ type: 'timestamptz' })
  occurredAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}