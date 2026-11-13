
import { Repository } from 'typeorm';

import { SolarMitra } from '../../solar-mitra/solar-mitra.entity';
import {
  SolarMitraReferral,
  SolarMitraReferralSourceType,
} from '../../solar-mitra/solar-mitra-referral.entity';
import { SolarMitraMeeting } from '../../solar-mitra/solar-mitra-meeting.entity';
import { SolarMitraPayout } from '../../solar-mitra/solar-mitra-payout.entity';
import { SolarMitraCreatorPayout } from '../../solar-mitra/solar-mitra-creator-payout.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
  AnalyticsActivityKind,
} from './analytics-activity.types';

export class SolarMitraActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'SOLAR_MITRA';
  readonly moduleLabel = 'Solar Mitra Management';

  constructor(
    private readonly mitraRepository: Repository<SolarMitra>,
    private readonly referralRepository: Repository<SolarMitraReferral>,
    private readonly meetingRepository: Repository<SolarMitraMeeting>,
    private readonly payoutRepository: Repository<SolarMitraPayout>,
    private readonly creatorPayoutRepository: Repository<SolarMitraCreatorPayout>,
  ) {}

  async build(
    context: AnalyticsActivityContext,
  ): Promise<AnalyticsActivitySection> {
    const metrics: AnalyticsActivitySection['metrics'] = [];
    const userIds = context.userIds;

    const result = (hasActivity: boolean): AnalyticsActivitySection => ({
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity,
    });

    if (!userIds.length) return result(false);

    const add = (
      key: string,
      label: string,
      kind: AnalyticsActivityKind,
      value: number,
      attribution: string,
      timeScope: 'CURRENT' | 'PERIOD',
      unit: 'COUNT' | 'INR' = 'COUNT',
    ) => {
      metrics.push({
        key,
        label,
        kind,
        value,
        attribution,
        timeScope,
        unit,
      });
    };

    const inPeriod = (
      alias: string,
      dateField: string,
    ) => `${alias}.${dateField} >= :fromDate AND ${alias}.${dateField} <= :toDate`;

    const dates = {
      fromDate: context.fromDate,
      toDate: context.toDate,
    };

    const count = async (
      repository: Repository<any>,
      alias: string,
      employeeField: string,
      dateField?: string,
      extra?: {
        condition: string;
        parameters?: Record<string, any>;
      },
    ): Promise<number> => {
      const qb = repository
        .createQueryBuilder(alias)
        .where(`${alias}.${employeeField} IN (:...userIds)`, {
          userIds,
        });

      if (dateField) {
        qb.andWhere(inPeriod(alias, dateField), dates);
      }

      if (extra) {
        qb.andWhere(extra.condition, extra.parameters ?? {});
      }

      return qb.getCount();
    };

    const sumPayouts = async (
      repository: Repository<any>,
      alias: string,
    ): Promise<number> => {
      const row = await repository
        .createQueryBuilder(alias)
        .select(`COALESCE(SUM(${alias}.payoutAmount), 0)`, 'total')
        .where(`${alias}.paidBy IN (:...userIds)`, { userIds })
        .andWhere(inPeriod(alias, 'paidAt'), dates)
        .andWhere(`${alias}.status = :status`, { status: 'PAID' })
        .getRawOne();

      return Number(row?.total ?? 0);
    };

    const [
      profilesCreated,
      profilesCreatedPeriod,
      profilesManaged,
      meetingsCreated,
      meetingsCreatedPeriod,
      meetingsAssigned,
      meetingsConvertedPeriod,
      referralsAssigned,
      referralsAssignedPeriod,
      staffReferralsPeriod,
      interestUpdatesPeriod,
      posterPrintingUpdatesPeriod,
      standeePrintingUpdatesPeriod,
      posterVerificationsPeriod,
      mitraPayoutsPeriod,
      creatorPayoutsPeriod,
      mitraPayoutAmountPeriod,
      creatorPayoutAmountPeriod,
    ] = await Promise.all([
      count(this.mitraRepository, 'mitra', 'createdBy'),
      count(this.mitraRepository, 'mitra', 'createdBy', 'createdAt'),
      count(this.mitraRepository, 'mitra', 'franchiseManagerId', undefined, {
        condition: 'mitra.isHidden = :hidden',
        parameters: { hidden: false },
      }),

      count(this.meetingRepository, 'meeting', 'createdBy'),
      count(this.meetingRepository, 'meeting', 'createdBy', 'createdAt'),
      count(this.meetingRepository, 'meeting', 'franchiseManagerId', undefined, {
        condition: 'meeting.isHidden = :hidden',
        parameters: { hidden: false },
      }),
      count(this.meetingRepository, 'meeting', 'convertedBy', 'convertedAt', {
        condition: 'meeting.convertedToSolarMitra = :converted',
        parameters: { converted: true },
      }),

      count(this.referralRepository, 'referral', 'assignedTo', undefined, {
        condition: 'referral.isHidden = :hidden',
        parameters: { hidden: false },
      }),
      count(this.referralRepository, 'referral', 'assignedTo', 'assignedAt', {
        condition: 'referral.isHidden = :hidden',
        parameters: { hidden: false },
      }),
      count(this.referralRepository, 'referral', 'submittedBy', 'createdAt', {
        condition:
          'referral.sourceType = :sourceType AND referral.isHidden = :hidden',
        parameters: {
          sourceType: SolarMitraReferralSourceType.STAFF,
          hidden: false,
        },
      }),

      count(this.mitraRepository, 'mitra', 'interestUpdatedBy', 'interestUpdatedAt'),
      count(this.mitraRepository, 'mitra', 'posterPrintingUpdatedBy', 'posterPrintingUpdatedAt'),
      count(this.mitraRepository, 'mitra', 'standeePrintingUpdatedBy', 'standeePrintingUpdatedAt'),
      count(this.mitraRepository, 'mitra', 'posterVerifiedBy', 'posterVerifiedAt'),

      count(this.payoutRepository, 'payout', 'paidBy', 'paidAt', {
        condition: 'payout.status = :status',
        parameters: { status: 'PAID' },
      }),
      count(this.creatorPayoutRepository, 'payout', 'paidBy', 'paidAt', {
        condition: 'payout.status = :status',
        parameters: { status: 'PAID' },
      }),

      sumPayouts(this.payoutRepository, 'payout'),
      sumPayouts(this.creatorPayoutRepository, 'payout'),
    ]);

    add('mitra_profiles_created_total', 'Solar Mitra Profiles Created — Total', 'CREATED_WORK', profilesCreated, 'createdBy', 'CURRENT');
    add('mitra_profiles_created_period', 'Solar Mitra Profiles Created During Period', 'CREATED_WORK', profilesCreatedPeriod, 'createdBy + createdAt', 'PERIOD');
    add('mitra_profiles_managed', 'Solar Mitras Currently Managed', 'ASSIGNED_WORK', profilesManaged, 'franchiseManagerId', 'CURRENT');

    add('mitra_meetings_created_total', 'Solar Mitra Meetings Created — Total', 'CREATED_WORK', meetingsCreated, 'createdBy', 'CURRENT');
    add('mitra_meetings_created_period', 'Solar Mitra Meetings Created During Period', 'CREATED_WORK', meetingsCreatedPeriod, 'createdBy + createdAt', 'PERIOD');
    add('mitra_meetings_assigned', 'Solar Mitra Meetings Currently Assigned', 'ASSIGNED_WORK', meetingsAssigned, 'franchiseManagerId', 'CURRENT');
    add('mitra_meetings_converted_period', 'Meetings Converted to Solar Mitra During Period', 'OUTCOME', meetingsConvertedPeriod, 'convertedBy + convertedAt', 'PERIOD');

    add('mitra_referrals_assigned', 'Solar Mitra Referrals Currently Assigned', 'ASSIGNED_WORK', referralsAssigned, 'assignedTo', 'CURRENT');
    add('mitra_referrals_assigned_period', 'Referral Assignments Recorded During Period', 'ASSIGNED_WORK', referralsAssignedPeriod, 'assignedTo + assignedAt', 'PERIOD');
    add('mitra_staff_referrals_period', 'Staff Referrals Submitted During Period', 'CREATED_WORK', staffReferralsPeriod, 'submittedBy + createdAt + sourceType', 'PERIOD');

    add('mitra_interest_updates_period', 'Solar Mitra Interest Status Updates During Period', 'UPDATED_WORK', interestUpdatesPeriod, 'interestUpdatedBy + interestUpdatedAt', 'PERIOD');
    add('mitra_poster_printing_period', 'Poster Printing Status Updates During Period', 'UPDATED_WORK', posterPrintingUpdatesPeriod, 'posterPrintingUpdatedBy + posterPrintingUpdatedAt', 'PERIOD');
    add('mitra_standee_printing_period', 'Standee Printing Status Updates During Period', 'UPDATED_WORK', standeePrintingUpdatesPeriod, 'standeePrintingUpdatedBy + standeePrintingUpdatedAt', 'PERIOD');
    add('mitra_poster_verifications_period', 'Poster Verifications During Period', 'COMPLETED_WORK', posterVerificationsPeriod, 'posterVerifiedBy + posterVerifiedAt', 'PERIOD');

    add('mitra_payouts_paid_period', 'Solar Mitra Payouts Recorded During Period', 'FINANCIAL', mitraPayoutsPeriod, 'paidBy + paidAt', 'PERIOD');
    add('mitra_creator_payouts_paid_period', 'Creator Payouts Recorded During Period', 'FINANCIAL', creatorPayoutsPeriod, 'paidBy + paidAt', 'PERIOD');
    add('mitra_payout_amount_period', 'Solar Mitra Payout Amount Recorded During Period', 'FINANCIAL', mitraPayoutAmountPeriod, 'paidBy + paidAt + payoutAmount', 'PERIOD', 'INR');
    add('mitra_creator_payout_amount_period', 'Creator Payout Amount Recorded During Period', 'FINANCIAL', creatorPayoutAmountPeriod, 'paidBy + paidAt + payoutAmount', 'PERIOD', 'INR');

    return result(metrics.some((metric) => metric.value !== null && metric.value > 0));
  }
}
