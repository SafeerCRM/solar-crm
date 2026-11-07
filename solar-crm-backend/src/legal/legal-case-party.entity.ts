
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum LegalPartyType {
  COMPANY = 'COMPANY',
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  VENDOR = 'VENDOR',
  DEALER = 'DEALER',
  OTHER = 'OTHER',
}

export enum LegalPartyRole {
  COMPLAINANT = 'COMPLAINANT',
  RESPONDENT = 'RESPONDENT',
  PETITIONER = 'PETITIONER',
  DEFENDANT = 'DEFENDANT',
  WITNESS = 'WITNESS',
  OTHER = 'OTHER',
}

@Entity('legal_case_party')
export class LegalCaseParty {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  caseId: number;

  @Column({
    type: 'enum',
    enum: LegalPartyType,
  })
  partyType: LegalPartyType;

  @Column({
    type: 'enum',
    enum: LegalPartyRole,
  })
  partyRole: LegalPartyRole;

  @Column({ type: 'int', nullable: true })
  linkedRecordId: number | null;

  @Column({ type: 'varchar', length: 255 })
  partyName: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'boolean', default: false })
  isPrimaryParty: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
