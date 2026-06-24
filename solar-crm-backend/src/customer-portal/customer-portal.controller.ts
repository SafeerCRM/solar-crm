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

  @Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'CUSTOMER')
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
  )
  @Get('complaints')
  listComplaints(@Query() query: any) {
    return this.service.listComplaints(query);
  }

  @Roles('OWNER', 'CUSTOMER_MANAGER', 'PROJECT_MANAGER', 'PROJECT_EXECUTIVE')
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
}