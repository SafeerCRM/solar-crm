import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum StaffAssetType {
  LAPTOP = 'LAPTOP',
  MOBILE = 'MOBILE',
  SIM = 'SIM',
  VEHICLE = 'VEHICLE',
  OTHER = 'OTHER',
}

@Entity()
export class StaffAsset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  staffId: number;

  @Column({
    type: 'enum',
    enum: StaffAssetType,
    default: StaffAssetType.OTHER,
  })
  assetType: StaffAssetType;

  @Column()
  assetName: string;

  @Column({ nullable: true })
  assetNumber: string;

  @Column({ type: 'date', nullable: true })
  assignedDate: string;

  @Column({ type: 'date', nullable: true })
  returnedDate: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;
}