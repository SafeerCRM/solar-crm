import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ProjectDocumentDepartment {
  PROJECT_CREATION = 'PROJECT_CREATION',
  LOAN = 'LOAN',
  PROJECT_MANAGEMENT = 'PROJECT_MANAGEMENT',
  SUBSIDY = 'SUBSIDY',
  ELECTRICITY = 'ELECTRICITY',
  PAYMENT_COLLECTION = 'PAYMENT_COLLECTION',
  CUSTOMER = 'CUSTOMER',
  OTHER = 'OTHER',
}

export enum ProjectDocumentType {
  VENDOR_AGREEMENT = 'VENDOR_AGREEMENT',
  CLIENT_GPS_PHOTO = 'CLIENT_GPS_PHOTO',
  ROOF_GPS_PHOTO = 'ROOF_GPS_PHOTO',
  AADHAAR_CARD = 'AADHAAR_CARD',
  PAN_CARD = 'PAN_CARD',
  ELECTRICITY_BILL = 'ELECTRICITY_BILL',
  CANCEL_CHEQUE = 'CANCEL_CHEQUE',
  BANK_DIARY = 'BANK_DIARY',
  HOUSE_REGISTRY = 'HOUSE_REGISTRY',
  CLIENT_PHOTO = 'CLIENT_PHOTO',

  JAN_SAMARTH_DOCUMENT = 'JAN_SAMARTH_DOCUMENT',
  LOAN_SANCTION_LETTER = 'LOAN_SANCTION_LETTER',
  BANK_VISIT_PROOF = 'BANK_VISIT_PROOF',

  DCR_CERTIFICATE = 'DCR_CERTIFICATE',
  PANEL_WARRANTY_CARD = 'PANEL_WARRANTY_CARD',
  INVERTER_WARRANTY_CARD = 'INVERTER_WARRANTY_CARD',
  WCR_REPORT = 'WCR_REPORT',
  PLANT_GPS_PHOTO = 'PLANT_GPS_PHOTO',
  INVERTER_SERIAL_PHOTO = 'INVERTER_SERIAL_PHOTO',
  PANEL_SERIAL_PHOTO = 'PANEL_SERIAL_PHOTO',
  NET_METER_PHOTO = 'NET_METER_PHOTO',

  DISCOM_FILE = 'DISCOM_FILE',
  METER_TESTING_PROOF = 'METER_TESTING_PROOF',
  DEMAND_PAYMENT_PROOF = 'DEMAND_PAYMENT_PROOF',

  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',
  INVOICE_FILE = 'INVOICE_FILE',

  APPLICATION = 'APPLICATION',
E_TOKAN = 'E_TOKAN',
FEASIBILITY = 'FEASIBILITY',
NET_METERING = 'NET_METERING',
DIGITAL_LATTER = 'DIGITAL_LATTER',
RTS_VENDOR_FEASIBILITY_REPORT = 'RTS_VENDOR_FEASIBILITY_REPORT',
STATE_SUBSIDY = 'STATE_SUBSIDY',

TESTING_REPORT = 'TESTING_REPORT',
FILE_ACKNOWLEDGEMENT = 'FILE_ACKNOWLEDGEMENT',
DEMAND_ESTIMATE_NOTE = 'DEMAND_ESTIMATE_NOTE',

WCR = 'WCR',
DCR = 'DCR',
VENDOR_AGREEMENT_STAMP = 'VENDOR_AGREEMENT_STAMP',
PANEL_WARRANTY_CARD_DOCUMENT = 'PANEL_WARRANTY_CARD_DOCUMENT',
INVERTER_WARRANTY_CARD_DOCUMENT = 'INVERTER_WARRANTY_CARD_DOCUMENT',
FINAL_INVOICE = 'FINAL_INVOICE',

  OTHER = 'OTHER',
}

@Entity()
export class ProjectDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({
    type: 'enum',
    enum: ProjectDocumentDepartment,
    default: ProjectDocumentDepartment.PROJECT_CREATION,
  })
  department: ProjectDocumentDepartment;

  @Column({
    type: 'enum',
    enum: ProjectDocumentType,
  })
  documentType: ProjectDocumentType;

  @Column({ nullable: true })
  fileName: string;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ nullable: true })
  uploadedBy: number;

  @Column({ nullable: true })
  uploadedByRole: string;

  @Column({ type: 'simple-array', nullable: true })
  visibleToRoles: string[];

  @Column({ default: false })
  visibleToCustomer: boolean;

  @Column({ nullable: true, type: 'text' })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}