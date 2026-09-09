import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PortalDeviceType {
  CUSTOMER = 'CUSTOMER',
  DEALER = 'DEALER',
}

export enum PortalDevicePlatform {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
}

@Entity('portal_device_token')
@Index(['portalType', 'portalUserId'])
@Index(['fcmToken'], {
  unique: true,
})
@Index(['isActive'])
export class PortalDeviceToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: PortalDeviceType,
  })
  portalType: PortalDeviceType;

  @Column({
    type: 'int',
  })
  portalUserId: number;

  @Column({
    type: 'enum',
    enum: PortalDevicePlatform,
  })
  platform: PortalDevicePlatform;

  @Column({
    type: 'text',
  })
  fcmToken: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  deviceId: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  lastRegisteredAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}