
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, DataSource } from 'typeorm';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { Project } from '../project/project.entity';
import { LegalCaseDocument } from './legal-case-document.entity';
import {
  LegalCase,
  LegalCaseDirection,
  LegalCasePriority,
  LegalCaseStatus,
} from './legal-case.entity';

import {
  LegalCaseParty,
  LegalPartyType,
  LegalPartyRole,
} from './legal-case-party.entity';

import { User, UserRole } from '../users/user.entity';
import {
  LegalCaseHearing,
  LegalHearingStatus,
} from './legal-case-hearing.entity';

@Injectable()
export class LegalService {
  constructor(
    @InjectRepository(LegalCase)
    private readonly caseRepository: Repository<LegalCase>,

    @InjectRepository(LegalCaseParty)
    private readonly partyRepository: Repository<LegalCaseParty>,

    @InjectRepository(LegalCaseHearing)
    private readonly hearingRepository: Repository<LegalCaseHearing>,

    @InjectRepository(LegalCaseDocument)
    private readonly documentRepository: Repository<LegalCaseDocument>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Project)
  private readonly projectRepository: Repository<Project>,

  private readonly dataSource: DataSource,
  ) {}

  private canAccessLegalCase(
  legalCase: LegalCase,
  user: any,
): boolean {
  if (!legalCase.isConfidential) {
    return true;
  }

  const rolesValue = user?.roles ?? user?.role;

  const roles = Array.isArray(rolesValue)
    ? rolesValue
    : typeof rolesValue === 'string'
      ? rolesValue.split(',').map((role) => role.trim())
      : [];

  if (roles.includes(UserRole.OWNER)) {
    return true;
  }

  const userId = Number(
    user?.userId ?? user?.sub ?? user?.id,
  );

  return (
    roles.includes(UserRole.LEGAL_ADVISOR) &&
    Number.isSafeInteger(userId) &&
    userId > 0 &&
    legalCase.assignedAdvisorId !== null &&
    legalCase.assignedAdvisorId === userId
  );
}

private assertLegalCaseAccess(
  legalCase: LegalCase,
  user: any,
): void {
  if (!this.canAccessLegalCase(legalCase, user)) {
    throw new ForbiddenException(
      'You do not have access to this legal case',
    );
  }
}

  async createCase(body: any, user: any) {
    if (
  !body ||
  typeof body !== 'object' ||
  Array.isArray(body)
) {
  throw new BadRequestException(
    'A valid legal case request body is required',
  );
}

if (
  typeof body.title !== 'string' ||
  typeof body.caseType !== 'string'
) {
  throw new BadRequestException(
    'Case title and case type must be text',
  );
}

const title = body.title.trim();
const caseType = body.caseType.trim();

if (body.isConfidential === true) {
  const roles = user?.roles ?? [];

  if (!roles.includes(UserRole.OWNER)) {
    throw new ForbiddenException(
      'Only OWNER can create confidential legal cases',
    );
  }
}

    const validateOptionalText = (
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(
      `${fieldName} must be text`,
    );
  }

  const trimmed = value.trim();

  if (!trimmed) return null;

  if (trimmed.length > maxLength) {
    throw new BadRequestException(
      `${fieldName} cannot exceed ${maxLength} characters`,
    );
  }

  return trimmed;
};

if (title.length > 255) {
  throw new BadRequestException(
    'Case title cannot exceed 255 characters',
  );
}

if (caseType.length > 100) {
  throw new BadRequestException(
    'Case type cannot exceed 100 characters',
  );
}

const courtOrAuthority = validateOptionalText(
  body.courtOrAuthority,
  'Court or authority',
  255,
);

const externalCaseNumber = validateOptionalText(
  body.externalCaseNumber,
  'External case number',
  150,
);

    if (!title || !caseType) {
      throw new BadRequestException(
        'Case title and case type are required',
      );
    }

    if (
      !Object.values(LegalCaseDirection).includes(body.direction)
    ) {
      throw new BadRequestException('Invalid case direction');
    }

    const advisorId =
      body.assignedAdvisorId === undefined ||
      body.assignedAdvisorId === null ||
      body.assignedAdvisorId === ''
        ? null
        : Number(body.assignedAdvisorId);

    if (advisorId !== null) {
      if (!Number.isInteger(advisorId) || advisorId <= 0) {
        throw new BadRequestException('Invalid advisor ID');
      }

      const advisor = await this.userRepository.findOne({
        where: { id: advisorId, isHidden: false },
      });

      if (
        !advisor ||
        !advisor.roles?.includes(UserRole.LEGAL_ADVISOR)
      ) {
        throw new BadRequestException(
          'Assigned user must be an active Legal Advisor',
        );
      }
    }

    const projectId =
      body.projectId === undefined ||
      body.projectId === null ||
      body.projectId === ''
        ? null
        : Number(body.projectId);

    if (
      projectId !== null &&
      (!Number.isInteger(projectId) || projectId <= 0)
    ) {
      throw new BadRequestException('Invalid project ID');
    }

    if (projectId !== null) {
  const projectExists = await this.projectRepository.exist({
    where: { id: projectId },
  });

  if (!projectExists) {
    throw new BadRequestException(
      'Selected project does not exist',
    );
  }
}

    const status = LegalCaseStatus.DRAFT;

    const priority =
  body.priority === undefined ||
  body.priority === null ||
  body.priority === ''
    ? LegalCasePriority.MEDIUM
    : body.priority;

if (
  !Object.values(LegalCasePriority).includes(priority)
) {
  throw new BadRequestException(
    'Invalid legal case priority',
  );
}

    const isConfidential = body.isConfidential === true;

    const validateDate = (
  value: unknown,
  fieldName: string,
): string | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    throw new BadRequestException(
      `${fieldName} must be in YYYY-MM-DD format`,
    );
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException(
      `${fieldName} is not a valid date`,
    );
  }

  return value;
};

const filingDate = validateDate(
  body.filingDate,
  'Filing date',
);

const nextHearingDate = validateDate(
  body.nextHearingDate,
  'Next hearing date',
);

    
return this.dataSource.transaction(async (manager) => {
  const sequenceResult: Array<{ id: string }> =
    await manager.query(
      `SELECT nextval('public.legal_case_id_seq')::text AS id`,
    );

  const caseId = Number(sequenceResult[0]?.id);

  if (!Number.isSafeInteger(caseId) || caseId <= 0) {
    throw new BadRequestException(
      'Unable to generate legal case ID',
    );
  }

  const caseNumber = `LEG-${new Date().getFullYear()}-${String(
    caseId,
  ).padStart(6, '0')}`;


const insertedCases: LegalCase[] = await manager.query(
  `
  INSERT INTO public.legal_case (
    id,
    "caseNumber",
    title,
    description,
    direction,
    "caseType",
    status,
    priority,
    "projectId",
    "assignedAdvisorId",
    "courtOrAuthority",
    "externalCaseNumber",
    "filingDate",
    "nextHearingDate",
    remarks,
    "isConfidential",
    "createdBy",
    "updatedBy"
  )
  VALUES (
    $1, $2, $3, $4, $5, $6,
    $7, $8, $9, $10, $11, $12,
    $13, $14, $15, $16, $17, $18
  )
  RETURNING *
  `,
  [
    caseId,
    caseNumber,
    title,
    body.description
      ? String(body.description).trim()
      : null,
    body.direction,
    caseType,
    status,
    priority,
    projectId,
    advisorId,
    courtOrAuthority,
    externalCaseNumber,
    filingDate,
    nextHearingDate,
    body.remarks || null,
    isConfidential,
    user.id,
    user.id,
  ],
);

return insertedCases[0];
});

  }

  
async listCases(query: any, user: any) {
  if (
    query.status &&
    !Object.values(LegalCaseStatus).includes(query.status)
  ) {
    throw new BadRequestException('Invalid legal case status');
  }

  if (
    query.direction &&
    !Object.values(LegalCaseDirection).includes(query.direction)
  ) {
    throw new BadRequestException('Invalid legal case direction');
  }

  if (query.projectId !== undefined) {
    const projectId = Number(query.projectId);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      throw new BadRequestException('Invalid project ID');
    }
  }

  const qb = this.caseRepository.createQueryBuilder('legal');



    if (query.status) {
      qb.andWhere('legal.status = :status', {
        status: query.status,
      });
    }

    if (query.direction) {
      qb.andWhere('legal.direction = :direction', {
        direction: query.direction,
      });
    }

    if (query.projectId) {
      qb.andWhere('legal.projectId = :projectId', {
        projectId: Number(query.projectId),
      });
    }

    if (query.search !== undefined) {
  if (
    typeof query.search !== 'string' ||
    query.search.length > 100
  ) {
    throw new BadRequestException(
      'Search must be text and cannot exceed 100 characters',
    );
  }

  const search = query.search.trim();

  if (search) {
    const escapedSearch = search.replace(
      /[\\%_]/g,
      '\\$&',
    );

    qb.andWhere(
      new Brackets((sub) => {
        sub
          .where(
            "legal.title ILIKE :search ESCAPE '\\'",
            { search: `%${escapedSearch}%` },
          )
          .orWhere(
            "legal.caseNumber ILIKE :search ESCAPE '\\'",
            { search: `%${escapedSearch}%` },
          );
      }),
    );
  }
}

    qb.andWhere('legal.isArchived = false');

const rolesValue = user?.roles ?? user?.role;

const roles = Array.isArray(rolesValue)
  ? rolesValue
  : typeof rolesValue === 'string'
    ? rolesValue.split(',').map((role) => role.trim())
    : [];

const userId = Number(
  user?.userId ?? user?.sub ?? user?.id,
);

if (!roles.includes(UserRole.OWNER)) {
  if (
    roles.includes(UserRole.LEGAL_ADVISOR) &&
    Number.isSafeInteger(userId) &&
    userId > 0
  ) {
    qb.andWhere(
      new Brackets((sub) => {
        sub
          .where('legal.isConfidential = false')
          .orWhere(
            '(legal.isConfidential = true AND legal.assignedAdvisorId = :currentUserId)',
            { currentUserId: userId },
          );
      }),
    );
  } else {
    qb.andWhere('legal.isConfidential = false');
  }
}

qb.orderBy('legal.createdAt', 'DESC');

    const parsePagination = (
  value: unknown,
  fallback: number,
  fieldName: string,
): number => {
  if (value === undefined || value === '') {
    return fallback;
  }

  if (
    typeof value !== 'string' ||
    !/^[1-9]\d*$/.test(value)
  ) {
    throw new BadRequestException(
      `${fieldName} must be a positive integer`,
    );
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new BadRequestException(
      `Invalid ${fieldName}`,
    );
  }

  return parsed;
};

const page = parsePagination(query.page, 1, 'Page');

const limit = Math.min(
  100,
  parsePagination(query.limit, 20, 'Limit'),
);

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async updateCase(id: number, body: any, user: any) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('A valid legal case request body is required');
  }

  const allowedFields = [
    'title',
    'description',
    'direction',
    'caseType',
    'status',
    'priority',
    'projectId',
    'assignedAdvisorId',
    'courtOrAuthority',
    'externalCaseNumber',
    'filingDate',
    'remarks',
    'isConfidential',
  ];

  const providedFields = Object.keys(body);

  if (
    providedFields.length === 0 ||
    providedFields.some((field) => !allowedFields.includes(field))
  ) {
    throw new BadRequestException(
      'No valid editable legal case fields provided',
    );
  }

  const optionalText = (
    value: unknown,
    fieldName: string,
    maxLength?: number,
  ): string | null => {
    if (value === null || value === '') return null;

    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be text`);
    }

    const trimmed = value.trim();

    if (maxLength && trimmed.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} cannot exceed ${maxLength} characters`,
      );
    }

    return trimmed || null;
  };

  const validateDate = (
    value: unknown,
    fieldName: string,
  ): string | null => {
    if (value === null || value === '') return null;

    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      throw new BadRequestException(
        `${fieldName} must use YYYY-MM-DD format`,
      );
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException(`${fieldName} is not a valid date`);
    }

    return value;
  };

  const changes: Partial<LegalCase> = {};

  if (body.title !== undefined) {
    const title = optionalText(body.title, 'Case title', 255);
    if (!title) {
      throw new BadRequestException('Case title is required');
    }
    changes.title = title;
  }

  if (body.caseType !== undefined) {
    const caseType = optionalText(body.caseType, 'Case type', 100);
    if (!caseType) {
      throw new BadRequestException('Case type is required');
    }
    changes.caseType = caseType;
  }

  if (body.description !== undefined) {
    changes.description = optionalText(body.description, 'Description');
  }

  if (body.courtOrAuthority !== undefined) {
    changes.courtOrAuthority = optionalText(
      body.courtOrAuthority,
      'Court or authority',
      255,
    );
  }

  if (body.externalCaseNumber !== undefined) {
    changes.externalCaseNumber = optionalText(
      body.externalCaseNumber,
      'External case number',
      150,
    );
  }

  if (body.remarks !== undefined) {
    changes.remarks = optionalText(body.remarks, 'Remarks');
  }

  if (body.filingDate !== undefined) {
    changes.filingDate = validateDate(body.filingDate, 'Filing date');
  }

  if (body.direction !== undefined) {
    if (!Object.values(LegalCaseDirection).includes(body.direction)) {
      throw new BadRequestException('Invalid case direction');
    }
    changes.direction = body.direction;
  }

  if (body.status !== undefined) {
    if (!Object.values(LegalCaseStatus).includes(body.status)) {
      throw new BadRequestException('Invalid legal case status');
    }
    changes.status = body.status;
  }

  if (body.priority !== undefined) {
    if (!Object.values(LegalCasePriority).includes(body.priority)) {
      throw new BadRequestException('Invalid legal case priority');
    }
    changes.priority = body.priority;
  }

  if (body.isConfidential !== undefined) {
  const rolesValue = user?.roles ?? user?.role;

  const roles = Array.isArray(rolesValue)
    ? rolesValue
    : typeof rolesValue === 'string'
      ? rolesValue.split(',').map((role) => role.trim())
      : [];

  if (!roles.includes(UserRole.OWNER)) {
    throw new ForbiddenException(
      'Only OWNER can change legal case confidentiality',
    );
  }

  if (typeof body.isConfidential !== 'boolean') {
    throw new BadRequestException(
      'Confidentiality must be true or false',
    );
  }

  changes.isConfidential = body.isConfidential;
}

  if (body.projectId !== undefined) {
    const projectId =
      body.projectId === null || body.projectId === ''
        ? null
        : Number(body.projectId);

    if (
      projectId !== null &&
      (!Number.isSafeInteger(projectId) || projectId <= 0)
    ) {
      throw new BadRequestException('Invalid project ID');
    }

    if (projectId !== null) {
      const exists = await this.projectRepository.exist({
        where: { id: projectId },
      });

      if (!exists) {
        throw new BadRequestException('Selected project does not exist');
      }
    }

    changes.projectId = projectId;
  }

  if (body.assignedAdvisorId !== undefined) {
    const advisorId =
      body.assignedAdvisorId === null || body.assignedAdvisorId === ''
        ? null
        : Number(body.assignedAdvisorId);

    if (
      advisorId !== null &&
      (!Number.isSafeInteger(advisorId) || advisorId <= 0)
    ) {
      throw new BadRequestException('Invalid advisor ID');
    }

    if (advisorId !== null) {
      const advisor = await this.userRepository.findOne({
        where: { id: advisorId, isHidden: false },
      });

      if (
        !advisor ||
        !advisor.roles?.includes(UserRole.LEGAL_ADVISOR)
      ) {
        throw new BadRequestException(
          'Assigned user must be an active Legal Advisor',
        );
      }
    }

    changes.assignedAdvisorId = advisorId;
  }

  const updatedBy = Number(user?.userId ?? user?.sub ?? user?.id);

  return this.dataSource.transaction(async (manager) => {
    const repo = manager.getRepository(LegalCase);

    const legalCase = await repo
      .createQueryBuilder('legal')
      .setLock('pessimistic_write')
      .where('legal.id = :id', { id })
      .andWhere('legal.isArchived = false')
      .getOne();

   if (!legalCase) {
  throw new NotFoundException('Legal case not found');
}

if (!this.canAccessLegalCase(legalCase, user)) {
  throw new NotFoundException('Legal case not found');
}

const rolesValue = user?.roles ?? user?.role;

const roles = Array.isArray(rolesValue)
  ? rolesValue
  : typeof rolesValue === 'string'
    ? rolesValue.split(',').map((role) => role.trim())
    : [];

if (
  !roles.includes(UserRole.OWNER) &&
  body.assignedAdvisorId !== undefined &&
  (
    legalCase.isConfidential ||
    changes.isConfidential === true
  )
) {
  throw new ForbiddenException(
    'Only OWNER can reassign a confidential legal case',
  );
}

Object.assign(legalCase, changes);

    if (Number.isSafeInteger(updatedBy) && updatedBy > 0) {
      legalCase.updatedBy = updatedBy;
    }

    return repo.save(legalCase);
  });
}

 async getCase(id: number, user: any) {
  const legalCase = await this.caseRepository.findOne({
    where: { id, isArchived: false },
  });

  if (!legalCase) {
    throw new NotFoundException('Legal case not found');
  }

  if (!this.canAccessLegalCase(legalCase, user)) {
    throw new NotFoundException('Legal case not found');
  }

  return legalCase;
}

   async addCaseParty(caseId: number, body: any, user: any) {
  await this.getCase(caseId, user);

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      throw new BadRequestException(
        'A valid legal party request body is required',
      );
    }

    if (
      !Object.values(LegalPartyType).includes(body.partyType)
    ) {
      throw new BadRequestException('Invalid party type');
    }

    if (
      !Object.values(LegalPartyRole).includes(body.partyRole)
    ) {
      throw new BadRequestException('Invalid party role');
    }

    if (
      typeof body.partyName !== 'string' ||
      !body.partyName.trim() ||
      body.partyName.trim().length > 255
    ) {
      throw new BadRequestException(
        'Party name is required and cannot exceed 255 characters',
      );
    }

    const optionalText = (
      value: unknown,
      fieldName: string,
      maxLength?: number,
    ): string | null => {
      if (value === undefined || value === null || value === '') {
        return null;
      }

      if (typeof value !== 'string') {
        throw new BadRequestException(
          `${fieldName} must be text`,
        );
      }

      const trimmed = value.trim();

      if (maxLength && trimmed.length > maxLength) {
        throw new BadRequestException(
          `${fieldName} cannot exceed ${maxLength} characters`,
        );
      }

      return trimmed || null;
    };

    const linkedRecordId =
      body.linkedRecordId === undefined ||
      body.linkedRecordId === null ||
      body.linkedRecordId === ''
        ? null
        : Number(body.linkedRecordId);

    if (
      linkedRecordId !== null &&
      (!Number.isSafeInteger(linkedRecordId) ||
        linkedRecordId <= 0)
    ) {
      throw new BadRequestException(
        'Linked record ID must be a positive integer',
      );
    }

    if (
      body.isPrimaryParty !== undefined &&
      typeof body.isPrimaryParty !== 'boolean'
    ) {
      throw new BadRequestException(
        'Primary party must be true or false',
      );
    }

    const party = this.partyRepository.create({
      caseId,
      partyType: body.partyType,
      partyRole: body.partyRole,
      partyName: body.partyName.trim(),
      linkedRecordId,
      phone: optionalText(body.phone, 'Phone', 30),
      email: optionalText(body.email, 'Email', 255),
      address: optionalText(body.address, 'Address'),
      remarks: optionalText(body.remarks, 'Remarks'),
      isPrimaryParty: body.isPrimaryParty === true,
    });

    return this.partyRepository.save(party);
  }

  async listCaseParties(caseId: number, user: any) {
  await this.getCase(caseId, user);

    return this.partyRepository.find({
      where: { caseId },
      order: {
        isPrimaryParty: 'DESC',
        id: 'ASC',
      },
    });
  }

    async addCaseHearing(caseId: number, body: any, user: any) {
    await this.getCase(caseId, user);

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('A valid hearing request body is required');
    }

    const validateDate = (
      value: unknown,
      fieldName: string,
      required = false,
    ): string | null => {
      if (value === undefined || value === null || value === '') {
        if (required) {
          throw new BadRequestException(`${fieldName} is required`);
        }
        return null;
      }

      if (typeof value !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new BadRequestException(
          `${fieldName} must use YYYY-MM-DD format`,
        );
      }

      const date = new Date(`${value}T00:00:00.000Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        throw new BadRequestException(`${fieldName} is not a valid date`);
      }

      return value;
    };

    const optionalText = (
      value: unknown,
      fieldName: string,
      maxLength?: number,
    ): string | null => {
      if (value === undefined || value === null || value === '') {
        return null;
      }

      if (typeof value !== 'string') {
        throw new BadRequestException(`${fieldName} must be text`);
      }

      const trimmed = value.trim();

      if (maxLength && trimmed.length > maxLength) {
        throw new BadRequestException(
          `${fieldName} cannot exceed ${maxLength} characters`,
        );
      }

      return trimmed || null;
    };

    const hearingDate = validateDate(
      body.hearingDate,
      'Hearing date',
      true,
    )!;

    const nextHearingDate = validateDate(
      body.nextHearingDate,
      'Next hearing date',
    );

    const status = body.status ?? LegalHearingStatus.SCHEDULED;

    if (!Object.values(LegalHearingStatus).includes(status)) {
      throw new BadRequestException('Invalid hearing status');
    }

    if (
      nextHearingDate &&
      nextHearingDate < hearingDate
    ) {
      throw new BadRequestException(
        'Next hearing date cannot be earlier than hearing date',
      );
    }

    const createdBy = Number(user?.userId ?? user?.sub ?? user?.id);

    const hearing = this.hearingRepository.create({
      caseId,
      hearingDate,
      courtOrAuthority: optionalText(
        body.courtOrAuthority,
        'Court or authority',
        255,
      ),
      status,
      outcome: optionalText(body.outcome, 'Outcome'),
      proceedingsNotes: optionalText(
        body.proceedingsNotes,
        'Proceedings notes',
      ),
      nextHearingDate,
      remarks: optionalText(body.remarks, 'Remarks'),
      createdBy:
        Number.isSafeInteger(createdBy) && createdBy > 0
          ? createdBy
          : null,
      updatedBy: null,
    });

        return this.dataSource.transaction(async (manager) => {
      const caseRepo = manager.getRepository(LegalCase);
      const hearingRepo = manager.getRepository(LegalCaseHearing);

      // Lock the parent case to prevent concurrent hearing
      // submissions from updating its next date inconsistently.
      const legalCase = await caseRepo
        .createQueryBuilder('legalCase')
        .setLock('pessimistic_write')
        .where('legalCase.id = :caseId', { caseId })
        .andWhere('legalCase.isArchived = false')
        .getOne();

      if (!legalCase) {
  throw new NotFoundException('Legal case not found');
}

if (!this.canAccessLegalCase(legalCase, user)) {
  throw new NotFoundException('Legal case not found');
}

const savedHearing = await hearingRepo.save(hearing);

      let candidateDate: string | null = null;

      if (status === LegalHearingStatus.SCHEDULED) {
        candidateDate = hearingDate;
      } else if (
        status === LegalHearingStatus.COMPLETED ||
        status === LegalHearingStatus.ADJOURNED ||
        status === LegalHearingStatus.POSTPONED
      ) {
        candidateDate = nextHearingDate;
      }

      if (candidateDate) {
        // Date-only comparison avoids timezone conversion issues.
        const today = new Date().toLocaleDateString('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        const currentDate = legalCase.nextHearingDate;

        if (
          candidateDate >= today &&
          (!currentDate ||
            currentDate < today ||
            candidateDate > currentDate)
        ) {
          legalCase.nextHearingDate = candidateDate;

          const updatedBy = Number(
            user?.userId ?? user?.sub ?? user?.id,
          );

          legalCase.updatedBy =
            Number.isSafeInteger(updatedBy) && updatedBy > 0
              ? updatedBy
              : null;

          await caseRepo.save(legalCase);
        }
      }

      return savedHearing;
    });
  }

  async listCaseHearings(caseId: number, user: any) {
    await this.getCase(caseId, user);

    return this.hearingRepository.find({
      where: { caseId },
      order: {
        hearingDate: 'DESC',
        id: 'DESC',
      },
    });
  }

    async updateCaseHearing(
    caseId: number,
    hearingId: number,
    body: any,
    user: any,
  ) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('A valid hearing request body is required');
    }

    const validateDate = (
      value: unknown,
      fieldName: string,
    ): string | null => {
      if (value === undefined || value === null || value === '') {
        return null;
      }

      if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
      ) {
        throw new BadRequestException(
          `${fieldName} must use YYYY-MM-DD format`,
        );
      }

      const date = new Date(`${value}T00:00:00.000Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        throw new BadRequestException(`${fieldName} is not a valid date`);
      }

      return value;
    };

    const optionalText = (
      value: unknown,
      fieldName: string,
      maxLength?: number,
    ): string | null => {
      if (value === undefined || value === null || value === '') {
        return null;
      }

      if (typeof value !== 'string') {
        throw new BadRequestException(`${fieldName} must be text`);
      }

      const trimmed = value.trim();

      if (maxLength && trimmed.length > maxLength) {
        throw new BadRequestException(
          `${fieldName} cannot exceed ${maxLength} characters`,
        );
      }

      return trimmed || null;
    };

    return this.dataSource.transaction(async (manager) => {
      const caseRepo = manager.getRepository(LegalCase);
      const hearingRepo = manager.getRepository(LegalCaseHearing);

      const legalCase = await caseRepo
        .createQueryBuilder('legalCase')
        .setLock('pessimistic_write')
        .where('legalCase.id = :caseId', { caseId })
        .andWhere('legalCase.isArchived = false')
        .getOne();

      if (!legalCase) {
  throw new NotFoundException('Legal case not found');
}

if (!this.canAccessLegalCase(legalCase, user)) {
  throw new NotFoundException('Legal case not found');
}

const hearing = await hearingRepo.findOne({
  where: { id: hearingId, caseId },
});

      if (!hearing) {
        throw new NotFoundException('Legal hearing not found');
      }

      if (body.hearingDate !== undefined) {
        const date = validateDate(body.hearingDate, 'Hearing date');

        if (!date) {
          throw new BadRequestException('Hearing date is required');
        }

        hearing.hearingDate = date;
      }

      if (body.nextHearingDate !== undefined) {
        hearing.nextHearingDate = validateDate(
          body.nextHearingDate,
          'Next hearing date',
        );
      }

      if (body.status !== undefined) {
        if (!Object.values(LegalHearingStatus).includes(body.status)) {
          throw new BadRequestException('Invalid hearing status');
        }

        hearing.status = body.status;
      }

      if (
        hearing.nextHearingDate &&
        hearing.nextHearingDate < hearing.hearingDate
      ) {
        throw new BadRequestException(
          'Next hearing date cannot be earlier than hearing date',
        );
      }

      if (body.courtOrAuthority !== undefined) {
        hearing.courtOrAuthority = optionalText(
          body.courtOrAuthority,
          'Court or authority',
          255,
        );
      }

      if (body.outcome !== undefined) {
        hearing.outcome = optionalText(body.outcome, 'Outcome');
      }

      if (body.proceedingsNotes !== undefined) {
        hearing.proceedingsNotes = optionalText(
          body.proceedingsNotes,
          'Proceedings notes',
        );
      }

      if (body.remarks !== undefined) {
        hearing.remarks = optionalText(body.remarks, 'Remarks');
      }

      const updatedBy = Number(
        user?.userId ?? user?.sub ?? user?.id,
      );

      hearing.updatedBy =
        Number.isSafeInteger(updatedBy) && updatedBy > 0
          ? updatedBy
          : null;

      const savedHearing = await hearingRepo.save(hearing);

      const hearings = await hearingRepo.find({
        where: { caseId },
      });

      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const upcomingDates: string[] = [];

      for (const item of hearings) {
        let candidate: string | null = null;

        if (item.status === LegalHearingStatus.SCHEDULED) {
          candidate = item.hearingDate;
        } else if (
          item.status === LegalHearingStatus.COMPLETED ||
          item.status === LegalHearingStatus.ADJOURNED ||
          item.status === LegalHearingStatus.POSTPONED
        ) {
          candidate = item.nextHearingDate;
        }

        if (candidate && candidate >= today) {
          upcomingDates.push(candidate);
        }
      }

      upcomingDates.sort();

      const calculatedDate = upcomingDates[0] ?? null;

      if (legalCase.nextHearingDate !== calculatedDate) {
        legalCase.nextHearingDate = calculatedDate;
        legalCase.updatedBy = hearing.updatedBy;

        await caseRepo.save(legalCase);
      }

      return savedHearing;
    });
  }


async uploadCaseDocument(
  caseId: number,
  file: any,
  body: any,
  user: any,
) {
  await this.getCase(caseId, user);

  if (!file?.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new BadRequestException('Document file is required');
  }

  const title = body?.title;
  const category = body?.category;
  const remarks = body?.remarks;

  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.trim().length > 255
  ) {
    throw new BadRequestException(
      'Document title is required (maximum 255 characters)',
    );
  }

  if (
    typeof category !== 'string' ||
    !category.trim() ||
    category.trim().length > 100
  ) {
    throw new BadRequestException(
      'Document category is required (maximum 100 characters)',
    );
  }

  if (
    remarks !== undefined &&
    remarks !== null &&
    typeof remarks !== 'string'
  ) {
    throw new BadRequestException('Remarks must be text');
  }

  const mimeType = String(file.mimetype || '').toLowerCase();

  const extensions: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  const extension = extensions[mimeType];

  if (!extension) {
    throw new BadRequestException(
      'Only PDF, JPG, PNG and WEBP files are allowed',
    );
  }

  const buffer: Buffer = file.buffer;
  const fileSize = buffer.length;

  if (
    fileSize === 0 ||
    fileSize > 25 * 1024 * 1024
  ) {
    throw new BadRequestException(
      'Document must be between 1 byte and 25 MB',
    );
  }

  const validSignature =
    mimeType === 'application/pdf'
      ? buffer.subarray(0, 5).toString('ascii') === '%PDF-'
      : mimeType === 'image/jpeg'
        ? buffer.length >= 3 &&
          buffer[0] === 0xff &&
          buffer[1] === 0xd8 &&
          buffer[2] === 0xff
        : mimeType === 'image/png'
          ? buffer.subarray(0, 8).equals(
              Buffer.from('89504e470d0a1a0a', 'hex'),
            )
          : buffer.length >= 12 &&
            buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
            buffer.subarray(8, 12).toString('ascii') === 'WEBP';

  if (!validSignature) {
    throw new BadRequestException(
      'File content does not match its declared type',
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new BadRequestException(
      'Supabase storage is not configured',
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const bucket = 'legal-case-documents';

  const filePath =
    `cases/${caseId}/${Date.now()}-${randomUUID()}.${extension}`;

  const upload = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (upload.error) {
    throw new BadRequestException(
      'Legal document upload failed',
    );
  }

  try {
    // Recheck access before saving metadata.
    await this.getCase(caseId, user);

    const userId = Number(
      user?.userId ?? user?.id ?? user?.sub,
    );

    const document = this.documentRepository.create({
      caseId,
      title: title.trim(),
      category: category.trim(),
      remarks:
        typeof remarks === 'string'
          ? remarks.trim() || null
          : null,
      fileName: String(file.originalname || 'document').slice(0, 255),
      filePath,
      mimeType,
      fileSize: String(fileSize),
      uploadedBy:
        Number.isSafeInteger(userId) && userId > 0
          ? userId
          : null,
      isHidden: false,
    });

    return await this.documentRepository.save(document);
  } catch (error) {
    await supabase.storage
      .from(bucket)
      .remove([filePath]);

    throw error;
  }
}


async listCaseDocuments(
  caseId: number,
  user: any,
) {
  // Enforce the parent case's confidentiality rules.
  await this.getCase(caseId, user);

  return this.documentRepository.find({
    where: {
      caseId,
      isHidden: false,
    },
    select: [
      'id',
      'caseId',
      'title',
      'category',
      'remarks',
      'fileName',
      'mimeType',
      'fileSize',
      'uploadedBy',
      'createdAt',
    ],
    order: {
      createdAt: 'DESC',
      id: 'DESC',
    },
  });
}


async getCaseDocumentUrl(
  caseId: number,
  documentId: number,
  user: any,
  download = false,
) {
  // Verify access to the parent legal case.
  await this.getCase(caseId, user);

  const document = await this.documentRepository.findOne({
    where: {
      id: documentId,
      caseId,
      isHidden: false,
    },
  });

  if (!document) {
    throw new NotFoundException(
      'Legal document not found',
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new BadRequestException(
      'Supabase storage is not configured',
    );
  }

  const supabase = createClient(
    supabaseUrl,
    serviceKey,
  );

  const { data, error } = await supabase.storage
    .from('legal-case-documents')
    .createSignedUrl(
      document.filePath,
      60,
      download
        ? { download: document.fileName }
        : undefined,
    );

  if (error || !data?.signedUrl) {
    throw new BadRequestException(
      'Unable to access legal document',
    );
  }

  return {
    url: data.signedUrl,
    expiresIn: 60,
    fileName: document.fileName,
    mimeType: document.mimeType,
  };
}


async hideCaseDocument(
  caseId: number,
  documentId: number,
  user: any,
) {
  await this.getCase(caseId, user);

  const document = await this.documentRepository.findOne({
    where: {
      id: documentId,
      caseId,
      isHidden: false,
    },
  });

  if (!document) {
    throw new NotFoundException(
      'Legal document not found',
    );
  }

  const userId = Number(
    user?.userId ?? user?.id ?? user?.sub,
  );

  document.isHidden = true;
  document.hiddenAt = new Date();
  document.hiddenBy =
    Number.isSafeInteger(userId) && userId > 0
      ? userId
      : null;
  document.hiddenReason = null;

  await this.documentRepository.save(document);

  return {
    success: true,
    message: 'Legal document hidden successfully',
    documentId,
  };
}


}
