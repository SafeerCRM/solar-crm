import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UploadedFiles,
UseGuards,
UseInterceptors,
} from '@nestjs/common';

import { ProjectService } from './project.service';
import {
  FilesInterceptor,
} from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('project')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
  ) {}

  @Post('create')
  create(@Body() body: any) {
    return this.projectService.create(body);
  }

  @Post('create-with-calculation')
  createWithCalculation(@Body() body: any) {
    return this.projectService.createWithCalculation(
      body,
    );
  }

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Get(':id/documents')
getProjectDocuments(@Param('id') id: string) {
  return this.projectService.getProjectDocuments(
    Number(id),
  );
}

@Patch('documents/:id/delete')
deleteProjectDocument(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.deleteProjectDocument(
    Number(id),
    user,
  );
}

@Post('material-master')
createMaterialMaster(@Body() body: any) {
  return this.projectService.createMaterialMaster(body);
}

@Get('material-master')
getMaterialMasters() {
  return this.projectService.getMaterialMasters();
}

@Patch('material-master/:id')
updateMaterialMaster(
  @Param('id') id: string,
  @Body() body: any,
) {
  return this.projectService.updateMaterialMaster(
    Number(id),
    body,
  );
}

@Patch('material-master/:id/delete')
deleteMaterialMaster(@Param('id') id: string) {
  return this.projectService.deleteMaterialMaster(Number(id));
}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(Number(id));
  }

  @Post('documents/upload')
@UseInterceptors(
  FilesInterceptor('files', 20),
)
uploadProjectDocument(
  @UploadedFiles() files: any[],
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.uploadProjectDocuments(
  files,
  body,
  user,
);
}

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.projectService.update(
      Number(id),
      body,
    );
  }

  @Post('document')
  addDocument(@Body() body: any) {
    return this.projectService.addDocument(body);
  }

  @Post('comment')
  addComment(@Body() body: any) {
    return this.projectService.addComment(body);
  }

  @Get(':id/comments')
  getProjectComments(
    @Param('id') id: string,
  ) {
    return this.projectService.getProjectComments(
      Number(id),
    );
  }

  @Patch(':id/marketing-head-approval')
  marketingHeadApproval(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.projectService.marketingHeadApproval(
      Number(id),
      body,
    );
  }

  @Patch(':id/owner-approval')
  ownerApproval(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.projectService.ownerApproval(
      Number(id),
      body,
    );
  }
}