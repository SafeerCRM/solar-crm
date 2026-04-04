import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum MasterType {
  ZONE = 'ZONE',
  REGION = 'REGION',
  LEAD_SOURCE = 'LEAD_SOURCE',
  LEAD_STATUS = 'LEAD_STATUS',
  TELECALLING_STATUS = 'TELECALLING_STATUS',
}

@Entity()
export class MasterData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: MasterType,
  })
  type: MasterType;

  @Column()
  value: string;

  @Column({ nullable: true })
  parentId: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}