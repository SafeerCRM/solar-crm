import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
  OWNER = 'OWNER',
  LEAD_MANAGER = 'LEAD_MANAGER',
  TELECALLER = 'TELECALLER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TELECALLER,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;
}