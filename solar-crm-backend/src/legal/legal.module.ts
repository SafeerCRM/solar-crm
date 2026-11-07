import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LegalCase } from './legal-case.entity';
import { LegalCaseParty } from './legal-case-party.entity';
import { LegalCaseHearing } from './legal-case-hearing.entity';
import { LegalCaseDocument } from './legal-case-document.entity';
import { User } from '../users/user.entity';

import { LegalService } from './legal.service';
import { LegalController } from './legal.controller';
import { Project } from '../project/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LegalCase,
      LegalCaseParty,
      LegalCaseHearing,
      LegalCaseDocument,
      User,
      Project,
    ]),
  ],
  controllers: [LegalController],
  providers: [LegalService],
})
export class LegalModule {}