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
  @Query('projectWorkState') projectWorkState?: string,
  @Query('branch') branch?: string,
  @Query('owner') owner: string = '',
  @Query('fromDate') fromDate?: string,
@Query('toDate') toDate?: string,
@Query('legacyFilter') legacyFilter?: string,
@Query('legacyYear') legacyYear?: string,
@CurrentUser() user?: any,
) {
  return this.projectService.findAll(
  {
    page: Number(page || 1),
    limit: Number(limit || 20),
    search: search || '',
    status: status || '',
    projectWorkState: projectWorkState || '',
    branch: branch || '',
    owner: owner || '',
    fromDate: fromDate || '',
toDate: toDate || '',
legacyFilter: legacyFilter || '',
legacyYear: legacyYear || '',
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

@Patch('documents/:id/customer-visibility')
updateDocumentCustomerVisibility(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.updateDocumentCustomerVisibility(
    id,
    body,
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'ACCOUNT_MANAGER', 'STOCK_MANAGER')

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

@Roles('OWNER', 'PROJECT_MANAGER', 'ACCOUNT_MANAGER', 'STOCK_MANAGER')

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

@Roles('OWNER', 'PROJECT_MANAGER', 'ACCOUNT_MANAGER', 'STOCK_MANAGER')

@Patch('material-master/:id/delete')
deleteMaterialMaster(@Param('id') id: string) {
  return this.projectService.deleteMaterialMaster(Number(id));
}

@Roles('OWNER', 'PROJECT_MANAGER', 'ACCOUNT_MANAGER', 'STOCK_MANAGER')

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

@Roles('OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
@Post('cleaning/assign')
assignProjectCleaning(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.assignProjectCleaning(
    body,
    user,
  );
}

@Get(':id/cleaning-assignments')
getProjectCleaningAssignments(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.getProjectCleaningAssignments(
    Number(id),
    user,
  );
}

@Get('cleaning/my')
getMyCleaningAssignments(
  @CurrentUser() user: any,
) {
  return this.projectService.getMyCleaningAssignments(user);
}

@Patch('cleaning/:id')
updateCleaningAssignment(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.updateCleaningAssignment(
    Number(id),
    body,
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
@Patch('cleaning/:id/hide')
hideCleaningAssignment(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.hideCleaningAssignment(
    Number(id),
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
@Get('cleaning/reminders')
getCleaningReminders(
  @Query('type') type: string,
  @CurrentUser() user: any,
) {
  return this.projectService.getCleaningReminders(
    type,
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
@Get('cleaning/by-date')
getCleaningByDate(
  @Query('date') date: string,
  @CurrentUser() user: any,
) {
  return this.projectService.getCleaningByDate(
    date,
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Get('contractor-reschedule')
listContractorRescheduleRequests(
  @Query() query: any,
  @CurrentUser() user: any,
) {
  return this.projectService.listContractorRescheduleRequests(
    query,
    user,
  );
}

@Post('contractor-reschedule/request')
requestContractorReschedule(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.requestContractorReschedule(
    body,
    user,
  );
}

@Get('contractor-reschedule/my')
getMyContractorRescheduleRequests(
  @CurrentUser() user: any,
) {
  return this.projectService.getMyContractorRescheduleRequests(user);
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Get('contractor-reschedule/pending')
getPendingContractorRescheduleRequests(
  @CurrentUser() user: any,
) {
  return this.projectService.getPendingContractorRescheduleRequests(user);
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Patch('contractor-reschedule/:id/approve')
approveContractorRescheduleRequest(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.approveContractorRescheduleRequest(
    Number(id),
    body,
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER')
@Patch('contractor-reschedule/:id/reject')
rejectContractorRescheduleRequest(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.rejectContractorRescheduleRequest(
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

@Roles('OWNER', 'PROJECT_MANAGER')
@Get('contractor-assignments/register')
getContractorAssignmentRegister(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('search') search?: string,
  @Query('status') status?: string,
  @Query('workScope') workScope?: string,
  @Query('contractorId') contractorId?: string,
  @Query('projectId') projectId?: string,
  @Query('projectName') projectName?: string,
  @CurrentUser() user?: any,
) {
  return this.projectService.getContractorAssignmentRegister(
    {
      page: Number(page || 1),
      limit: Number(limit || 20),
      search: search || '',
      status: status || '',
      workScope: workScope || '',
      contractorId: contractorId || '',
      projectId: projectId || '',
      projectName: projectName || '',
    },
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
  'STOCK_MANAGER',
  'SOLAR_FRANCHISE'
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

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'TRADING_MANAGER',
)
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

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'TRADING_MANAGER',
)
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
  @Query('vendorId') vendorId?: string,
  @Query('vendorName') vendorName?: string,
  @Query('material') material?: string,
  @Query('fromDate') fromDate?: string,
  @Query('toDate') toDate?: string,
) {
  return this.projectService.getProformaInvoices({
    page: Number(page || 1),
    limit: Number(limit || 20),
    search: search || '',
    status: status || '',
    vendorId: vendorId || '',
    vendorName: vendorName || '',
    material: material || '',
    fromDate: fromDate || '',
    toDate: toDate || '',
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

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'TRADING_MANAGER',
)
@Post('proforma-invoice/manual')
createManualProformaInvoice(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createManualProformaInvoice(
    body,
    user,
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

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'TRADING_MANAGER',
)
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

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'TRADING_MANAGER',
)
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
  @Query('vendorId') vendorId?: string,
  @Query('vendorName') vendorName?: string,
  @Query('material') material?: string,
  @Query('fromDate') fromDate?: string,
  @Query('toDate') toDate?: string,
) {
  return this.projectService.getFinalInvoices({
    page: Number(page || 1),
    limit: Number(limit || 20),
    search: search || '',
    status: status || '',
    vendorId: vendorId || '',
    vendorName: vendorName || '',
    material: material || '',
    fromDate: fromDate || '',
    toDate: toDate || '',
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

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'TRADING_MANAGER',
)
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

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'TRADING_MANAGER',
)
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

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'TRADING_MANAGER',
)
@Post('final-invoice/manual')
createManualFinalInvoice(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createFinalInvoice(
    body,
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'SOLAR_FRANCHISE')
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

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'TRADING_MANAGER',
)
@Get('accounts/finance-hub')
getFinanceHubSummary() {
  return this.projectService.getFinanceHubSummary();
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Get('accounts/project-profit')
getProjectProfitSummary(@Query() query: any) {
  return this.projectService.getProjectProfitSummary(query);
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
  @Query('entryType') entryType?: string,
  @Query('fromDate') fromDate?: string,
  @Query('toDate') toDate?: string,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
) {
  return this.projectService.getLedgerEntries({
    partyName,
    partyType,
    projectId: projectId ? Number(projectId) : undefined,
    sourceType,
    entryType,
    fromDate,
    toDate,
    page: Number(page || 1),
    limit: Number(limit || 20),
  });
}

@Get('ledger/summary')
getLedgerOutstandingSummary() {
  return this.projectService.getLedgerOutstandingSummary();
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'TRADING_MANAGER',
)
@Get('accounts/outstanding-summary')
getFinanceOutstandingSummary() {
  return this.projectService.getFinanceOutstandingSummary();
}

@Get(':id/accounts-summary')
getProjectAccountsSummary(
  @Param('id') id: string,
) {
  return this.projectService.getProjectAccountsSummary(
    Number(id),
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Get('finance-summary')
getFinanceSummary(
  @Query() query: any,
  @Req() req: any,
) {
  return this.projectService.getFinanceSummary(
    query,
    req.user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Get('account-expenses/summary')
getAccountExpenseSummary() {
  return this.projectService.getAccountExpenseSummary();
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Post('account-expenses')
createAccountExpense(
  @Body() body: any,
  @Req() req: any,
) {
  return this.projectService.createAccountExpense(
    body,
    req.user,
  );
}

@Roles(
  'OWNER',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Patch('account-expenses/:expenseId')
updateAccountExpense(
  @Param('expenseId', ParseIntPipe)
  expenseId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.updateAccountExpense(
    expenseId,
    body,
    req.user,
  );
}

@Roles(
  'OWNER',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Patch('account-expenses/:expenseId/hide')
hideAccountExpense(
  @Param('expenseId', ParseIntPipe)
  expenseId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.hideAccountExpense(
    expenseId,
    body,
    req.user,
  );
}

@Post('account-expenses/request')
createMyAccountExpenseRequest(
  @Body() body: any,
  @Req() req: any,
) {
  return this.projectService.createAccountExpense(
    body,
    req.user,
  );
}

@Get('account-expenses/my')
getMyAccountExpenses(
  @Query() query: any,
  @Req() req: any,
) {
  return this.projectService.getMyAccountExpenses(
    query,
    req.user,
  );
}

@Post('account-expenses/proof/upload')
@UseInterceptors(FilesInterceptor('files', 1))
async uploadAccountExpenseProof(
  @UploadedFiles() files: any[],
) {
  const file = files?.[0];

  return this.projectService.uploadAccountExpenseProof(file);
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Get('accounts/reports/salary')
getSalaryReport(@Query() query: any) {
  return this.projectService.getSalaryReport(query);
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Get('accounts/reports/incentive')
getIncentiveReport(@Query() query: any) {
  return this.projectService.getIncentiveReport(query);
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Get('account-expenses/report')
getAccountExpenseReport(@Query() query: any) {
  return this.projectService.getAccountExpenseReport(
    query,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Get('accounts/reports/monthly-profit')
getMonthlyProfitReport(@Query() query: any) {
  return this.projectService.getMonthlyProfitReport(
    query,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Get('accounts/reports/branch-profit')
getBranchWiseProfitReport(@Query() query: any) {
  return this.projectService.getBranchWiseProfitReport(
    query,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Get('accounts/reports/project-owner-profit')
getProjectOwnerWiseProfitReport(@Query() query: any) {
  return this.projectService.getProjectOwnerWiseProfitReport(
    query,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Get('account-expenses')
listAccountExpenses() {
  return this.projectService.listAccountExpenses();
}

@Roles(
  'OWNER',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Post('account-expenses/:expenseId/approve')
approveAccountExpense(
  @Param('expenseId', ParseIntPipe)
  expenseId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.approveAccountExpense(
    expenseId,
    body,
    req.user,
  );
}

@Roles(
  'OWNER',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Post('account-expenses/:expenseId/reject')
rejectAccountExpense(
  @Param('expenseId', ParseIntPipe)
  expenseId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.rejectAccountExpense(
    expenseId,
    body,
    req.user,
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
getPartyOutstanding(@Query() query: any) {
  return this.projectService.getPartyOutstandingPaginated(query);
}

@Post('ledger/:id/hide')
hideLedgerEntry(
  @Param('id') id: string,
  @Req() req: any,
) {
  return this.projectService.hideLedgerEntry(
    Number(id),
    req.user,
  );
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

@Get('stock/material-summary')
getMaterialWiseStockSummary(
  @Query('material') material?: string,
) {
  return this.projectService.getMaterialWiseStockSummary({
    material: material || '',
  });
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'STOCK_MANAGER',
)
@Get('stock/items')
listProjectStockItems(@Query() query: any) {
  return this.projectService.listProjectStockItems(query);
}

@Roles('OWNER', 'PROJECT_MANAGER', 'PROJECT_EXECUTIVE', 'STOCK_MANAGER')
@Post('stock/receive')
receiveProjectStock(
  @Body() body: any,
  @Req() req: any,
) {
  return this.projectService.receiveProjectStock(
    body,
    req.user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'PROJECT_EXECUTIVE', 'STOCK_MANAGER')
@Post('stock/issue')
issueProjectStock(
  @Body() body: any,
  @Req() req: any,
) {
  return this.projectService.issueProjectStock(
    body,
    req.user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
)
@Get('stock/movements')
listProjectStockMovements(
  @Query() query: any,
) {
  return this.projectService.listProjectStockMovements(
    query,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'STOCK_MANAGER')
@Patch('stock/items/:id/dealer-visibility')
updateStockItemDealerVisibility(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.updateStockItemDealerVisibility(
    id,
    body,
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'STOCK_MANAGER')
@Patch('stock/movements/:movementId/hide')
hideProjectStockMovement(
  @Param('movementId', ParseIntPipe)
  movementId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.hideProjectStockMovement(
    movementId,
    body,
    req.user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'STOCK_MANAGER')
@Patch('stock/movements/:movementId/restore')
restoreProjectStockMovement(
  @Param('movementId', ParseIntPipe)
  movementId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.restoreProjectStockMovement(
    movementId,
    body,
    req.user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'STOCK_MANAGER')
@Patch('stock/items/:stockItemId/hide')
hideProjectStockItem(
  @Param('stockItemId', ParseIntPipe)
  stockItemId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.hideProjectStockItem(
    stockItemId,
    body,
    req.user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'STOCK_MANAGER',)
@Patch('stock/items/:stockItemId/restore')
restoreProjectStockItem(
  @Param('stockItemId', ParseIntPipe)
  stockItemId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.restoreProjectStockItem(
    stockItemId,
    body,
    req.user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'STOCK_MANAGER',
)
@Get('stock/branch-wise')
getBranchWiseStockReport(@Query() query: any) {
  return this.projectService.getBranchWiseStockReport(
    query,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'PROJECT_EXECUTIVE', 'STOCK_MANAGER')
@Post('stock/issue-to-project')
issueStockToProject(
  @Body() body: any,
  @Req() req: any,
) {
  return this.projectService.issueStockToProject(
    body,
    req.user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
)
@Get('consumptions')
listProjectConsumptions(@Query() query: any) {
  return this.projectService.listProjectConsumptions(
    query,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'STOCK_MANAGER')
@Patch('consumptions/:consumptionId/hide')
hideProjectConsumption(
  @Param('consumptionId', ParseIntPipe)
  consumptionId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.hideProjectConsumption(
    consumptionId,
    body,
    req.user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'STOCK_MANAGER')
@Patch('consumptions/:consumptionId/restore')
restoreProjectConsumption(
  @Param('consumptionId', ParseIntPipe)
  consumptionId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.restoreProjectConsumption(
    consumptionId,
    body,
    req.user,
  );
}

@Get('generated-purchase-orders')
getGeneratedPurchaseOrders(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('search') search?: string,
  @Query('status') status?: string,
  @Query('vendorId') vendorId?: string,
  @Query('vendorName') vendorName?: string,
  @Query('material') material?: string,
  @Query('fromDate') fromDate?: string,
  @Query('toDate') toDate?: string,
) {
  return this.projectService.getGeneratedPurchaseOrders({
    page: Number(page || 1),
    limit: Number(limit || 20),
    search: search || '',
    status: status || '',
    vendorId: vendorId || '',
    vendorName: vendorName || '',
    material: material || '',
    fromDate: fromDate || '',
    toDate: toDate || '',
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

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'TRADING_MANAGER',
)
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

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'TRADING_MANAGER',
)
@Post('purchase-order/manual')
createManualPurchaseOrder(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createManualPurchaseOrder(
    body,
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

@Roles('OWNER', 'PROJECT_MANAGER', 'PROJECT_EXECUTIVE', 'STOCK_MANAGER',)
@Get('material-requests/approved-for-issue')
listApprovedMaterialRequestsForIssue(
  @Query() query: any,
) {
  return this.projectService.listApprovedMaterialRequestsForIssue(
    query,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'STOCK_MANAGER')
@Post('material-requests/items/:itemId/issue-stock')
issueMaterialRequestItemStock(
  @Param('itemId', ParseIntPipe)
  itemId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.issueMaterialRequestItemStock(
    itemId,
    body,
    req.user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'PROJECT_EXECUTIVE' , 'STOCK_MANAGER')
@Post('stock/transfer')
transferProjectStock(
  @Body() body: any,
  @Req() req: any,
) {
  return this.projectService.transferProjectStock(
    body,
    req.user,
  );
}

@Get(':id/loan-detail')
getProjectLoanDetail(@Param('id') id: string) {
  return this.projectService.getProjectLoanDetail(Number(id));
}

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'LOAN_MANAGER', 'SOLAR_FRANCHISE')

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

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'SUBSIDY_MANAGER', 'SOLAR_FRANCHISE')

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

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'ELECTRICITY_MANAGER', 'SOLAR_FRANCHISE')

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
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PROJECT_EXECUTIVE',
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
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PROJECT_EXECUTIVE',
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

@Roles(
  'OWNER',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)

@Post('payment-collection/installments/:installmentId/approve')
approvePaymentInstallment(
  @Param('installmentId', ParseIntPipe)
  installmentId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.approvePaymentInstallment(
    installmentId,
    body,
    req.user,
  );
}

@Roles(
  'OWNER',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)

@Post('payment-collection/installments/:installmentId/reject')
rejectPaymentInstallment(
  @Param('installmentId', ParseIntPipe)
  installmentId: number,

  @Body() body: any,

  @Req() req: any,
) {
  return this.projectService.rejectPaymentInstallment(
    installmentId,
    body,
    req.user,
  );
}

@Roles('OWNER')
@Patch('payment-collection/installments/:id/edit-installment')
updatePaymentInstallment(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.updatePaymentInstallment(
    Number(id),
    body,
    user,
  );
}

@Roles('OWNER')
@Patch('payment-collection/installments/:id/edit-payment')
updatePaymentEntry(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.updatePaymentEntry(
    Number(id),
    body,
    user,
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

@Get(':id/loan-co-applicants')
getProjectLoanCoApplicants(
  @Param('id') id: string,
) {
  return this.projectService.getProjectLoanCoApplicants(
    Number(id),
  );
}

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'LOAN_MANAGER')
@Post(':id/loan-co-applicants')
saveProjectLoanCoApplicant(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.saveProjectLoanCoApplicant(
    Number(id),
    body,
    user,
  );
}

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'LOAN_MANAGER')
@Patch('loan-co-applicants/:id')
updateProjectLoanCoApplicant(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.updateProjectLoanCoApplicant(
    Number(id),
    body,
    user,
  );
}

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'LOAN_MANAGER')
@Patch('loan-co-applicants/:id/delete')
deleteProjectLoanCoApplicant(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.deleteProjectLoanCoApplicant(
    Number(id),
    user,
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

@Post(':id/customer-updates')
createCustomerUpdate(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createCustomerUpdate(
    Number(id),
    body,
    user,
  );
}

@Get(':id/customer-updates')
getCustomerUpdates(
  @Param('id') id: string,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('showHidden') showHidden?: string,
  @Query('customerView') customerView?: string,
  @CurrentUser() user?: any,
) {
  return this.projectService.getCustomerUpdates(
    Number(id),
    {
      page: Number(page || 1),
      limit: Number(limit || 20),
      showHidden: showHidden || 'false',
      customerView: customerView || 'false',
    },
    user,
  );
}

@Patch('customer-updates/:id/hide')
hideCustomerUpdate(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.hideCustomerUpdate(
    Number(id),
    body,
    user,
  );
}

@Patch('customer-updates/:id/restore')
restoreCustomerUpdate(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.restoreCustomerUpdate(
    Number(id),
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Get('dealer/catalog')
getDealerCatalog(@Query() query: any) {
  return this.projectService.getDealerCatalog(query);
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Get('dealer/list')
getDealers(@Query() query: any) {
  return this.projectService.getDealers(query);
}

@Roles(
  'OWNER',
  'ACCOUNT_MANAGER',
  'TRADING_MANAGER',
  'STOCK_MANAGER',
)
@Post('dealer/sync-portal')
syncDealersToPortal() {
  return this.projectService.syncDealersToPortal();
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'STOCK_MANAGER',
)
@Post('dealer')
createDealer(@Body() body: any) {
  return this.projectService.createDealer(body);
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Post('dealer-order')
createDealerOrder(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createDealerOrder(
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Get('dealer-orders')
getDealerOrders(@Query() query: any) {
  return this.projectService.getDealerOrders(query);
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Get('dealer-order/:id')
getDealerOrderById(@Param('id') id: string) {
  return this.projectService.getDealerOrderById(
    Number(id),
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'STOCK_MANAGER',
)
@Patch('dealer-order/:id/status')
updateDealerOrderStatus(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.updateDealerOrderStatus(
    Number(id),
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Post('dealer-payment')
addDealerOrderPayment(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.addDealerOrderPayment(
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Post('dealer-comment')
addDealerOrderComment(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.addDealerOrderComment(
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Get('dealer-analytics')
getDealerAnalytics() {
  return this.projectService.getDealerAnalytics();
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'STOCK_MANAGER',
)
@Patch('dealer-order/:id/hide')
hideDealerOrder(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.hideDealerOrder(
    Number(id),
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'STOCK_MANAGER',
)
@Patch('dealer-order/:id/restore')
restoreDealerOrder(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.restoreDealerOrder(
    Number(id),
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'STOCK_MANAGER',
)
@Post('dealer-order/:id/proforma-invoice')
createDealerOrderProformaInvoice(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createDealerOrderProformaInvoice(
    Number(id),
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'STOCK_MANAGER',
)
@Post('dealer-order/:id/final-invoice')
createDealerOrderFinalInvoice(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createDealerOrderFinalInvoice(
    Number(id),
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Get('dealer-order/:id/invoices')
getDealerOrderInvoices(
  @Param('id') id: string,
) {
  return this.projectService.getDealerOrderInvoices(
    Number(id),
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'STOCK_MANAGER',
)
@Post('dealer-notification')
createDealerNotification(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createDealerNotification(
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Get('dealer-notifications')
getDealerNotifications(@Query() query: any) {
  return this.projectService.getDealerNotifications(
    query,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Patch('dealer-notification/:id/read')
markDealerNotificationRead(
  @Param('id') id: string,
) {
  return this.projectService.markDealerNotificationRead(
    Number(id),
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Post('dealer-monthly-requirement')
createDealerMonthlyRequirement(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createDealerMonthlyRequirement(
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Get('dealer-monthly-requirements')
getDealerMonthlyRequirements(@Query() query: any) {
  return this.projectService.getDealerMonthlyRequirements(
    query,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'STOCK_MANAGER',
)
@Patch('dealer-monthly-requirement/:id/hide')
hideDealerMonthlyRequirement(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.hideDealerMonthlyRequirement(
    Number(id),
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'STOCK_MANAGER',
)
@Patch('dealer-monthly-requirement/:id/restore')
restoreDealerMonthlyRequirement(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.restoreDealerMonthlyRequirement(
    Number(id),
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'STOCK_MANAGER',
)
@Get('dealer-credit-reminders')
getDealerCreditReminders() {
  return this.projectService.getDealerCreditReminders();
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
  'TRADING_MANAGER',
  'MEETING_MANAGER',
  'STOCK_MANAGER',
)
@Get('dealer-ledger-history')
getDealerLedgerHistory(@Query() query: any) {
  return this.projectService.getDealerLedgerHistory(
    query,
  );
}

@Post('dealer-payment-receipt/upload')
@UseInterceptors(FilesInterceptor('files', 1))
async uploadDealerPaymentReceipt(
  @UploadedFiles() files: any[],
) {
  const file = files?.[0];

  return this.projectService.uploadDealerPaymentReceipt(file);
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'TRADING_MANAGER',
)
@Post('trading-meeting')
createTradingMeeting(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createTradingMeeting(body, user);
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'TRADING_MANAGER',
)
@Get('trading-meetings')
getTradingMeetings(
  @Query() query: any,
  @CurrentUser() user: any,
) {
  return this.projectService.getTradingMeetings(query, user);
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'TRADING_MANAGER',
)
@Get('trading-meeting-analytics')
getTradingMeetingAnalytics(@CurrentUser() user: any) {
  return this.projectService.getTradingMeetingAnalytics(user);
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'TRADING_MANAGER',
)
@Get('trading-meeting/:id')
getTradingMeetingDetail(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.getTradingMeetingDetail(
    Number(id),
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'TRADING_MANAGER',
)
@Patch('trading-meeting/:id/status')
updateTradingMeetingStatus(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.updateTradingMeetingStatus(
    Number(id),
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'TRADING_MANAGER',
)
@Patch('trading-meeting/:id/hide')
hideTradingMeeting(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.hideTradingMeeting(
    Number(id),
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'TRADING_MANAGER',
)
@Patch('trading-meeting/:id/restore')
restoreTradingMeeting(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.restoreTradingMeeting(
    Number(id),
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'TRADING_MANAGER',
)
@Post('trading-meeting/:id/followup')
createTradingMeetingFollowup(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createTradingMeetingFollowup(
    Number(id),
    body,
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'TRADING_MANAGER',
)
@Get('trading-meeting/:id/followups')
getTradingMeetingFollowups(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.getTradingMeetingFollowups(
    Number(id),
    user,
  );
}

@Roles(
  'OWNER',
  'PROJECT_MANAGER',
  'ACCOUNT_MANAGER',
  'TRADING_MANAGER',
)
@Get('trading-meeting/:id/convert-data')
getTradingMeetingConversionData(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.getTradingMeetingConversionData(
    Number(id),
    user,
  );
}

@Roles('SOLAR_FRANCHISE')
@Post('franchise-payout-request')
createFranchisePayoutRequest(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.createFranchisePayoutRequest(
    body,
    user,
  );
}

@Roles('SOLAR_FRANCHISE')
@Get('franchise-payout-request/my')
getMyFranchisePayoutRequests(
  @Query() query: any,
  @CurrentUser() user: any,
) {
  return this.projectService.getMyFranchisePayoutRequests(
    user,
    query,
  );
}

@Roles('OWNER', 'ACCOUNT_MANAGER', 'PAYMENT_MANAGER')
@Get('franchise-payout-request')
getFranchisePayoutRequests(@Query() query: any) {
  return this.projectService.getFranchisePayoutRequests(query);
}

@Roles('OWNER', 'ACCOUNT_MANAGER', 'PAYMENT_MANAGER')
@Patch('franchise-payout-request/:id/status')
updateFranchisePayoutRequestStatus(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.updateFranchisePayoutRequestStatus(
    id,
    body,
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'ACCOUNT_MANAGER', 'STOCK_MANAGER')
@Get('stock/dashboard')
getStockDashboard(@CurrentUser() user: any) {
  return this.projectService.getStockDashboard(user);
}

@Roles('OWNER', 'PROJECT_MANAGER', 'ACCOUNT_MANAGER', 'STOCK_MANAGER')
@Post('stock/receive')
receiveStock(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.receiveStock(body, user);
}

@Roles('OWNER', 'PROJECT_MANAGER', 'ACCOUNT_MANAGER', 'STOCK_MANAGER')
@Post('stock/issue')
issueStock(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.issueStock(body, user);
}

@Patch(':id/hide')
hideProject(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.hideProject(id, body, user);
}

@Get('hidden/list')
getHiddenProjects(@CurrentUser() user: any) {
  return this.projectService.getHiddenProjects(user);
}

@Patch(':id/restore')
restoreProject(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.restoreProject(id, body, user);
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

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER')
@Patch(':id/move-status')
moveProjectStatus(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.moveProjectStatus(
    id,
    body,
    user,
  );
}

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER')
@Patch(':id/cancel')
cancelProject(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.cancelProject(
    id,
    body,
    user,
  );
}

@Roles('OWNER', 'PROJECT_MANAGER', 'ACCOUNT_MANAGER', 'STOCK_MANAGER')
@Post('stock/adjust')
adjustStock(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.projectService.adjustStock(body, user);
}

@Roles('OWNER', 'PROJECT_MANAGER', 'ACCOUNT_MANAGER', 'STOCK_MANAGER')
@Patch('material-requests/:id/approve-stock')
approveMaterialRequestForStock(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.projectService.approveMaterialRequestForStock(
    Number(id),
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
  'SOLAR_FRANCHISE',
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