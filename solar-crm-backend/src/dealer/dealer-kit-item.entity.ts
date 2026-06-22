import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('dealer_kit_item')
export class DealerKitItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  kitId: number;

  @Column({ type: 'text', nullable: true })
  material: string;

  @Column({ type: 'text', nullable: true })
  brandSizeType: string;

  @Column({ type: 'text', nullable: true })
  quantity: string;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}