import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
  OWNER = 'OWNER',
  TELECALLING_MANAGER = 'TELECALLING_MANAGER',
  TELECALLING_ASSISTANT = 'TELECALLING_ASSISTANT',
  LEAD_MANAGER = 'LEAD_MANAGER',
  LEAD_EXECUTIVE = 'LEAD_EXECUTIVE',
  MARKETING_HEAD = 'MARKETING_HEAD',
  MEETING_MANAGER = 'MEETING_MANAGER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  PROJECT_EXECUTIVE = 'PROJECT_EXECUTIVE',
  CUSTOMER = 'CUSTOMER',
  TELECALLER = 'TELECALLER',
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
    type: 'simple-array',
    nullable: true,
  })
  roles: UserRole[];

  @CreateDateColumn()
  createdAt: Date;
}