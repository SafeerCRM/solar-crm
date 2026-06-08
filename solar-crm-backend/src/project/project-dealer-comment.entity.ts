import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectDealerComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dealerOrderId: number;

  @Column()
  dealerId: number;

  @Column({ nullable: true })
  dealerName: string;

  @Column({ type: 'text' })
  comment: string;

  @Column({ nullable: true })
  commentType: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ nullable: true })
  createdByRole: string;

  @CreateDateColumn()
  createdAt: Date;
}