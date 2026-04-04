import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Vendor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  companyName: string;

  @Column()
  mobile: string;

  @Column({ nullable: true })
  alternateMobile: string;

  @Column({ nullable: true })
  serviceType: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ nullable: true })
  region: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'text' })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}