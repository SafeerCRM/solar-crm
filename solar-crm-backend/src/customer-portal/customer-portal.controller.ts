import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomerPortalService } from './customer-portal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customer-portal')
export class CustomerPortalController {
  constructor(private readonly service: CustomerPortalService) {}

  @Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'CUSTOMER')
  @Get('dashboard/:customerId')
  getDashboard(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.service.getCustomerDashboard(customerId);
  }

  @Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'CUSTOMER', 'MAINTENANCE_MANAGER',)
  @Post('complaints')
  createComplaint(@Body() body: any, @CurrentUser() user: any) {
    return this.service.createComplaint(body, user);
  }

  @Roles(
    'OWNER',
    'CUSTOMER_MANAGER',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'MEETING_MANAGER',
    'MARKETING_HEAD',
    'MAINTENANCE_MANAGER',
  )
  @Get('complaints')
  listComplaints(@Query() query: any) {
    return this.service.listComplaints(query);
  }

  @Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'PROJECT_EXECUTIVE', 'MAINTENANCE_MANAGER',)
  @Patch('complaints/:id')
  updateComplaint(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.service.updateComplaint(id, body, user);
  }

  @Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'CUSTOMER')
  @Post('referrals')
  createReferral(@Body() body: any) {
    return this.service.createReferral(body);
  }

  @Roles(
  'OWNER',
  'CUSTOMER_MANAGER',
  'PROJECT_MANAGER',
  'MARKETING_HEAD',
  'TELECALLING_MANAGER',
)
@Patch('referrals/:id/assign')
assignReferral(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.service.assignReferral(
    id,
    body,
    user,
  );
}

  @Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'CUSTOMER')
  @Post('work-date-requests')
  createWorkDateRequest(@Body() body: any) {
    return this.service.createWorkDateRequest(body);
  }

  @Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'PAYMENT_MANAGER', 'CUSTOMER')
  @Post('payment-receipts')
  createPaymentReceipt(@Body() body: any) {
    return this.service.createPaymentReceipt(body);
  }

  @Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'PROJECT_EXECUTIVE', 'MARKETING_HEAD')
@Get('work-date-requests')
listWorkDateRequests(@Query() query: any) {
  return this.service.listWorkDateRequests(query);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'PROJECT_EXECUTIVE')
@Patch('work-date-requests/:id')
updateWorkDateRequest(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.service.updateWorkDateRequest(id, body, user);
}

@Roles(
  'OWNER',
  'CUSTOMER_MANAGER',
  'PROJECT_MANAGER',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
  'MARKETING_HEAD',
)
@Get('payment-receipts')
listPaymentReceipts(@Query() query: any) {
  return this.service.listPaymentReceipts(query);
}

@Roles(
  'OWNER',
  'CUSTOMER_MANAGER',
  'PROJECT_MANAGER',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
)
@Patch('payment-receipts/:id')
updatePaymentReceipt(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.service.updatePaymentReceipt(id, body, user);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Get('cleaning-reminders')
listCleaningReminders(@Query() query: any) {
  return this.service.listCleaningReminders(query);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Patch('cleaning-reminders/:id')
updateCleaningReminder(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.service.updateCleaningReminder(id, body, user);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Patch('cleaning-reminders/:id/hide')
hideCleaningReminder(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.service.hideCleaningReminder(id, body, user);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Patch('cleaning-reminders/:id/restore')
restoreCleaningReminder(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.service.restoreCleaningReminder(id, body, user);
}

@Roles(
  'OWNER',
  'CUSTOMER_MANAGER',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'MARKETING_HEAD',
  'MAINTENANCE_MANAGER',
)
@Get('complaints/:id/activities')
getComplaintActivities(@Param('id', ParseIntPipe) id: number) {
  return this.service.getComplaintActivities(id);
}

@Roles(
  'OWNER',
  'CUSTOMER_MANAGER',
  'PROJECT_MANAGER',
  'MARKETING_HEAD',
  'LEAD_MANAGER',
)
@Get('referrals')
listReferrals(@Query() query: any) {
  return this.service.listReferrals(query);
}

@Roles(
  'OWNER',
  'CUSTOMER_MANAGER',
  'PROJECT_MANAGER',
  'MARKETING_HEAD',
  'LEAD_MANAGER',
)
@Patch('referrals/:id')
updateReferral(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.service.updateReferral(id, body, user);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Get('after-sales-services')
listAfterSalesServices(@Query() query: any) {
  return this.service.listAfterSalesServices(query);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Post('after-sales-services')
saveAfterSalesService(@Body() body: any, @CurrentUser() user: any) {
  return this.service.saveAfterSalesService(body, user);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Patch('after-sales-services/:id/hide')
hideAfterSalesService(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.service.hideAfterSalesService(id, body, user);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Patch('after-sales-services/:id/restore')
restoreAfterSalesService(@Param('id', ParseIntPipe) id: number) {
  return this.service.restoreAfterSalesService(id);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Get('after-sales-requests')
listAfterSalesRequests(@Query() query: any) {
  return this.service.listAfterSalesRequests(query);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Patch('after-sales-requests/:id')
updateAfterSalesRequest(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.service.updateAfterSalesRequest(id, body, user);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Get('after-sales-requests/:id/activities')
getAfterSalesRequestActivities(@Param('id', ParseIntPipe) id: number) {
  return this.service.getAfterSalesRequestActivities(id);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Get('after-sales-requests/:id/proofs')
listAfterSalesRequestProofs(@Param('id', ParseIntPipe) id: number) {
  return this.service.listAfterSalesRequestProofs(id);
}

@Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'MAINTENANCE_MANAGER')
@Post('after-sales-requests/:id/proofs')
addAfterSalesRequestProof(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.service.addAfterSalesRequestProof(id, body, user);
}

@Roles(
  'OWNER',
  'CUSTOMER_MANAGER',
  'PROJECT_MANAGER',
  'MARKETING_HEAD',
  'LEAD_MANAGER',
)
@Get('referrals/:id/activities')
getReferralActivities(@Param('id', ParseIntPipe) id: number) {
  return this.service.getReferralActivities(id);
}

@Roles(
  'OWNER',
  'CUSTOMER_MANAGER',
  'PROJECT_MANAGER',
  'MARKETING_HEAD',
  'LEAD_MANAGER',
)
@Post('referrals/:id/convert-to-lead')
convertReferralToLead(
  @Param('id', ParseIntPipe) id: number,
  @CurrentUser() user: any,
) {
  return this.service.convertReferralToLead(id, user);
}
}