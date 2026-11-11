import { Repository } from 'typeorm';

import { StaffMember } from '../../staff/staff-member.entity';
import { StaffAttendance } from '../../staff/staff-attendance.entity';
import { StaffLeave } from '../../staff/staff-leave.entity';
import { StaffAttendanceException } from '../../staff/staff-attendance-exception.entity';
import { StaffAttendanceOverride } from '../../staff/staff-attendance-override.entity';
import { StaffPenalty } from '../../staff/staff-penalty.entity';
import { StaffPayroll } from '../../staff/staff-payroll.entity';
import { StaffPerformance } from '../../staff/staff-performance.entity';
import { RecruitmentCandidate } from '../../staff/recruitment-candidate.entity';
import { RecruitmentCandidateDocument } from '../../staff/recruitment-candidate-document.entity';
import { StaffDocument } from '../../staff/staff-document.entity';
import { StaffComplaint } from '../../staff-complaint/staff-complaint.entity';
import { StaffLocationTrackingSession } from '../../staff-location/staff-location-tracking-session.entity';
import { StaffLocationEvent } from '../../staff-location/staff-location-event.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class HrStaffManagementActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'HR_STAFF_MANAGEMENT';
  readonly moduleLabel = 'HR & Staff Management';

  constructor(
    private readonly staffMemberRepository: Repository<StaffMember>,
    private readonly attendanceRepository: Repository<StaffAttendance>,
    private readonly leaveRepository: Repository<StaffLeave>,
    private readonly attendanceExceptionRepository:
  Repository<StaffAttendanceException>,

  private readonly attendanceOverrideRepository:
  Repository<StaffAttendanceOverride>,

  private readonly staffPenaltyRepository: Repository<StaffPenalty>,

  private readonly staffPayrollRepository: Repository<StaffPayroll>,

  private readonly staffPerformanceRepository:
  Repository<StaffPerformance>,

  private readonly recruitmentCandidateRepository:
  Repository<RecruitmentCandidate>,

private readonly recruitmentDocumentRepository:
  Repository<RecruitmentCandidateDocument>,

  private readonly staffDocumentRepository:
  Repository<StaffDocument>,

private readonly staffComplaintRepository:
  Repository<StaffComplaint>,

  private readonly staffLocationSessionRepository:
  Repository<StaffLocationTrackingSession>,

  private readonly staffLocationEventRepository:
  Repository<StaffLocationEvent>,
  ) {}

  async build(
    context: AnalyticsActivityContext,
  ): Promise<AnalyticsActivitySection> {
    const userIds = context.userIds;

    const emptyResult = (): AnalyticsActivitySection => ({
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics: [],
      hasActivity: false,
    });

    if (!userIds.length) {
      return emptyResult();
    }

    // Staff IDs are different from CRM user IDs.
    // Include every staff record linked to the selected users,
    // including historical/hidden staff records.
    const staffRecords = await this.staffMemberRepository
      .createQueryBuilder('staff')
      .select('staff.id', 'id')
      .where('staff.linkedUserId IN (:...userIds)', { userIds })
      .getRawMany<{ id: number }>();

    const staffIds = [
      ...new Set(staffRecords.map((row) => Number(row.id))),
    ];

    const metrics: AnalyticsActivitySection['metrics'] = [];

    const add = (
      key: string,
      label: string,
      kind: AnalyticsActivitySection['metrics'][number]['kind'],
      value: number,
      attribution: string,
      timeScope: 'CURRENT' | 'PERIOD',
      description?: string,
    ) => {
      metrics.push({
        key,
        label,
        kind,
        value,
        attribution,
        timeScope,
        unit: 'COUNT',
        ...(description ? { description } : {}),
      });
    };

    if (staffIds.length) {
      const attendance = () =>
        this.attendanceRepository
          .createQueryBuilder('attendance')
          .where('attendance.staffId IN (:...staffIds)', {
            staffIds,
          });

      const periodAttendance = () =>
        attendance()
          .andWhere(
            'attendance.attendanceDate >= :fromDate AND attendance.attendanceDate <= :toDate',
            {
              fromDate: context.fromDate.toISOString().slice(0, 10),
              toDate: context.toDate.toISOString().slice(0, 10),
            },
          );

      const [
        totalAttendanceRecords,
        periodAttendanceRecords,
        presentDays,
        halfDays,
        absentDays,
        leaveDays,
      ] = await Promise.all([
        attendance().getCount(),
        periodAttendance().getCount(),

        periodAttendance()
          .andWhere('attendance.status = :status', {
            status: 'PRESENT',
          })
          .getCount(),

        periodAttendance()
          .andWhere('attendance.status = :status', {
            status: 'HALF_DAY',
          })
          .getCount(),

        periodAttendance()
          .andWhere('attendance.status = :status', {
            status: 'ABSENT',
          })
          .getCount(),

        periodAttendance()
          .andWhere('attendance.status = :status', {
            status: 'LEAVE',
          })
          .getCount(),
      ]);

      const attribution =
        'staff_attendance.staffId → staff_member.linkedUserId';

      const description =
        'Employee attendance record; not an HR administrative action.';

      add(
        'attendance_total_records',
        'Total Attendance Records',
        'OUTCOME',
        totalAttendanceRecords,
        attribution,
        'CURRENT',
        description,
      );

      add(
        'attendance_period_records',
        'Attendance Records in Period',
        'OUTCOME',
        periodAttendanceRecords,
        attribution,
        'PERIOD',
        description,
      );

      add(
        'attendance_present_days',
        'Present Days',
        'OUTCOME',
        presentDays,
        attribution,
        'PERIOD',
        description,
      );

      add(
        'attendance_half_days',
        'Half Days',
        'OUTCOME',
        halfDays,
        attribution,
        'PERIOD',
        description,
      );

      add(
        'attendance_absent_days',
        'Absent Days',
        'OUTCOME',
        absentDays,
        attribution,
        'PERIOD',
        description,
      );

      add(
        'attendance_leave_days',
        'Attendance Marked Leave',
        'OUTCOME',
        leaveDays,
        attribution,
        'PERIOD',
        description,
      );

            // Leave records belong to staff members, not directly to CRM users.
      const leaves = () =>
        this.leaveRepository
          .createQueryBuilder('leave')
          .where('leave.staffId IN (:...staffIds)', { staffIds })
          .andWhere('leave.isHidden = false');

      const periodLeaves = () =>
        leaves().andWhere(
          'leave.createdAt >= :fromDate AND leave.createdAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        );

      const [
        totalLeaveRequests,
        periodLeaveRequests,
        pendingLeaveRequests,
        approvedLeaveRequests,
        rejectedLeaveRequests,
        cancelledLeaveRequests,
        periodApprovedLeaveRequests,
      ] = await Promise.all([
        leaves().getCount(),
        periodLeaves().getCount(),

        leaves()
          .andWhere('leave.status = :status', { status: 'PENDING' })
          .getCount(),

        leaves()
          .andWhere('leave.status = :status', { status: 'APPROVED' })
          .getCount(),

        leaves()
          .andWhere('leave.status = :status', { status: 'REJECTED' })
          .getCount(),

        leaves()
          .andWhere('leave.status = :status', { status: 'CANCELLED' })
          .getCount(),

        periodLeaves()
          .andWhere('leave.status = :status', { status: 'APPROVED' })
          .getCount(),
      ]);

      const leaveAttribution =
        'staff_leave.staffId → staff_member.linkedUserId';

      const leaveDescription =
        'Leave request associated with the employee; not an HR approval action.';

      add(
        'leave_total_requests',
        'Total Leave Requests',
        'CREATED_WORK',
        totalLeaveRequests,
        leaveAttribution,
        'CURRENT',
        leaveDescription,
      );

      add(
        'leave_period_requests',
        'Leave Requests Created in Period',
        'CREATED_WORK',
        periodLeaveRequests,
        leaveAttribution,
        'PERIOD',
        leaveDescription,
      );

      add(
        'leave_pending_requests',
        'Pending Leave Requests',
        'PIPELINE',
        pendingLeaveRequests,
        leaveAttribution,
        'CURRENT',
        leaveDescription,
      );

      add(
        'leave_approved_requests',
        'Approved Leave Requests',
        'OUTCOME',
        approvedLeaveRequests,
        leaveAttribution,
        'CURRENT',
        leaveDescription,
      );

      add(
        'leave_rejected_requests',
        'Rejected Leave Requests',
        'OUTCOME',
        rejectedLeaveRequests,
        leaveAttribution,
        'CURRENT',
        leaveDescription,
      );

      add(
        'leave_cancelled_requests',
        'Cancelled Leave Requests',
        'OUTCOME',
        cancelledLeaveRequests,
        leaveAttribution,
        'CURRENT',
        leaveDescription,
      );

      add(
        'leave_period_approved_requests',
        'Requests Created in Period — Currently Approved',
        'OUTCOME',
        periodApprovedLeaveRequests,
        leaveAttribution,
        'PERIOD',
        'Counts requests created in the period whose current status is APPROVED; does not measure approvals performed during the period.',
      );
    }

        // HR administrative activity is attributed directly to CRM user IDs.
    // It does not depend on whether the approving user has a staff record.
    const leaveApprovals = () =>
      this.leaveRepository
        .createQueryBuilder('leave')
        .where('leave.approvedBy IN (:...userIds)', { userIds })
        .andWhere('leave.isHidden = false')
        .andWhere('leave.approvedAt IS NOT NULL')
        .andWhere('leave.status = :status', {
          status: 'APPROVED',
        });

    const [
      totalLeaveApprovals,
      periodLeaveApprovals,
    ] = await Promise.all([
      leaveApprovals().getCount(),

      leaveApprovals()
        .andWhere(
          'leave.approvedAt >= :fromDate AND leave.approvedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),
    ]);

    add(
      'leave_approvals_total',
      'Leave Requests Currently Approved by Employee',
      'COMPLETED_WORK',
      totalLeaveApprovals,
      'staff_leave.approvedBy',
      'CURRENT',
      'Currently approved leave requests attributed to the approving CRM user.',
    );

    add(
      'leave_approvals_period',
      'Leave Approvals in Period',
      'COMPLETED_WORK',
      periodLeaveApprovals,
      'staff_leave.approvedBy + approvedAt',
      'PERIOD',
      'Currently approved leave requests whose recorded approval date falls within the selected period.',
    );

        // Attendance exception requests belong to staff records.
    if (staffIds.length) {
      const exceptions = () =>
        this.attendanceExceptionRepository
          .createQueryBuilder('exception')
          .where('exception.staffId IN (:...staffIds)', { staffIds });

      const periodExceptions = () =>
        exceptions().andWhere(
          'exception.createdAt >= :fromDate AND exception.createdAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        );

      const [
        totalExceptions,
        periodExceptionsCount,
        pendingExceptions,
        approvedExceptions,
        rejectedExceptions,
      ] = await Promise.all([
        exceptions().getCount(),
        periodExceptions().getCount(),

        exceptions()
          .andWhere('exception.status = :status', {
            status: 'PENDING',
          })
          .getCount(),

        exceptions()
          .andWhere('exception.status = :status', {
            status: 'APPROVED',
          })
          .getCount(),

        exceptions()
          .andWhere('exception.status = :status', {
            status: 'REJECTED',
          })
          .getCount(),
      ]);

      const exceptionAttribution =
        'staff_attendance_exception.staffId → staff_member.linkedUserId';

      add(
        'attendance_exceptions_total',
        'Attendance Exception Requests',
        'CREATED_WORK',
        totalExceptions,
        exceptionAttribution,
        'CURRENT',
        'Attendance correction requests associated with the selected employees.',
      );

      add(
        'attendance_exceptions_period',
        'Attendance Exception Requests in Period',
        'CREATED_WORK',
        periodExceptionsCount,
        exceptionAttribution,
        'PERIOD',
      );

      add(
        'attendance_exceptions_pending',
        'Pending Attendance Exceptions',
        'PIPELINE',
        pendingExceptions,
        exceptionAttribution,
        'CURRENT',
      );

      add(
        'attendance_exceptions_approved',
        'Approved Attendance Exceptions',
        'OUTCOME',
        approvedExceptions,
        exceptionAttribution,
        'CURRENT',
      );

      add(
        'attendance_exceptions_rejected',
        'Rejected Attendance Exceptions',
        'OUTCOME',
        rejectedExceptions,
        exceptionAttribution,
        'CURRENT',
      );
    }

    // HR review actions are attributed directly to CRM users.
    const reviewedExceptions = () =>
      this.attendanceExceptionRepository
        .createQueryBuilder('exception')
        .where('exception.reviewedBy IN (:...userIds)', { userIds })
        .andWhere('exception.reviewedAt IS NOT NULL');

    const [
      totalReviewedExceptions,
      periodReviewedExceptions,
    ] = await Promise.all([
      reviewedExceptions().getCount(),

      reviewedExceptions()
        .andWhere(
          'exception.reviewedAt >= :fromDate AND exception.reviewedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),
    ]);

    add(
      'attendance_exceptions_reviewed_total',
      'Attendance Exceptions Reviewed',
      'COMPLETED_WORK',
      totalReviewedExceptions,
      'staff_attendance_exception.reviewedBy',
      'CURRENT',
      'Records with a recorded reviewer and review timestamp.',
    );

    add(
      'attendance_exceptions_reviewed_period',
      'Attendance Exceptions Reviewed in Period',
      'COMPLETED_WORK',
      periodReviewedExceptions,
      'staff_attendance_exception.reviewedBy + reviewedAt',
      'PERIOD',
    );

        // Attendance overrides are administrative actions.
    // Attribute creation to the CRM user who created the override.
    const overridesCreated = () =>
      this.attendanceOverrideRepository
        .createQueryBuilder('override')
        .where('override.createdBy IN (:...userIds)', { userIds });

    const [
      totalOverridesCreated,
      periodOverridesCreated,
      activeOverridesCreated,
    ] = await Promise.all([
      overridesCreated().getCount(),

      overridesCreated()
        .andWhere(
          'override.createdAt >= :fromDate AND override.createdAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      overridesCreated()
        .andWhere('override.isActive = true')
        .getCount(),
    ]);

    add(
      'attendance_overrides_created_total',
      'Attendance Overrides Created',
      'CREATED_WORK',
      totalOverridesCreated,
      'staff_attendance_override.createdBy',
      'CURRENT',
    );

    add(
      'attendance_overrides_created_period',
      'Attendance Overrides Created in Period',
      'CREATED_WORK',
      periodOverridesCreated,
      'staff_attendance_override.createdBy + createdAt',
      'PERIOD',
    );

    add(
      'attendance_overrides_active',
      'Active Attendance Overrides Created',
      'PIPELINE',
      activeOverridesCreated,
      'staff_attendance_override.createdBy',
      'CURRENT',
    );

    // updatedBy records the latest updater only.
    // This is not a complete historical edit count.
    const overridesLastUpdated = () =>
      this.attendanceOverrideRepository
        .createQueryBuilder('override')
        .where('override.updatedBy IN (:...userIds)', { userIds });

    const [
      totalOverridesLastUpdated,
      periodOverridesLastUpdated,
    ] = await Promise.all([
      overridesLastUpdated().getCount(),

      overridesLastUpdated()
        .andWhere(
          'override.updatedAt >= :fromDate AND override.updatedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),
    ]);

    add(
      'attendance_overrides_last_updated_total',
      'Attendance Overrides Last Updated by Employee',
      'UPDATED_WORK',
      totalOverridesLastUpdated,
      'staff_attendance_override.updatedBy',
      'CURRENT',
      'Counts override records whose latest recorded updater is the selected employee.',
    );

    add(
      'attendance_overrides_last_updated_period',
      'Attendance Overrides Last Updated in Period',
      'UPDATED_WORK',
      periodOverridesLastUpdated,
      'staff_attendance_override.updatedBy + updatedAt',
      'PERIOD',
      'Counts records last updated during the selected period; not every historical edit.',
    );

        // Penalty administration: actions performed by selected CRM users.
    const penaltiesCreated = () =>
      this.staffPenaltyRepository
        .createQueryBuilder('penalty')
        .where('penalty.createdBy IN (:...userIds)', { userIds })
        .andWhere('penalty.isHidden = false');

    const penaltiesReviewed = () =>
      this.staffPenaltyRepository
        .createQueryBuilder('penalty')
        .where('penalty.reviewedBy IN (:...userIds)', { userIds })
        .andWhere('penalty.reviewedAt IS NOT NULL')
        .andWhere('penalty.isHidden = false');

    const [
      totalPenaltiesCreated,
      periodPenaltiesCreated,
      totalPenaltiesReviewed,
      periodPenaltiesReviewed,
    ] = await Promise.all([
      penaltiesCreated().getCount(),

      penaltiesCreated()
        .andWhere(
          'penalty.createdAt >= :fromDate AND penalty.createdAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      penaltiesReviewed().getCount(),

      penaltiesReviewed()
        .andWhere(
          'penalty.reviewedAt >= :fromDate AND penalty.reviewedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),
    ]);

    add(
      'penalties_created_total',
      'Staff Penalties Created',
      'CREATED_WORK',
      totalPenaltiesCreated,
      'staff_penalty.createdBy',
      'CURRENT',
    );

    add(
      'penalties_created_period',
      'Staff Penalties Created in Period',
      'CREATED_WORK',
      periodPenaltiesCreated,
      'staff_penalty.createdBy + createdAt',
      'PERIOD',
    );

    add(
      'penalties_reviewed_total',
      'Staff Penalties Reviewed',
      'COMPLETED_WORK',
      totalPenaltiesReviewed,
      'staff_penalty.reviewedBy',
      'CURRENT',
      'Counts penalty records with a recorded reviewer and review timestamp.',
    );

    add(
      'penalties_reviewed_period',
      'Staff Penalties Reviewed in Period',
      'COMPLETED_WORK',
      periodPenaltiesReviewed,
      'staff_penalty.reviewedBy + reviewedAt',
      'PERIOD',
    );

    // Employee-related penalties, not work performed by the employee.
    if (staffIds.length) {
      const employeePenalties = () =>
        this.staffPenaltyRepository
          .createQueryBuilder('penalty')
          .where('penalty.staffId IN (:...staffIds)', { staffIds })
          .andWhere('penalty.isHidden = false');

      const [
        totalEmployeePenalties,
        pendingEmployeePenalties,
        appliedEmployeePenalties,
      ] = await Promise.all([
        employeePenalties().getCount(),

        employeePenalties()
          .andWhere('penalty.status = :status', {
            status: 'PENDING',
          })
          .getCount(),

        employeePenalties()
          .andWhere('penalty.status = :status', {
            status: 'APPLIED_TO_PAYROLL',
          })
          .getCount(),
      ]);

      const attribution =
        'staff_penalty.staffId → staff_member.linkedUserId';

      const description =
        'Penalty associated with the employee; not a completed work activity.';

      add(
        'employee_penalties_total',
        'Penalties Recorded Against Employee',
        'OUTCOME',
        totalEmployeePenalties,
        attribution,
        'CURRENT',
        description,
      );

      add(
        'employee_penalties_pending',
        'Pending Penalties Against Employee',
        'PIPELINE',
        pendingEmployeePenalties,
        attribution,
        'CURRENT',
        description,
      );

      add(
        'employee_penalties_applied',
        'Penalties Applied to Employee Payroll',
        'OUTCOME',
        appliedEmployeePenalties,
        attribution,
        'CURRENT',
        description,
      );
    }

        // Payroll administration: attribute actions to CRM user IDs.
    // Exclude hidden payroll records.
    const payrollGenerated = () =>
      this.staffPayrollRepository
        .createQueryBuilder('payroll')
        .where('payroll.generatedBy IN (:...userIds)', { userIds })
        .andWhere('payroll.isHidden = false');

    const payrollApproved = () =>
      this.staffPayrollRepository
        .createQueryBuilder('payroll')
        .where('payroll.approvedBy IN (:...userIds)', { userIds })
        .andWhere('payroll.approvedAt IS NOT NULL')
        .andWhere('payroll.isHidden = false');

    const payrollPaid = () =>
      this.staffPayrollRepository
        .createQueryBuilder('payroll')
        .where('payroll.paidBy IN (:...userIds)', { userIds })
        .andWhere('payroll.paidAt IS NOT NULL')
        .andWhere('payroll.isHidden = false');

    const [
      totalPayrollGenerated,
      periodPayrollGenerated,
      totalPayrollApproved,
      periodPayrollApproved,
      totalPayrollPaid,
      periodPayrollPaid,
    ] = await Promise.all([
      payrollGenerated().getCount(),

      payrollGenerated()
        .andWhere(
          'payroll.createdAt >= :fromDate AND payroll.createdAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      payrollApproved().getCount(),

      payrollApproved()
        .andWhere(
          'payroll.approvedAt >= :fromDate AND payroll.approvedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      payrollPaid().getCount(),

      payrollPaid()
        .andWhere(
          'payroll.paidAt >= :fromDate AND payroll.paidAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),
    ]);

    add(
      'payroll_generated_total',
      'Payroll Records Generated by Employee',
      'CREATED_WORK',
      totalPayrollGenerated,
      'staff_payroll.generatedBy',
      'CURRENT',
    );

    add(
      'payroll_generated_period',
      'Payroll Records Created in Period',
      'CREATED_WORK',
      periodPayrollGenerated,
      'staff_payroll.generatedBy + createdAt',
      'PERIOD',
      'Counts payroll records created during the period and attributed to the generating employee.',
    );

    add(
      'payroll_approved_total',
      'Payroll Records Approved by Employee',
      'COMPLETED_WORK',
      totalPayrollApproved,
      'staff_payroll.approvedBy',
      'CURRENT',
    );

    add(
      'payroll_approved_period',
      'Payroll Approvals in Period',
      'COMPLETED_WORK',
      periodPayrollApproved,
      'staff_payroll.approvedBy + approvedAt',
      'PERIOD',
    );

    add(
      'payroll_paid_total',
      'Payroll Records Marked Paid by Employee',
      'COMPLETED_WORK',
      totalPayrollPaid,
      'staff_payroll.paidBy',
      'CURRENT',
    );

    add(
      'payroll_paid_period',
      'Payroll Records Marked Paid in Period',
      'COMPLETED_WORK',
      periodPayrollPaid,
      'staff_payroll.paidBy + paidAt',
      'PERIOD',
    );

        // Performance administration: actions by selected CRM users.
    const performanceCreated = () =>
      this.staffPerformanceRepository
        .createQueryBuilder('performance')
        .where('performance.createdBy IN (:...userIds)', { userIds })
        .andWhere('performance.isHidden = false');

    const performanceReviewed = () =>
      this.staffPerformanceRepository
        .createQueryBuilder('performance')
        .where('performance.reviewedBy IN (:...userIds)', { userIds })
        .andWhere('performance.reviewedAt IS NOT NULL')
        .andWhere('performance.isHidden = false');

    const performanceApproved = () =>
      this.staffPerformanceRepository
        .createQueryBuilder('performance')
        .where('performance.approvedBy IN (:...userIds)', { userIds })
        .andWhere('performance.approvedAt IS NOT NULL')
        .andWhere('performance.isHidden = false');

    const [
      totalPerformanceCreated,
      periodPerformanceCreated,
      totalPerformanceReviewed,
      periodPerformanceReviewed,
      totalPerformanceApproved,
      periodPerformanceApproved,
    ] = await Promise.all([
      performanceCreated().getCount(),

      performanceCreated()
        .andWhere(
          'performance.createdAt >= :fromDate AND performance.createdAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      performanceReviewed().getCount(),

      performanceReviewed()
        .andWhere(
          'performance.reviewedAt >= :fromDate AND performance.reviewedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      performanceApproved().getCount(),

      performanceApproved()
        .andWhere(
          'performance.approvedAt >= :fromDate AND performance.approvedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),
    ]);

    add(
      'performance_created_total',
      'Performance Evaluations Created',
      'CREATED_WORK',
      totalPerformanceCreated,
      'staff_performance.createdBy',
      'CURRENT',
    );

    add(
      'performance_created_period',
      'Performance Evaluations Created in Period',
      'CREATED_WORK',
      periodPerformanceCreated,
      'staff_performance.createdBy + createdAt',
      'PERIOD',
    );

    add(
      'performance_reviewed_total',
      'Performance Evaluations Reviewed',
      'COMPLETED_WORK',
      totalPerformanceReviewed,
      'staff_performance.reviewedBy',
      'CURRENT',
    );

    add(
      'performance_reviewed_period',
      'Performance Evaluations Reviewed in Period',
      'COMPLETED_WORK',
      periodPerformanceReviewed,
      'staff_performance.reviewedBy + reviewedAt',
      'PERIOD',
    );

    add(
      'performance_approved_total',
      'Performance Evaluations Approved',
      'COMPLETED_WORK',
      totalPerformanceApproved,
      'staff_performance.approvedBy',
      'CURRENT',
    );

    add(
      'performance_approved_period',
      'Performance Evaluations Approved in Period',
      'COMPLETED_WORK',
      periodPerformanceApproved,
      'staff_performance.approvedBy + approvedAt',
      'PERIOD',
    );

    // Employee-related performance records.
    // These are evaluations received, not work performed.
    if (staffIds.length) {
      const employeePerformance = () =>
        this.staffPerformanceRepository
          .createQueryBuilder('performance')
          .where('performance.staffId IN (:...staffIds)', { staffIds })
          .andWhere('performance.isHidden = false');

      const [
        totalEmployeeEvaluations,
        approvedEmployeeEvaluations,
      ] = await Promise.all([
        employeePerformance().getCount(),

        employeePerformance()
          .andWhere('performance.status = :status', {
            status: 'APPROVED',
          })
          .getCount(),
      ]);

      const attribution =
        'staff_performance.staffId → staff_member.linkedUserId';

      add(
        'employee_performance_evaluations',
        'Performance Evaluations Received',
        'OUTCOME',
        totalEmployeeEvaluations,
        attribution,
        'CURRENT',
        'Evaluations associated with the employee; not completed work activity.',
      );

      add(
        'employee_performance_approved',
        'Approved Performance Evaluations Received',
        'OUTCOME',
        approvedEmployeeEvaluations,
        attribution,
        'CURRENT',
        'Currently approved evaluations associated with the employee.',
      );
    }

        // Recruitment candidates created by selected CRM users.
    const candidatesCreated = () =>
      this.recruitmentCandidateRepository
        .createQueryBuilder('candidate')
        .where('candidate.createdBy IN (:...userIds)', { userIds })
        .andWhere('candidate.isHidden = false');

    // Joining attribution is permanently captured when marked JOINED.
    const candidatesJoined = () =>
      this.recruitmentCandidateRepository
        .createQueryBuilder('candidate')
        .where('candidate.joinedBy IN (:...userIds)', { userIds })
        .andWhere('candidate.joinedAt IS NOT NULL')
        .andWhere('candidate.stage = :stage', { stage: 'JOINED' })
        .andWhere('candidate.isHidden = false');

    const recruitmentDocuments = () =>
      this.recruitmentDocumentRepository
        .createQueryBuilder('document')
        .where('document.uploadedBy IN (:...userIds)', { userIds })
        .andWhere('document.isHidden = false');

    const [
      totalCandidatesCreated,
      periodCandidatesCreated,
      totalCandidatesJoined,
      periodCandidatesJoined,
      totalRecruitmentDocuments,
      periodRecruitmentDocuments,
    ] = await Promise.all([
      candidatesCreated().getCount(),

      candidatesCreated()
        .andWhere(
          'candidate.createdAt >= :fromDate AND candidate.createdAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      candidatesJoined().getCount(),

      candidatesJoined()
        .andWhere(
          'candidate.joinedAt >= :fromDate AND candidate.joinedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      recruitmentDocuments().getCount(),

      recruitmentDocuments()
        .andWhere(
          'document.createdAt >= :fromDate AND document.createdAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),
    ]);

    add(
      'recruitment_candidates_created_total',
      'Recruitment Candidates Registered',
      'CREATED_WORK',
      totalCandidatesCreated,
      'recruitment_candidate.createdBy',
      'CURRENT',
    );

    add(
      'recruitment_candidates_created_period',
      'Recruitment Candidates Registered in Period',
      'CREATED_WORK',
      periodCandidatesCreated,
      'recruitment_candidate.createdBy + createdAt',
      'PERIOD',
    );

    add(
      'recruitment_candidates_joined_total',
      'Candidates Successfully Joined',
      'OUTCOME',
      totalCandidatesJoined,
      'recruitment_candidate.joinedBy + joinedAt',
      'CURRENT',
      'Candidates currently marked JOINED and attributed to the employee who recorded the joining.',
    );

    add(
      'recruitment_candidates_joined_period',
      'Candidates Joined in Period',
      'OUTCOME',
      periodCandidatesJoined,
      'recruitment_candidate.joinedBy + joinedAt',
      'PERIOD',
      'Uses the recorded joining timestamp, not the candidate registration date.',
    );

    add(
      'recruitment_documents_uploaded_total',
      'Recruitment Documents Uploaded',
      'CREATED_WORK',
      totalRecruitmentDocuments,
      'recruitment_candidate_document.uploadedBy',
      'CURRENT',
    );

    add(
      'recruitment_documents_uploaded_period',
      'Recruitment Documents Uploaded in Period',
      'CREATED_WORK',
      periodRecruitmentDocuments,
      'recruitment_candidate_document.uploadedBy + createdAt',
      'PERIOD',
    );

        // Staff documents uploaded by selected CRM users.
    const staffDocuments = () =>
      this.staffDocumentRepository
        .createQueryBuilder('document')
        .where('document.uploadedBy IN (:...userIds)', { userIds })
        .andWhere('document.isHidden = false');

    // Staff complaints created by selected CRM users.
    const complaintsCreated = () =>
      this.staffComplaintRepository
        .createQueryBuilder('complaint')
        .where('complaint.createdBy IN (:...userIds)', { userIds })
        .andWhere('complaint.isHidden = false');

    // Complaint resolution is attributed to the resolving CRM user.
    const complaintsResolved = () =>
      this.staffComplaintRepository
        .createQueryBuilder('complaint')
        .where('complaint.resolvedBy IN (:...userIds)', { userIds })
        .andWhere('complaint.resolvedAt IS NOT NULL')
        .andWhere('complaint.status = :status', {
          status: 'RESOLVED',
        })
        .andWhere('complaint.isHidden = false');

    const [
      totalStaffDocuments,
      periodStaffDocuments,
      totalComplaintsCreated,
      periodComplaintsCreated,
      totalComplaintsResolved,
      periodComplaintsResolved,
    ] = await Promise.all([
      staffDocuments().getCount(),

      staffDocuments()
        .andWhere(
          'document.createdAt >= :fromDate AND document.createdAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      complaintsCreated().getCount(),

      complaintsCreated()
        .andWhere(
          'complaint.createdAt >= :fromDate AND complaint.createdAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      complaintsResolved().getCount(),

      complaintsResolved()
        .andWhere(
          'complaint.resolvedAt >= :fromDate AND complaint.resolvedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),
    ]);

    add(
      'staff_documents_uploaded_total',
      'Staff Documents Uploaded',
      'CREATED_WORK',
      totalStaffDocuments,
      'staff_document.uploadedBy',
      'CURRENT',
    );

    add(
      'staff_documents_uploaded_period',
      'Staff Documents Uploaded in Period',
      'CREATED_WORK',
      periodStaffDocuments,
      'staff_document.uploadedBy + createdAt',
      'PERIOD',
    );

    add(
      'staff_complaints_created_total',
      'Staff Complaints Created',
      'CREATED_WORK',
      totalComplaintsCreated,
      'staff_complaint.createdBy',
      'CURRENT',
    );

    add(
      'staff_complaints_created_period',
      'Staff Complaints Created in Period',
      'CREATED_WORK',
      periodComplaintsCreated,
      'staff_complaint.createdBy + createdAt',
      'PERIOD',
    );

    add(
      'staff_complaints_resolved_total',
      'Staff Complaints Resolved',
      'COMPLETED_WORK',
      totalComplaintsResolved,
      'staff_complaint.resolvedBy + resolvedAt',
      'CURRENT',
    );

    add(
      'staff_complaints_resolved_period',
      'Staff Complaints Resolved in Period',
      'COMPLETED_WORK',
      periodComplaintsResolved,
      'staff_complaint.resolvedBy + resolvedAt',
      'PERIOD',
    );

        // Tracking requests initiated by selected CRM users.
    const trackingRequested = () =>
      this.staffLocationSessionRepository
        .createQueryBuilder('session')
        .where('session.requestedByUserId IN (:...userIds)', {
          userIds,
        })
        .andWhere('session.isHidden = false')
        .andWhere('session.requestedAt IS NOT NULL');

    // Tracking participation by selected CRM users.
    // staffUserId directly references the CRM user ID.
    const trackingAccepted = () =>
      this.staffLocationSessionRepository
        .createQueryBuilder('session')
        .where('session.staffUserId IN (:...userIds)', {
          userIds,
        })
        .andWhere('session.isHidden = false')
        .andWhere('session.requestAccepted = true')
        .andWhere('session.acceptedAt IS NOT NULL');

    const trackingStarted = () =>
      this.staffLocationSessionRepository
        .createQueryBuilder('session')
        .where('session.staffUserId IN (:...userIds)', {
          userIds,
        })
        .andWhere('session.isHidden = false')
        .andWhere('session.startedAt IS NOT NULL');

    const [
      totalTrackingRequested,
      periodTrackingRequested,
      totalTrackingAccepted,
      periodTrackingAccepted,
      totalTrackingStarted,
      periodTrackingStarted,
    ] = await Promise.all([
      trackingRequested().getCount(),

      trackingRequested()
        .andWhere(
          'session.requestedAt >= :fromDate AND session.requestedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      trackingAccepted().getCount(),

      trackingAccepted()
        .andWhere(
          'session.acceptedAt >= :fromDate AND session.acceptedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      trackingStarted().getCount(),

      trackingStarted()
        .andWhere(
          'session.startedAt >= :fromDate AND session.startedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),
    ]);

    add(
      'tracking_requested_total',
      'Location Tracking Requests Initiated',
      'CREATED_WORK',
      totalTrackingRequested,
      'staff_location_tracking_session.requestedByUserId',
      'CURRENT',
    );

    add(
      'tracking_requested_period',
      'Location Tracking Requests Initiated in Period',
      'CREATED_WORK',
      periodTrackingRequested,
      'staff_location_tracking_session.requestedByUserId + requestedAt',
      'PERIOD',
    );

    add(
      'tracking_accepted_total',
      'Location Tracking Requests Accepted',
      'OUTCOME',
      totalTrackingAccepted,
      'staff_location_tracking_session.staffUserId',
      'CURRENT',
      'Employee tracking participation, not a productivity achievement.',
    );

    add(
      'tracking_accepted_period',
      'Location Tracking Requests Accepted in Period',
      'OUTCOME',
      periodTrackingAccepted,
      'staff_location_tracking_session.staffUserId + acceptedAt',
      'PERIOD',
      'Employee tracking participation, not a productivity achievement.',
    );

    add(
      'tracking_started_total',
      'Location Tracking Sessions Started',
      'OUTCOME',
      totalTrackingStarted,
      'staff_location_tracking_session.staffUserId',
      'CURRENT',
      'Tracking sessions started for the selected employees; not completed work.',
    );

    add(
      'tracking_started_period',
      'Location Tracking Sessions Started in Period',
      'OUTCOME',
      periodTrackingStarted,
      'staff_location_tracking_session.staffUserId + startedAt',
      'PERIOD',
      'Tracking sessions started during the selected period.',
    );

        // Tracking requests rejected by the employee being tracked.
    const trackingRejected = () =>
  this.staffLocationEventRepository
    .createQueryBuilder('event')
    .where('event.staffUserId IN (:...userIds)', {
      userIds,
    })
    .andWhere('event.eventType = :eventType', {
      eventType: 'REQUEST_REJECTED',
    });

    // Tracking sessions stopped by a recorded CRM user.
    const trackingStopped = () =>
      this.staffLocationSessionRepository
        .createQueryBuilder('session')
        .where('session.stoppedByUserId IN (:...userIds)', {
          userIds,
        })
        .andWhere('session.isHidden = false')
        .andWhere('session.stoppedAt IS NOT NULL');

    const [
      totalTrackingRejected,
      periodTrackingRejected,
      totalTrackingStopped,
      periodTrackingStopped,
    ] = await Promise.all([
      trackingRejected().getCount(),

      trackingRejected()
        .andWhere(
          'event.occurredAt >= :fromDate AND event.occurredAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),

      trackingStopped().getCount(),

      trackingStopped()
        .andWhere(
          'session.stoppedAt >= :fromDate AND session.stoppedAt <= :toDate',
          {
            fromDate: context.fromDate,
            toDate: context.toDate,
          },
        )
        .getCount(),
    ]);

    add(
      'tracking_rejected_total',
      'Location Tracking Requests Rejected',
      'OUTCOME',
      totalTrackingRejected,
      'staff_location_event.staffUserId',
      'CURRENT',
      'Employee tracking participation outcome; not a productivity measure.',
    );

    add(
      'tracking_rejected_period',
      'Location Tracking Requests Rejected in Period',
      'OUTCOME',
      periodTrackingRejected,
      'staff_location_event.staffUserId + occurredAt',
      'PERIOD',
    );

    add(
      'tracking_stopped_total',
      'Location Tracking Sessions Stopped',
      'COMPLETED_WORK',
      totalTrackingStopped,
      'staff_location_tracking_session.stoppedByUserId',
      'CURRENT',
      'Sessions stopped by the recorded CRM user; not evidence of employee productivity.',
    );

    add(
      'tracking_stopped_period',
      'Location Tracking Sessions Stopped in Period',
      'COMPLETED_WORK',
      periodTrackingStopped,
      'staff_location_tracking_session.stoppedByUserId + stoppedAt',
      'PERIOD',
    );

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity: metrics.some(
        (metric) => metric.value !== null && metric.value > 0,
      ),
    };
  }
}