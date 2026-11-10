
import { Repository } from 'typeorm';

import {
  Lead,
  LeadPotential,
  LeadStatus,
} from '../../leads/lead.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class LeadActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'LEADS';
  readonly moduleLabel = 'Leads';

  constructor(
    private readonly leadRepository: Repository<Lead>,
  ) {}

  async build(
    context: AnalyticsActivityContext,
  ): Promise<AnalyticsActivitySection> {
    const empty = (): AnalyticsActivitySection => ({
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics: [],
      hasActivity: false,
    });

    if (!context.userIds.length) return empty();

    const ids = context.userIds;

    const assignedQuery = () =>
      this.leadRepository
        .createQueryBuilder('lead')
        .where('lead.assignedTo IN (:...ids)', { ids })
        .andWhere('lead.isArchived = false');

    const [
      assigned,
      created,
      involved,
      archived,
      newLeads,
      contacted,
      interested,
      siteVisit,
      quotation,
      negotiation,
      won,
      lost,
      highPotential,
      followupScheduled,
    ] = await Promise.all([
      assignedQuery().getCount(),

      this.leadRepository
        .createQueryBuilder('lead')
        .where('lead.createdBy IN (:...ids)', { ids })
        .andWhere(
          'lead.createdAt BETWEEN :start AND :end',
          {
            start: context.fromDate,
            end: context.toDate,
          },
        )
        .getCount(),

      this.leadRepository
        .createQueryBuilder('lead')
        .where(
          '(lead.assignedTo IN (:...ids) OR lead.createdBy IN (:...ids))',
          { ids },
        )
        .getCount(),

      this.leadRepository
        .createQueryBuilder('lead')
        .where('lead.assignedTo IN (:...ids)', { ids })
        .andWhere('lead.isArchived = true')
        .getCount(),

      assignedQuery()
        .andWhere('lead.status = :status', {
          status: LeadStatus.NEW,
        })
        .getCount(),

      assignedQuery()
        .andWhere('lead.status = :status', {
          status: LeadStatus.CONTACTED,
        })
        .getCount(),

      assignedQuery()
        .andWhere('lead.status = :status', {
          status: LeadStatus.INTERESTED,
        })
        .getCount(),

      assignedQuery()
        .andWhere('lead.status = :status', {
          status: LeadStatus.SITE_VISIT,
        })
        .getCount(),

      assignedQuery()
        .andWhere('lead.status = :status', {
          status: LeadStatus.QUOTATION,
        })
        .getCount(),

      assignedQuery()
        .andWhere('lead.status = :status', {
          status: LeadStatus.NEGOTIATION,
        })
        .getCount(),

      assignedQuery()
        .andWhere('lead.status = :status', {
          status: LeadStatus.WON,
        })
        .getCount(),

      assignedQuery()
        .andWhere('lead.status = :status', {
          status: LeadStatus.LOST,
        })
        .getCount(),

      assignedQuery()
        .andWhere('lead.potential = :potential', {
          potential: LeadPotential.HIGH,
        })
        .getCount(),

      assignedQuery()
        .andWhere('lead.nextFollowUpDate IS NOT NULL')
        .getCount(),
    ]);

    const metrics: AnalyticsActivitySection['metrics'] = [
      {
        key: 'assigned',
        label: 'Currently Assigned Active Leads',
        kind: 'ASSIGNED_WORK',
        value: assigned,
        unit: 'COUNT',
        attribution: 'assignedTo and isArchived=false',
        timeScope: 'CURRENT',
      },
      {
        key: 'created',
        label: 'Leads Created During Period',
        kind: 'CREATED_WORK',
        value: created,
        unit: 'COUNT',
        attribution: 'createdBy and createdAt',
        timeScope: 'PERIOD',
      },
      {
        key: 'involved',
        label: 'Leads with Recorded Involvement',
        kind: 'UPDATED_WORK',
        value: involved,
        unit: 'COUNT',
        attribution: 'assignedTo or createdBy',
        timeScope: 'CURRENT',
        description:
          'Unique lead records, not individual actions.',
      },
      {
        key: 'archived',
        label: 'Archived Leads Assigned',
        kind: 'ASSIGNED_WORK',
        value: archived,
        unit: 'COUNT',
        attribution: 'assignedTo and isArchived=true',
        timeScope: 'CURRENT',
      },
      ...[
        ['new', 'New Leads', newLeads],
        ['contacted', 'Contacted Leads', contacted],
        ['interested', 'Interested Leads', interested],
        ['site_visit', 'Site Visit Stage', siteVisit],
        ['quotation', 'Quotation Stage', quotation],
        ['negotiation', 'Negotiation Stage', negotiation],
        ['won', 'Won Leads', won],
        ['lost', 'Lost Leads', lost],
      ].map(([key, label, value]) => ({
        key: `status_${key}`,
        label: String(label),
        kind: 'PIPELINE' as const,
        value: Number(value),
        unit: 'COUNT' as const,
        attribution: 'assignedTo, active lead and current status',
        timeScope: 'CURRENT' as const,
      })),
      {
        key: 'high_potential',
        label: 'High Potential Leads',
        kind: 'PIPELINE',
        value: highPotential,
        unit: 'COUNT',
        attribution: 'assignedTo and potential=HIGH',
        timeScope: 'CURRENT',
      },
      {
        key: 'followup_scheduled',
        label: 'Leads with Follow-up Date',
        kind: 'ASSIGNED_WORK',
        value: followupScheduled,
        unit: 'COUNT',
        attribution: 'assignedTo and nextFollowUpDate',
        timeScope: 'CURRENT',
        description:
          'Lead-level follow-up date; not a count of FollowUp records.',
      },
    ];

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity: involved > 0,
    };
  }
}
