import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
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
}