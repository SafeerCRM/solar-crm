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
import { DealerService } from './dealer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('dealer')
export class DealerController {
  constructor(private readonly dealerService: DealerService) {}

  @Get('health')
  healthCheck() {
    return this.dealerService.healthCheck();
  }

    @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TRADING_MANAGER')
  @Post()
  createDealer(@Body() body: any, @CurrentUser() user: any) {
    return this.dealerService.createDealer(body, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TRADING_MANAGER', 'STOCK_MANAGER', 'ACCOUNT_MANAGER')
  @Get()
  listDealers(@Query() query: any) {
    return this.dealerService.listDealers(query);
  }

    @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TRADING_MANAGER', 'CUSTOMER_MANAGER', 'STOCK_MANAGER')
  @Get('complaints')
  listInternalDealerComplaints(@Query() query: any) {
    return this.dealerService.listInternalDealerComplaints(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TRADING_MANAGER', 'CUSTOMER_MANAGER', 'STOCK_MANAGER')
  @Patch('complaints/:id')
  updateInternalDealerComplaint(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.dealerService.updateInternalDealerComplaint(id, body, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ACCOUNT_MANAGER', 'TRADING_MANAGER')
@Get('company-bank-details')
listCompanyBankDetails(@Query() query: any) {
  return this.dealerService.listCompanyBankDetails(query);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ACCOUNT_MANAGER', 'TRADING_MANAGER')
@Post('company-bank-detail')
saveCompanyBankDetail(@Body() body: any) {
  return this.dealerService.saveCompanyBankDetail(body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ACCOUNT_MANAGER', 'TRADING_MANAGER')
@Patch('company-bank-detail/:id/activate')
activateCompanyBankDetail(@Param('id', ParseIntPipe) id: number) {
  return this.dealerService.activateCompanyBankDetail(id);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ACCOUNT_MANAGER', 'TRADING_MANAGER')
@Patch('company-bank-detail/:id/deactivate')
deactivateCompanyBankDetail(@Param('id', ParseIntPipe) id: number) {
  return this.dealerService.deactivateCompanyBankDetail(id);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ACCOUNT_MANAGER', 'TRADING_MANAGER')
@Get('portal-company-setting')
getPortalCompanySetting() {
  return this.dealerService.getPortalCompanySetting();
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ACCOUNT_MANAGER', 'TRADING_MANAGER')
@Post('portal-company-setting')
savePortalCompanySetting(@Body() body: any) {
  return this.dealerService.savePortalCompanySetting(body);
}

  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'TRADING_MANAGER')
@Patch(':id/portal-password')
updateDealerPortalPassword(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.dealerService.updateDealerPortalPassword(id, body);
}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TRADING_MANAGER', 'STOCK_MANAGER', 'ACCOUNT_MANAGER')
  @Get(':id')
  getDealer(@Param('id', ParseIntPipe) id: number) {
    return this.dealerService.getDealer(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TRADING_MANAGER')
  @Patch(':id')
  updateDealer(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.dealerService.updateDealer(id, body, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TRADING_MANAGER')
  @Patch(':id/hide')
  hideDealer(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.dealerService.hideDealer(id, body, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TRADING_MANAGER')
  @Patch(':id/restore')
  restoreDealer(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.dealerService.restoreDealer(id, body, user);
  }

    @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TRADING_MANAGER', 'ACCOUNT_MANAGER')
  @Post('bank-details')
  createBankDetail(@Body() body: any, @CurrentUser() user: any) {
    return this.dealerService.createBankDetail(body, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TRADING_MANAGER', 'ACCOUNT_MANAGER')
  @Get('bank-details')
  listBankDetails() {
    return this.dealerService.listBankDetails();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TRADING_MANAGER', 'ACCOUNT_MANAGER')
  @Patch('bank-details/:id')
  updateBankDetail(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.dealerService.updateBankDetail(id, body, user);
  }

    @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'STOCK_MANAGER', 'TRADING_MANAGER', 'ACCOUNT_MANAGER')
  @Get('orders')
  listInternalDealerOrders(@Query() query: any) {
    return this.dealerService.listInternalDealerOrders(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'STOCK_MANAGER', 'TRADING_MANAGER', 'ACCOUNT_MANAGER')
  @Get('orders/:id')
  getInternalDealerOrderDetail(@Param('id', ParseIntPipe) id: number) {
    return this.dealerService.getInternalDealerOrderDetail(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ACCOUNT_MANAGER', 'TRADING_MANAGER')
  @Get('payments')
  listInternalDealerPayments(@Query() query: any) {
    return this.dealerService.listInternalDealerPayments(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'STOCK_MANAGER', 'TRADING_MANAGER', 'ACCOUNT_MANAGER')
  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.dealerService.updateDealerOrderStatus(id, body, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'STOCK_MANAGER', 'TRADING_MANAGER')
  @Patch('orders/:id/items/:itemId')
  updateOrderItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.dealerService.updateDealerOrderItem(id, itemId, body, user);
  }

    @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ACCOUNT_MANAGER', 'TRADING_MANAGER')
  @Patch('payments/:id/approve')
  approvePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.dealerService.approveDealerPayment(id, body, user);
  }

    @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ACCOUNT_MANAGER', 'TRADING_MANAGER')
  @Post('orders/:id/final-invoice')
  generateFinalInvoice(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.dealerService.generateDealerFinalInvoice(id, user);
  }
}