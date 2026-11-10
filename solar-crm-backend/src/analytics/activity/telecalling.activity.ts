
import { Repository } from 'typeorm';

import { TelecallingContact } from '../../telecalling/telecalling-contact.entity';
import { CallLog } from '../../telecalling/call-log.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class TelecallingActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'TELECALLING';
  readonly moduleLabel = 'Telecalling';

  constructor(
    private readonly contactRepository: Repository<TelecallingContact>,
    private readonly callLogRepository: Repository<CallLog>,
  ) {}

  async build(
    context: AnalyticsActivityContext,
  ): Promise<AnalyticsActivitySection> {
    const ids = context.userIds;

    if (!ids.length) {
      return {
        moduleKey: this.moduleKey,
        moduleLabel: this.moduleLabel,
        metrics: [],
        hasActivity: false,
      };
    }

    const assigned = () =>
      this.contactRepository
        .createQueryBuilder('contact')
        .where('contact.assignedTo IN (:...ids)', { ids })
        .andWhere('contact.isInStorage = false');

    const calls = () =>
      this.callLogRepository
        .createQueryBuilder('call')
        .where('call.telecallerId IN (:...ids)', { ids });

    const periodCalls = () =>
      calls().andWhere(
        'call.createdAt >= :fromDate AND call.createdAt <= :toDate',
        {
          fromDate: context.fromDate,
          toDate: context.toDate,
        },
      );

    const [
      assignedContacts,
      storageContacts,
      flaggedCalled,
      flaggedConverted,
      reviewAssignedContacts,
      recordedCalls,
      periodRecordedCalls,
      cnrCalls,
      notInterestedCalls,
      interestedCalls,
      callbackCalls,
      initiatedCalls,
      connectedCalls,
      proposalSentCalls,
      periodUniqueContacts,
      periodLeadCalls,
      reviewAssignedCalls,
    ] = await Promise.all([
      assigned().getCount(),

      this.contactRepository
        .createQueryBuilder('contact')
        .where('contact.assignedTo IN (:...ids)', { ids })
        .andWhere('contact.isInStorage = true')
        .getCount(),

      assigned()
        .andWhere('contact.hasCalled = true')
        .getCount(),

      assigned()
        .andWhere('contact.convertedToLead = true')
        .getCount(),

      this.contactRepository
        .createQueryBuilder('contact')
        .where('contact.reviewAssignedTo IN (:...ids)', { ids })
        .getCount(),

      calls().getCount(),

      periodCalls().getCount(),

      periodCalls()
        .andWhere('call.callStatus = :status', { status: 'CNR' })
        .getCount(),

      periodCalls()
        .andWhere('call.callStatus = :status', {
          status: 'NOT_INTERESTED',
        })
        .getCount(),

      periodCalls()
        .andWhere('call.callStatus = :status', {
          status: 'INTERESTED',
        })
        .getCount(),

      periodCalls()
        .andWhere('call.callStatus = :status', {
          status: 'CALLBACK',
        })
        .getCount(),

      periodCalls()
        .andWhere('call.callStatus = :status', {
          status: 'INITIATED',
        })
        .getCount(),

      periodCalls()
        .andWhere('call.callStatus = :status', {
          status: 'CONNECTED',
        })
        .getCount(),

      periodCalls()
        .andWhere('call.callStatus = :status', {
          status: 'PROPOSAL_SENT',
        })
        .getCount(),

      periodCalls()
        .select('COUNT(DISTINCT call.contactId)', 'count')
        .getRawOne<{ count: string }>()
        .then((result) => Number(result?.count || 0)),

      periodCalls()
        .andWhere('call.leadId IS NOT NULL')
        .getCount(),

      this.callLogRepository
        .createQueryBuilder('call')
        .where('call.reviewAssignedTo IN (:...ids)', { ids })
        .getCount(),
    ]);

    const metrics: AnalyticsActivitySection['metrics'] = [
      {
        key: 'assigned_contacts',
        label: 'Active Assigned Contacts',
        kind: 'ASSIGNED_WORK',
        value: assignedContacts,
        unit: 'COUNT',
        attribution: 'contact.assignedTo',
        timeScope: 'CURRENT',
      },
      {
        key: 'storage_contacts',
        label: 'Assigned Storage Contacts',
        kind: 'ASSIGNED_WORK',
        value: storageContacts,
        unit: 'COUNT',
        attribution: 'contact.assignedTo and isInStorage=true',
        timeScope: 'CURRENT',
      },
      {
        key: 'flagged_called',
        label: 'Assigned Contacts Flagged Called',
        kind: 'UPDATED_WORK',
        value: flaggedCalled,
        unit: 'COUNT',
        attribution: 'assignedTo and hasCalled=true',
        timeScope: 'CURRENT',
        description:
          'Historical contact flag, not individually attributed call events.',
      },
      {
        key: 'flagged_converted',
        label: 'Assigned Contacts Flagged Converted',
        kind: 'OUTCOME',
        value: flaggedConverted,
        unit: 'COUNT',
        attribution: 'assignedTo and convertedToLead=true',
        timeScope: 'CURRENT',
        description:
          'Contact conversion flag, not independently verified lead creation.',
      },
      {
        key: 'review_assigned_contacts',
        label: 'Contacts Assigned for Review',
        kind: 'ASSIGNED_WORK',
        value: reviewAssignedContacts,
        unit: 'COUNT',
        attribution: 'contact.reviewAssignedTo',
        timeScope: 'CURRENT',
      },
      {
        key: 'recorded_calls',
        label: 'All Recorded Calls',
        kind: 'UPDATED_WORK',
        value: recordedCalls,
        unit: 'COUNT',
        attribution: 'call.telecallerId',
        timeScope: 'CURRENT',
        description: 'Lifetime recorded call events.',
      },
      {
        key: 'period_recorded_calls',
        label: 'Recorded Calls During Period',
        kind: 'UPDATED_WORK',
        value: periodRecordedCalls,
        unit: 'COUNT',
        attribution: 'call.telecallerId and createdAt',
        timeScope: 'PERIOD',
      },
      ...[
        ['cnr', 'CNR Calls', cnrCalls],
        ['not_interested', 'Not Interested Calls', notInterestedCalls],
        ['interested', 'Interested Calls', interestedCalls],
        ['callback', 'Callback Calls', callbackCalls],
        ['initiated', 'Initiated Calls', initiatedCalls],
        ['connected', 'Connected Calls', connectedCalls],
        ['proposal_sent', 'Proposal Sent Calls', proposalSentCalls],
      ].map(([key, label, value]) => ({
        key: `call_${key}`,
        label: String(label),
        kind: 'OUTCOME' as const,
        value: Number(value),
        unit: 'COUNT' as const,
        attribution: 'call.telecallerId, callStatus and createdAt',
        timeScope: 'PERIOD' as const,
      })),
      {
        key: 'period_unique_contacts',
        label: 'Unique Contacts Called During Period',
        kind: 'UPDATED_WORK',
        value: periodUniqueContacts,
        unit: 'COUNT',
        attribution: 'call.telecallerId and distinct contactId',
        timeScope: 'PERIOD',
      },
      {
        key: 'period_lead_calls',
        label: 'Lead-Linked Calls During Period',
        kind: 'UPDATED_WORK',
        value: periodLeadCalls,
        unit: 'COUNT',
        attribution: 'call.telecallerId and leadId',
        timeScope: 'PERIOD',
      },
      {
        key: 'review_assigned_calls',
        label: 'Call Logs Assigned for Review',
        kind: 'ASSIGNED_WORK',
        value: reviewAssignedCalls,
        unit: 'COUNT',
        attribution: 'call.reviewAssignedTo',
        timeScope: 'CURRENT',
      },
    ];

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity:
        assignedContacts > 0 ||
        storageContacts > 0 ||
        reviewAssignedContacts > 0 ||
        recordedCalls > 0 ||
        reviewAssignedCalls > 0,
    };
  }
}
