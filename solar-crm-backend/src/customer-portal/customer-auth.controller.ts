import { Body, Controller, Post } from '@nestjs/common';
import { CustomerPortalService } from './customer-portal.service';

@Controller('customer-auth')
export class CustomerAuthController {
  constructor(private readonly service: CustomerPortalService) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.service.customerLogin(body.username, body.password);
  }
}