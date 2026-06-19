import {
  Body,
  Controller,
  Get,
  Param,
ParseIntPipe,
Patch,
Query,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UploadedFiles,
UseInterceptors,
} from '@nestjs/common';
import { DealerService } from './dealer.service';
import * as jwt from 'jsonwebtoken';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

@Controller('dealer-auth')
export class DealerAuthController {
  constructor(private readonly service: DealerService) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.service.dealerLogin(body.username, body.password);
  }

  @Get('dashboard')
  async dashboard(@Req() req: any) {
    const payload = this.getDealerPayload(req);

    return this.service.getDealerDashboard(Number(payload.dealerId));
  }

    @Get('stock')
  async stock(@Req() req: any) {
    this.getDealerPayload(req);

    return this.service.getDealerStock();
  }

    @Get('bank-details')
  async bankDetails(@Req() req: any) {
    this.getDealerPayload(req);

    return this.service.getBankDetails();
  }

    @Get('staff-contacts')
  async staffContacts(@Req() req: any) {
    this.getDealerPayload(req);

    return this.service.getStaffContacts();
  }

    @Post('orders')
  async createOrder(@Req() req: any, @Body() body: any) {
    const payload = this.getDealerPayload(req);

    return this.service.createDealerOrder(Number(payload.dealerId), body);
  }

    @Get('orders')
  async listOrders(@Req() req: any, @Query() query: any) {
    const payload = this.getDealerPayload(req);

    return this.service.listDealerOrders(Number(payload.dealerId), query);
  }

  @Get('orders/:id')
  async getOrderDetail(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.getDealerOrderDetail(Number(payload.dealerId), id);
  }

    @Get('orders/:id/proforma-invoice')
  async getOrderProformaInvoice(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.getDealerOrderProformaInvoice(
      Number(payload.dealerId),
      id,
    );
  }

  @Get('orders/:id/final-invoice')
  async getOrderFinalInvoice(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.getDealerOrderFinalInvoice(
      Number(payload.dealerId),
      id,
    );
  }

    @Get('analytics')
  async analytics(@Req() req: any) {
    const payload = this.getDealerPayload(req);

    return this.service.getDealerAnalytics(Number(payload.dealerId));
  }

    @Post('payments')
  async createPayment(@Req() req: any, @Body() body: any) {
    const payload = this.getDealerPayload(req);

    return this.service.createDealerPayment(Number(payload.dealerId), body);
  }

    @Post('payment-receipts/upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadPaymentReceipts(
    @Req() req: any,
    @UploadedFiles() files: any[],
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.uploadDealerPaymentReceipts(files, {
      id: Number(payload.dealerId),
      name: payload.dealerName,
      roles: ['DEALER'],
    });
  }

    @Post('complaint-photos/upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadComplaintPhotos(
    @Req() req: any,
    @UploadedFiles() files: any[],
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.uploadDealerComplaintPhotos(files, {
      id: Number(payload.dealerId),
      name: payload.dealerName,
      roles: ['DEALER'],
    });
  }

  @Post('complaints')
  async createComplaint(@Req() req: any, @Body() body: any) {
    const payload = this.getDealerPayload(req);

    return this.service.createDealerComplaint(
      Number(payload.dealerId),
      body,
      {
        id: Number(payload.dealerId),
        name: payload.dealerName,
        roles: ['DEALER'],
      },
    );
  }

  @Get('complaints')
  async listComplaints(@Req() req: any, @Query() query: any) {
    const payload = this.getDealerPayload(req);

    return this.service.listDealerComplaints(Number(payload.dealerId), query);
  }

    @Post('orders/:id/comments')
  async createOrderComment(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.createDealerOrderComment(
      Number(payload.dealerId),
      id,
      body,
      {
        id: Number(payload.dealerId),
        name: payload.dealerName,
        roles: ['DEALER'],
      },
    );
  }

  @Get('orders/:id/comments')
  async listOrderComments(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.listDealerOrderComments(Number(payload.dealerId), id);
  }

    @Get('notifications')
  async listNotifications(@Req() req: any, @Query() query: any) {
    const payload = this.getDealerPayload(req);

    return this.service.listDealerNotifications(
      Number(payload.dealerId),
      query,
    );
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.markDealerNotificationRead(
      Number(payload.dealerId),
      id,
    );
  }

    @Post('monthly-requirements')
  async createMonthlyRequirement(@Req() req: any, @Body() body: any) {
    const payload = this.getDealerPayload(req);

    return this.service.createMonthlyRequirement(
      Number(payload.dealerId),
      body,
      {
        id: Number(payload.dealerId),
        name: payload.dealerName,
        roles: ['DEALER'],
      },
    );
  }

  @Get('monthly-requirements')
  async listMonthlyRequirements(@Req() req: any, @Query() query: any) {
    const payload = this.getDealerPayload(req);

    return this.service.listMonthlyRequirements(
      Number(payload.dealerId),
      query,
    );
  }

    @Get('proforma-invoice/:id/pdf')
  async dealerProformaInvoicePdf(
    @Req() req: any,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.generateDealerProformaInvoicePdf(
      Number(payload.dealerId),
      id,
      res,
    );
  }

  @Get('final-invoice/:id/pdf')
  async dealerFinalInvoicePdf(
    @Req() req: any,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.generateDealerFinalInvoicePdf(
      Number(payload.dealerId),
      id,
      res,
    );
  }

    @Get('orders/:id/invoices')
  async dealerOrderInvoices(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const payload = this.getDealerPayload(req);

    return this.service.getDealerOrderInvoicesForPortal(
      Number(payload.dealerId),
      id,
    );
  }

  private getDealerPayload(req: any) {
    const authHeader = req.headers?.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Dealer token missing');
    }

    const payload: any = jwt.verify(token, 'mysecretkey');

    if (!payload?.dealerId) {
      throw new UnauthorizedException('Invalid dealer token');
    }

    return payload;
  }
}