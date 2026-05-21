import {
  Controller,
  Get,
  Req,
  Post,
  Patch,
  Body,
  Param,
  UploadedFiles,
UseGuards,
UseInterceptors,
Query,
ParseIntPipe,
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
create(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.create(
    body,
    user,
  );
}

  @Post('create-with-calculation')
  createWithCalculation(@Body() body: any) {
    return this.projectService.createWithCalculation(
      body,
    );
  }

  @Get()
findAll(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('search') search?: string,
  @Query('status') status?: string,
  @Query('branch') branch?: string,
  @Query('owner') owner: string = '',
@CurrentUser() user?: any,
) {
  return this.projectService.findAll(
  {
    page: Number(page || 1),
    limit: Number(limit || 20),
    search: search || '',
    status: status || '',
    branch: branch || '',
    owner: owner || '',
  },
  user,
);
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
getMaterialMasters(
  @Query('activeOnly') activeOnly?: string,
) {
  return this.projectService.getMaterialMasters(
    activeOnly === 'true',
  );
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

@Patch('material-master/:id/enable')
enableMaterialMaster(@Param('id') id: string) {
  return this.projectService.enableMaterialMaster(
    Number(id),
  );
}

@Post('material-request')
createMaterialRequest(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createMaterialRequest(
    body,
    user,
  );
}

@Get(':id/material-requests')
getProjectMaterialRequests(
  @Param('id') id: string,
) {
  return this.projectService.getProjectMaterialRequests(
    Number(id),
  );
}

@Post('branch')
createBranch(@Body() body: any) {
  return this.projectService.createBranch(
    body,
  );
}

@Get('branch')
getBranches() {
  return this.projectService.getBranches();
}

@Patch('branch/:id/delete')
deleteBranch(
  @Param('id') id: string,
) {
  return this.projectService.deleteBranch(
    Number(id),
  );
}

@Get('purchase-orders')
getPurchaseOrders(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('search') search?: string,
  @Query('status') status?: string,
  @Query('branch') branch?: string,
  @Query('owner') owner?: string,
) {
  return this.projectService.getPurchaseOrders({
    page: Number(page || 1),
    limit: Number(limit || 20),
    search: search || '',
    status: status || '',
    branch: branch || '',
    owner: owner || '',
  });
}

@Patch('material-request-item/:id/buy')
buyMaterialRequestItem(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.buyMaterialRequestItem(
    Number(id),
    body,
    user,
  );
}

@Get(':id/loan-detail')
getProjectLoanDetail(@Param('id') id: string) {
  return this.projectService.getProjectLoanDetail(Number(id));
}

@Post(':id/loan-detail')
saveProjectLoanDetail(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.saveProjectLoanDetail(
    Number(id),
    body,
    user,
  );
}

@Get(':id/subsidy-detail')
getProjectSubsidyDetail(@Param('id') id: string) {
  return this.projectService.getProjectSubsidyDetail(Number(id));
}

@Post(':id/subsidy-detail')
saveProjectSubsidyDetail(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.saveProjectSubsidyDetail(
    Number(id),
    body,
    user,
  );
}

@Get(':id/electricity-detail')
getProjectElectricityDetail(
  @Param('id') id: string,
) {
  return this.projectService.getProjectElectricityDetail(
    Number(id),
  );
}

@Post(':id/electricity-detail')
saveProjectElectricityDetail(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.saveProjectElectricityDetail(
    Number(id),
    body,
    user,
  );
}

@Get('owners/list')
getProjectOwners() {
  return this.projectService.getProjectOwners();
}

@Post('execution-activity')
createExecutionActivity(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createExecutionActivity(
    body,
    user,
  );
}

@Get(':id/execution-activities')
getProjectExecutionActivities(
  @Param('id') id: string,
) {
  return this.projectService.getProjectExecutionActivities(
    Number(id),
  );
}

@Patch('execution-activity/:id')
updateExecutionActivity(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.updateExecutionActivity(
    Number(id),
    body,
    user,
  );
}

@Post('execution-proof')
uploadExecutionProof(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.uploadExecutionProof(
    body,
    user,
  );
}

@Get('execution-activity/:id/proofs')
getExecutionActivityProofs(
  @Param('id') id: string,
) {
  return this.projectService.getExecutionActivityProofs(
    Number(id),
  );
}

@Post('execution-proof/upload')
@UseInterceptors(FilesInterceptor('files', 10))
uploadExecutionProofFiles(
  @UploadedFiles() files: any[],
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.uploadExecutionProofFiles(
    files,
    body,
    user,
  );
}

@Get('execution-calendar')
getExecutionCalendarActivities(
  @CurrentUser() user: any,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('date') date?: string,
  @Query('status') status?: string,
  @Query('branch') branch?: string,
  @Query('customer') customer?: string,
  @Query('owner') owner?: string,
  @Query('overdueOnly') overdueOnly?: string,
) {
  return this.projectService.getExecutionCalendarActivities(
    user,
    {
      page: Number(page || 1),
      limit: Number(limit || 20),
      date: date || '',
      status: status || '',
      branch: branch || '',
      customer: customer || '',
      owner: owner || '',
      overdueOnly: overdueOnly || '',
    },
  );
}

@Get('execution-reminders/summary')
async getExecutionReminderSummary(@Req() req: any) {
  return this.projectService.getExecutionReminderSummary(req.user);
}

@Get('execution-reminders')
async getExecutionReminderList(@Req() req: any) {
  return this.projectService.getExecutionReminderList(req.user);
}

@Post('execution-reminders/:activityId/dismiss')
async dismissExecutionReminder(
  @Param('activityId', ParseIntPipe) activityId: number,
  @Req() req: any,
) {
  return this.projectService.dismissExecutionReminder(activityId, req.user);
}

@Get('execution-reminders/unread-count')
async getUnreadReminderCount(@Req() req: any) {
  return this.projectService.getUnreadReminderCount(req.user);
}

@Post('execution-reminders/:activityId/read')
async markReminderAsRead(
  @Param('activityId', ParseIntPipe) activityId: number,
  @Req() req: any,
) {
  return this.projectService.markReminderAsRead(
    activityId,
    req.user,
  );
}

@Post('execution-reminders/:activityId/dismiss-user')
async dismissReminderForUser(
  @Param('activityId', ParseIntPipe) activityId: number,
  @Req() req: any,
) {
  return this.projectService.dismissReminderForUser(
    activityId,
    req.user,
  );
}

@Get('payment-collection')
async getPaymentCollectionList(
  @Query() query: any,
  @Req() req: any,
) {
  return this.projectService.getPaymentCollectionList(query, req.user);
}

@Post(':projectId/payment-installment')
async createPaymentInstallment(
  @Param('projectId', ParseIntPipe)
  projectId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.createPaymentInstallment(
    projectId,
    body,
    req.user,
  );
}

@Post('payment-collection/installments/:installmentId/receive')
async receivePaymentInstallment(
  @Param('installmentId', ParseIntPipe)
  installmentId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.receivePaymentInstallment(
    installmentId,
    body,
    req.user,
  );
}

@Get('payment-reminders')
async getPaymentReminderList(@Req() req: any) {
  return this.projectService.getPaymentReminderList(req.user);
}

@Get('payment-reminders/unread-count')
async getUnreadPaymentReminderCount(@Req() req: any) {
  return this.projectService.getUnreadPaymentReminderCount(req.user);
}

@Post('payment-reminders/:installmentId/read')
async markPaymentReminderAsRead(
  @Param('installmentId', ParseIntPipe) installmentId: number,
  @Req() req: any,
) {
  return this.projectService.markPaymentReminderAsRead(
    installmentId,
    req.user,
  );
}

@Post('payment-reminders/:installmentId/dismiss')
async dismissPaymentReminderForUser(
  @Param('installmentId', ParseIntPipe) installmentId: number,
  @Req() req: any,
) {
  return this.projectService.dismissPaymentReminderForUser(
    installmentId,
    req.user,
  );
}

@Patch('payment-collection/installments/:installmentId/hide')
async hidePaymentInstallment(
  @Param('installmentId', ParseIntPipe) installmentId: number,
  @Body() body: any,
  @Req() req: any,
) {
  return this.projectService.hidePaymentInstallment(
    installmentId,
    body,
    req.user,
  );
}

@Patch(':id/hide')
hideProject(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.hideProject(id, body, user);
}

@Patch(':id/complete')
completeProject(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.completeProject(
    id,
    body,
    user,
  );
}

  @Get(':id')
  findOne(
  @Param('id') id: string,
  @CurrentUser() user: any,
){
    return this.projectService.findOne(
  Number(id),
  user,
);
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
addComment(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.addComment(body, user);
}

  @Get(':id/comments')
getComments(
  @Param('id') id: string,
  @Query('department') department?: string,
) {
  return this.projectService.getProjectComments(
    Number(id),
    department,
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