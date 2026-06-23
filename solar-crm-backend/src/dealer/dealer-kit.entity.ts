import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dealer_kit')
export class DealerKit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  kitName: string;

  @Column({ type: 'text', nullable: true })
  shortDescription: string;

  @Column({ type: 'text', nullable: true })
  displayBrand: string;

  @Column({ type: 'text', nullable: true })
  displayCapacity: string;

  @Column({ type: 'numeric', default: 0 })
  sellingPrice: number;

  @Column({ type: 'numeric', default: 0 })
  gstPercent: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'text', default: 'EXCLUDING' })
gstMode: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ type: 'text', nullable: true })
  hiddenByName: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ type: 'text', nullable: true })
  createdByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}