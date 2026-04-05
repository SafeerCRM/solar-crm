import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
  OWNER = 'OWNER',
  TELECALLING_MANAGER = 'TELECALLING_MANAGER',
  LEAD_MANAGER = 'LEAD_MANAGER',
  MEETING_MANAGER = 'MEETING_MANAGER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
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