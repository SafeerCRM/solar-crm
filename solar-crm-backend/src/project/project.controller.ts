import {
  Controller,
  Get,
  Req,
  Post,
  Patch,
  Body,
  Res,
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
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
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
getProjectDocuments(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.getProjectDocuments(
    Number(id),
    user,
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

@Roles('OWNER', 'PROJECT_MANAGER')
@Post('vendor')
createVendor(@Body() body: any) {
  return this.projectService.createVendor(body);
}

@Get('vendor')
getVendors(
  @Query('activeOnly') activeOnly?: string,
) {
  return this.projectService.getVendors(
    activeOnly === 'true',
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Patch('vendor/:id')
updateVendor(
  @Param('id') id: string,
  @Body() body: any,
) {
  return this.projectService.updateVendor(
    Number(id),
    body,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Patch('vendor/:id/delete')
disableVendor(@Param('id') id: string) {
  return this.projectService.disableVendor(Number(id));
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Patch('vendor/:id/enable')
enableVendor(@Param('id') id: string) {
  return this.projectService.enableVendor(Number(id));
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Post('contractor-master')
createProjectContractor(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createProjectContractor(body, user);
}

@Get('contractor-master')
getProjectContractors(
  @Query('activeOnly') activeOnly?: string,
) {
  return this.projectService.getProjectContractors(
    activeOnly === 'true',
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Patch('contractor-master/:id')
updateProjectContractor(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.updateProjectContractor(
    Number(id),
    body,
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Patch('contractor-master/:id/delete')
disableProjectContractor(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.disableProjectContractor(
    Number(id),
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Patch('contractor-master/:id/enable')
enableProjectContractor(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.enableProjectContractor(
    Number(id),
    user,
  );
}

@Patch('contractor-assignment/:id')
updateContractorAssignment(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.updateContractorAssignment(
    Number(id),
    body,
    user,
  );
}

@Post('contractor-proof/upload')
@UseInterceptors(FilesInterceptor('files', 10))
uploadContractorProofs(
  @UploadedFiles() files: any[],
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.uploadContractorProofs(
    files,
    body,
    user,
  );
}

@Get('contractor-assignment/:id/proofs')
getContractorProofs(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.getContractorProofs(
    Number(id),
    user,
  );
}

@Post('contractor-comment')
addContractorComment(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.addContractorComment(
    body,
    user,
  );
}

@Get('contractor-assignment/:id/comments')
getContractorComments(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.getContractorComments(
    Number(id),
    user,
  );
}

@Roles(
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
)

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

@Roles('OWNER', 'PROJECT_MANAGER')
@Post('purchase-order')
createPurchaseOrder(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createPurchaseOrder(
    body,
    user,
  );
}

@Get('purchase-order/:id')
getPurchaseOrderById(
  @Param('id') id: string,
) {
  return this.projectService.getPurchaseOrderById(
    Number(id),
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Post('proforma-invoice')
createProformaInvoice(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createProformaInvoice(
    body,
    user,
  );
}

@Get('proforma-invoices')
getProformaInvoices(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('search') search?: string,
  @Query('status') status?: string,
) {
  return this.projectService.getProformaInvoices({
    page: Number(page || 1),
    limit: Number(limit || 20),
    search: search || '',
    status: status || '',
  });
}

@Get('proforma-invoice/:id')
getProformaInvoiceById(
  @Param('id') id: string,
) {
  return this.projectService.getProformaInvoiceById(
    Number(id),
  );
}

@Get('proforma-invoice/:id/pdf')
generateProformaInvoicePdf(
  @Param('id') id: string,
  @Res() res: Response,
) {
  return this.projectService.generateProformaInvoicePdf(
    Number(id),
    res,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Patch('proforma-invoice/:id/hide')
hideProformaInvoice(
  @Param('id') id: string,
  @Body('reason') reason: string,
  @CurrentUser() user: any,
) {
  return this.projectService.hideProformaInvoice(
    Number(id),
    reason || '',
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Post('final-invoice')
createFinalInvoice(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createFinalInvoice(
    body,
    user,
  );
}

@Get('final-invoices')
getFinalInvoices(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('search') search?: string,
  @Query('status') status?: string,
) {
  return this.projectService.getFinalInvoices({
    page: Number(page || 1),
    limit: Number(limit || 20),
    search: search || '',
    status: status || '',
  });
}

@Get('final-invoice/:id')
getFinalInvoiceById(
  @Param('id') id: string,
) {
  return this.projectService.getFinalInvoiceById(
    Number(id),
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Post('proforma-invoice/:id/final-invoice')
createFinalInvoiceFromProforma(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.createFinalInvoiceFromProforma(
    Number(id),
    user,
  );
}

@Get('final-invoice/:id/pdf')
generateFinalInvoicePdf(
  @Param('id') id: string,
  @Res() res: Response,
) {
  return this.projectService.generateFinalInvoicePdf(
    Number(id),
    res,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Patch('final-invoice/:id/hide')
hideFinalInvoice(
  @Param('id') id: string,
  @Body('reason') reason: string,
  @CurrentUser() user: any,
) {
  return this.projectService.hideFinalInvoice(
    Number(id),
    reason || '',
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Post('contractor/assign')
assignContractorToProject(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.assignContractorToProject(
    body,
    user,
  );
}

@Get(':id/contractor-assignments')
getProjectContractorAssignments(
  @Param('id') id: string,
) {
  return this.projectService.getProjectContractorAssignments(
    Number(id),
  );
}

@Roles('PROJECT_CONTRACTOR')
@Get('contractor/my-projects')
getMyContractorProjects(
  @CurrentUser() user: any,
) {
  return this.projectService.getMyContractorProjects(user);
}

@Roles('OWNER', 'ACCOUNT_MANAGER')
@Post('ledger-entry')
createLedgerEntry(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createLedgerEntry(
    body,
    user,
  );
}

@Get('ledger')
getLedgerEntries(
  @Query('partyName') partyName?: string,
  @Query('partyType') partyType?: string,
  @Query('projectId') projectId?: string,
  @Query('sourceType') sourceType?: string,
) {
  return this.projectService.getLedgerEntries({
    partyName: partyName || '',
    partyType: partyType || '',
    projectId: projectId ? Number(projectId) : undefined,
    sourceType: sourceType || '',
  });
}

@Get('ledger/summary')
getLedgerOutstandingSummary() {
  return this.projectService.getLedgerOutstandingSummary();
}

@Get(':id/accounts-summary')
getProjectAccountsSummary(
  @Param('id') id: string,
) {
  return this.projectService.getProjectAccountsSummary(
    Number(id),
  );
}

@Roles('OWNER', 'ACCOUNT_MANAGER')
@Post('ledger/customer-payment')
recordCustomerPayment(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.recordCustomerPayment(
    body,
    user,
  );
}

@Roles('OWNER', 'ACCOUNT_MANAGER')
@Post('ledger/vendor-payment')
recordVendorPayment(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.recordVendorPayment(
    body,
    user,
  );
}

@Get('ledger/party-outstanding')
getPartyOutstandingSummary() {
  return this.projectService.getPartyOutstandingSummary();
}

@Get('purchase-order/purchasable-items')
getPurchasableMaterialRequestItems(
  @Query('projectId')
  projectId?: string,
) {
  return this.projectService.getPurchasableMaterialRequestItems(
    projectId
      ? Number(projectId)
      : undefined,
  );
}

@Get('generated-purchase-orders')
getGeneratedPurchaseOrders(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('search') search?: string,
  @Query('status') status?: string,
) {
  return this.projectService.getGeneratedPurchaseOrders({
    page: Number(page || 1),
    limit: Number(limit || 20),
    search: search || '',
    status: status || '',
  });
}

@Get('purchase-order/:id/pdf')
generatePurchaseOrderPdf(
  @Param('id') id: string,
  @Res() res: Response,
) {
  return this.projectService.generatePurchaseOrderPdf(
    Number(id),
    res,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Patch('purchase-order/:id/hide')
hidePurchaseOrder(
  @Param('id') id: string,
  @Body('reason') reason: string,
  @CurrentUser() user: any,
) {
  return this.projectService.hidePurchaseOrder(
    Number(id),
    reason || '',
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')

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

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'LOAN_MANAGER')

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

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'SUBSIDY_MANAGER')

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

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'ELECTRICITY_MANAGER')

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

@Roles(
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)

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

@Roles(
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)

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

@Get('approval-reminders')
async getApprovalReminderList(
  @Req() req: any,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
) {
  return this.projectService.getApprovalReminderList(
    req.user,
    {
      page: Number(page || 1),
      limit: Number(limit || 20),
    },
  );
}

@Get('approval-reminders/unread-count')
async getUnreadApprovalReminderCount(@Req() req: any) {
  return this.projectService.getUnreadApprovalReminderCount(req.user);
}

@Get('purchase-reminders')
async getPurchaseReminderList(
  @Req() req: any,
) {
  return this.projectService.getPurchaseReminderList(
    req.user,
  );
}

@Get('purchase-reminders/unread-count')
async getUnreadPurchaseReminderCount(
  @Req() req: any,
) {
  return this.projectService.getUnreadPurchaseReminderCount(
    req.user,
  );
}

@Get('document-reminders')
async getDocumentReminderList(
  @Req() req: any,
) {
  return this.projectService.getDocumentReminderList(
    req.user,
  );
}

@Get('document-reminders/unread-count')
async getUnreadDocumentReminderCount(
  @Req() req: any,
) {
  return this.projectService.getUnreadDocumentReminderCount(
    req.user,
  );
}

@Get('loan-reminders')
async getLoanReminderList(
  @Req() req: any,
) {
  return this.projectService.getLoanReminderList(
    req.user,
  );
}

@Get('loan-reminders/unread-count')
async getUnreadLoanReminderCount(
  @Req() req: any,
) {
  return this.projectService.getUnreadLoanReminderCount(
    req.user,
  );
}

@Get('subsidy-reminders')
async getSubsidyReminderList(
  @Req() req: any,
) {
  return this.projectService.getSubsidyReminderList(
    req.user,
  );
}

@Get('subsidy-reminders/unread-count')
async getUnreadSubsidyReminderCount(
  @Req() req: any,
) {
  return this.projectService.getUnreadSubsidyReminderCount(
    req.user,
  );
}

@Get('electricity-reminders')
async getElectricityReminderList(
  @Req() req: any,
) {
  return this.projectService.getElectricityReminderList(
    req.user,
  );
}

@Get('electricity-reminders/unread-count')
async getUnreadElectricityReminderCount(
  @Req() req: any,
) {
  return this.projectService.getUnreadElectricityReminderCount(
    req.user,
  );
}

@Get('final-closure-reminders')
async getFinalClosureReminderList(
  @Req() req: any,
) {
  return this.projectService.getFinalClosureReminderList(
    req.user,
  );
}

@Get('final-closure-reminders/unread-count')
async getUnreadFinalClosureReminderCount(
  @Req() req: any,
) {
  return this.projectService.getUnreadFinalClosureReminderCount(
    req.user,
  );
}

@Post('reminders/mark-read')
async markUnifiedReminderAsRead(
  @Body() body: any,
  @Req() req: any,
) {
  return this.projectService.markUnifiedReminderAsRead(
    body,
    req.user,
  );
}

@Post('reminders/dismiss')
async dismissUnifiedReminderForUser(
  @Body() body: any,
  @Req() req: any,
) {
  return this.projectService.dismissUnifiedReminderForUser(
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

@Roles(
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)

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

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER')

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

@Get(':id/edit-history')
getProjectEditHistory(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.projectService.getProjectEditHistory(id);
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

  @Roles(
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
)
@Patch(':id')
update(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.update(
    Number(id),
    body,
    user,
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

@Roles(
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
)
@Patch(':id/project-manager-approval')
projectManagerApproval(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.projectManagerApproval(
    Number(id),
    body,
    user,
  );
}

@Roles('OWNER', 'MARKETING_HEAD')

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

  @Roles('OWNER')

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