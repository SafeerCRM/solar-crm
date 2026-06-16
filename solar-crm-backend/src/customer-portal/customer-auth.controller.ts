import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CustomerPortalService } from './customer-portal.service';
import * as jwt from 'jsonwebtoken';

@Controller('customer-auth')
export class CustomerAuthController {
  constructor(private readonly service: CustomerPortalService) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.service.customerLogin(body.username, body.password);
  }

  @Get('dashboard')
  async dashboard(@Req() req: any) {
    const authHeader = req.headers?.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Customer token missing');
    }

    const payload: any = jwt.verify(token, 'mysecretkey');

    if (!payload?.customerId) {
      throw new UnauthorizedException('Invalid customer token');
    }

    return this.service.getCustomerDashboard(Number(payload.customerId));
  }

  @Post('complaints')
async createCustomerComplaint(
  @Req() req: any,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.createComplaint(
    {
      ...body,
      customerId: Number(payload.customerId),
      customerCode: payload.customerCode,
    },
    {
      id: Number(payload.customerId),
      name: payload.customerCode,
      roles: ['CUSTOMER'],
    },
  );
}

@Post('complaint-attachments/upload')
@UseInterceptors(FilesInterceptor('files', 10))
async uploadComplaintAttachments(
  @Req() req: any,
  @UploadedFiles() files: any[],
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.uploadComplaintAttachments(
    files,
    {
      id: Number(payload.customerId),
      name: payload.customerCode,
      roles: ['CUSTOMER'],
    },
  );
}

@Post('referrals')
async createCustomerReferral(
  @Req() req: any,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.createReferral({
    ...body,
    customerId: Number(payload.customerId),
    customerCode: payload.customerCode,
  });
}

@Post('work-date-requests')
async createCustomerWorkDateRequest(
  @Req() req: any,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.createWorkDateRequest({
    ...body,
    customerId: Number(payload.customerId),
    customerCode: payload.customerCode,
  });
}

@Post('payment-receipts')
async createCustomerPaymentReceipt(
  @Req() req: any,
  @Body() body: any,
) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedException('Customer token missing');
  }

  const payload: any = jwt.verify(token, 'mysecretkey');

  if (!payload?.customerId) {
    throw new UnauthorizedException('Invalid customer token');
  }

  return this.service.createPaymentReceipt({
    ...body,
    customerId: Number(payload.customerId),
    customerCode: payload.customerCode,
  });
}
}