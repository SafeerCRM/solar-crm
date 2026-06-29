import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectStatus {
  NEW = 'NEW',
  SURVEY = 'SURVEY',
  QUOTATION = 'QUOTATION',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  INSTALLATION = 'INSTALLATION',
  COMPLETED = 'COMPLETED',

  // New safe project workflow statuses
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
  LOAN_PROCESS = 'LOAN_PROCESS',
  PROJECT_MANAGEMENT = 'PROJECT_MANAGEMENT',
  SUBSIDY_PROCESS = 'SUBSIDY_PROCESS',
  ELECTRICITY_PROCESS = 'ELECTRICITY_PROCESS',
}

export enum ProjectType {
  CASH = 'CASH',
  LOAN = 'LOAN',
}

export enum ProjectApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum SubsidyType {
  NATIONAL = 'NATIONAL',
  NATIONAL_STATE = 'NATIONAL_STATE',
}

export enum DiscomExpenditureType {
  INCLUDING = 'INCLUDING',
  EXCLUDING = 'EXCLUDING',
}

export enum ProjectWorkState {
  IN_PROCESS = 'IN_PROCESS',
  RUNNING = 'RUNNING',
}

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  leadId: number;

  @Column({ nullable: true })
  meetingId: number;

  @Column({ nullable: true })
  proposalId: number;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
projectOwnerId: number;

@Column({ nullable: true })
projectOwnerName: string;

@Column({ nullable: true })
projectOwnerRole: string;

@Column({ nullable: true })
telecallerId: number;

@Column({ nullable: true })
telecallerName: string;

@Column({ nullable: true })
telecallerRole: string;

@Column({ nullable: true })
telecallingAssistantId: number;

@Column({ nullable: true })
telecallingAssistantName: string;

@Column({ nullable: true })
telecallingAssistantRole: string;

@Column({ nullable: true })
leadManagerId: number;

@Column({ nullable: true })
leadManagerName: string;

@Column({ nullable: true })
leadManagerRole: string;

@Column({ nullable: true })
meetingManagerId: number;

@Column({ nullable: true })
meetingManagerName: string;

@Column({ nullable: true })
meetingManagerRole: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ nullable: true })
  city: string;

    @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gpsLongitude: number;

  @Column({ type: 'text', nullable: true })
  gpsAddress: string;

  @Column({ nullable: true })
branchName: string;

  @Column({ nullable: true })
  electricityKNumber: string;

  @Column({ nullable: true })
  customerGmail: string;

  @Column({ nullable: true })
customerUserId: number;

@Column({ nullable: true })
customerUserName: string;

@Column({ nullable: true })
solarFranchiseUserId: number;

@Column({ nullable: true })
solarFranchiseName: string;

@Column({ nullable: true })
solarFranchisePhone: string;

  @Column({ nullable: true })
  aadhaarLinkedMobile: string;

  @Column({ nullable: true })
customerId: number;

@Column({ nullable: true })
customerCode: string;

  @Column({ nullable: true })
  projectSerial: string;

  @Column({ type: 'timestamp', nullable: true })
  orderDate: Date;

  @Column({ nullable: true })
  panelBrand: string;

  @Column({ nullable: true, default: 0 })
  dcrPanelCount: number;

  @Column({ nullable: true, default: 0 })
  nonDcrPanelCount: number;

  @Column({ nullable: true })
  converterBrand: string;

  @Column({ nullable: true })
  converterCapacity: string;

  @Column({ nullable: true })
  converterPhase: string;

  @Column({ nullable: true })
  structureType: string;

  @Column({ nullable: true })
  structureCapacityKw: string;

  @Column({ nullable: true })
  buildingHeight: string;

  @Column({
    type: 'enum',
    enum: ProjectType,
    nullable: true,
  })
  projectType: ProjectType;

  @Column({ nullable: true, default: 0 })
  marginMoney: number;

  @Column({ nullable: true, default: 0 })
  loanAmount: number;

  @Column({
    type: 'enum',
    enum: SubsidyType,
    nullable: true,
  })
  subsidyType: SubsidyType;

  @Column({ nullable: true })
  projectSize: string;

  @Column({ nullable: true, default: 0 })
finalCost: number;

  @Column({ nullable: true, default: 0 })
  projectCost: number;

  @Column({ nullable: true, default: 0 })
  subsidy: number;

  @Column({ nullable: true, default: 0 })
  netAmount: number;

  @Column({ nullable: true })
  discomName: string;

  @Column({
    type: 'enum',
    enum: DiscomExpenditureType,
    nullable: true,
  })
  discomExpenditureType: DiscomExpenditureType;

  @Column({ nullable: true, default: 0 })
  discomExpenditureAmount: number;

  @Column({ nullable: true, default: 0 })
  expectedLagat: number;

  @Column({ nullable: true, default: 0 })
  expectedProfit: number;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PENDING_APPROVAL,
  })
  status: ProjectStatus;

  @Column({ nullable: true, default: 'IN_PROCESS' })
projectWorkState: string;

@Column({ nullable: true, type: 'text' })
projectWorkStateReason: string;

@Column({ type: 'timestamp', nullable: true })
projectWorkStateUpdatedAt: Date;

@Column({ nullable: true })
projectWorkStateUpdatedBy: number;

@Column({ nullable: true })
projectWorkStateUpdatedByName: string;

  @Column({
  type: 'enum',
  enum: ProjectApprovalStatus,
  default: ProjectApprovalStatus.PENDING,
})
projectManagerApprovalStatus: ProjectApprovalStatus;

@Column({ nullable: true, type: 'text' })
projectManagerApprovalNote: string;

@Column({ nullable: true })
projectManagerApprovedBy: number;

@Column({ type: 'timestamp', nullable: true })
projectManagerApprovedAt: Date;

  @Column({
    type: 'enum',
    enum: ProjectApprovalStatus,
    default: ProjectApprovalStatus.PENDING,
  })
  marketingHeadApprovalStatus: ProjectApprovalStatus;

  @Column({ nullable: true, type: 'text' })
  marketingHeadApprovalNote: string;

  @Column({ nullable: true })
  marketingHeadApprovedBy: number;

  @Column({ type: 'timestamp', nullable: true })
  marketingHeadApprovedAt: Date;

  @Column({
    type: 'enum',
    enum: ProjectApprovalStatus,
    default: ProjectApprovalStatus.PENDING,
  })
  ownerApprovalStatus: ProjectApprovalStatus;

  @Column({ nullable: true, type: 'text' })
  ownerApprovalNote: string;

  @Column({ nullable: true })
  ownerApprovedBy: number;

  @Column({ type: 'timestamp', nullable: true })
  ownerApprovedAt: Date;

  @Column({ nullable: true })
  vendorId: number;

  @Column({ nullable: true })
  paymentStatus: string;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expectedCompletionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualCompletionDate: Date;

  @Column({ nullable: true, type: 'text' })
  remarks: string;

  @Column({ nullable: true })
projectSource: string;

@Column({ nullable: true })
legacyYear: number;

@Column({ type: 'timestamp', nullable: true })
legacyImportedAt: Date;

@Column({ type: 'text', nullable: true })
legacyRemarks: string;

    @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelledBy: number;

  @Column({ nullable: true })
  cancelledByName: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'boolean', default: false })
isHidden: boolean;

@Column({ type: 'timestamp', nullable: true })
hiddenAt: Date;

@Column({ nullable: true })
hiddenBy: number;

@Column({ nullable: true })
hiddenByName: string;

@Column({ type: 'text', nullable: true })
hiddenReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}