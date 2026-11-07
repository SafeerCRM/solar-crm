
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UploadedFile,
UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

import { LegalService } from './legal.service';

@Controller('legal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  'OWNER',
  'LEGAL_ADVISOR',
  'PAYMENT_MANAGER',
  'PROJECT_MANAGER',
)
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Post('cases')
  createCase(
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.legalService.createCase(body, user);
  }

  @Get('cases')
  listCases(
    @Query() query: any,
    @CurrentUser() user: any,
  ) {
    return this.legalService.listCases(query, user);
  }

    @Post('cases/:id/parties')
addCaseParty(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.legalService.addCaseParty(id, body, user);
}

  @Get('cases/:id/parties')
listCaseParties(
  @Param('id', ParseIntPipe) id: number,
  @CurrentUser() user: any,
) {
  return this.legalService.listCaseParties(id, user);
}

    @Post('cases/:id/hearings')
  addCaseHearing(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.legalService.addCaseHearing(
      id,
      body,
      user,
    );
  }

  @Get('cases/:id/hearings')
  listCaseHearings(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.legalService.listCaseHearings(
      id,
      user,
    );
  }

    @Patch('cases/:id/hearings/:hearingId')
  updateCaseHearing(
    @Param('id', ParseIntPipe) id: number,
    @Param('hearingId', ParseIntPipe) hearingId: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.legalService.updateCaseHearing(
      id,
      hearingId,
      body,
      user,
    );
  }

    @Patch('cases/:id')
  updateCase(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.legalService.updateCase(id, body, user);
  }

  @Get('cases/:id')
  getCase(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.legalService.getCase(id, user);
  }


@Post('cases/:id/documents')
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize: 25 * 1024 * 1024,
    },
  }),
)
uploadCaseDocument(
  @Param('id', ParseIntPipe) id: number,
  @UploadedFile() file: any,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.legalService.uploadCaseDocument(
    id,
    file,
    body,
    user,
  );
}


@Get('cases/:id/documents')
listCaseDocuments(
  @Param('id', ParseIntPipe) id: number,
  @CurrentUser() user: any,
) {
  return this.legalService.listCaseDocuments(
    id,
    user,
  );
}


@Get('cases/:id/documents/:documentId/url')
getCaseDocumentUrl(
  @Param('id', ParseIntPipe) id: number,
  @Param('documentId', ParseIntPipe) documentId: number,
  @Query('download') download: string,
  @CurrentUser() user: any,
) {
  return this.legalService.getCaseDocumentUrl(
    id,
    documentId,
    user,
    download === 'true',
  );
}


@Patch('cases/:id/documents/:documentId/hide')
hideCaseDocument(
  @Param('id', ParseIntPipe) id: number,
  @Param('documentId', ParseIntPipe) documentId: number,
  @CurrentUser() user: any,
) {
  return this.legalService.hideCaseDocument(
    id,
    documentId,
    user,
  );
}


}
