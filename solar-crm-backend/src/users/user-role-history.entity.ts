import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('user_role_history')
@Index(['userId', 'createdAt'])
export class UserRoleHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'text', nullable: true })
  previousRoles: string;

  @Column({ type: 'text' })
  newRoles: string;

  @Column({ type: 'int', nullable: true })
  changedBy: number;

  @Column({ type: 'text', nullable: true })
  changedByName: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
  })
  createdAt: Date;
}