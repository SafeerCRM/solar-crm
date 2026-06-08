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
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.customerService.create(body, user);
  }

  @Roles(
    'OWNER',
    'MARKETING_HEAD',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'MEETING_MANAGER',
    'LEAD_MANAGER',
    'CUSTOMER_MANAGER',
  )
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('zone') zone?: string,
    @Query('branch') branch?: string,
    @Query('status') status?: string,
    @Query('customerSource') customerSource?: string,
    @Query('showHidden') showHidden?: string,
    @CurrentUser() user?: any,
  ) {
    return this.customerService.findAll(
      {
        page: Number(page || 1),
        limit: Number(limit || 20),
        search: search || '',
        city: city || '',
        zone: zone || '',
        branch: branch || '',
        status: status || '',
        customerSource: customerSource || '',
        showHidden: showHidden || 'false',
      },
      user,
    );
  }

  @Roles(
    'OWNER',
    'MARKETING_HEAD',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'MEETING_MANAGER',
    'LEAD_MANAGER',
    'CUSTOMER_MANAGER',
  )
  @Get('search')
  search(@Query('query') query: string) {
    return this.customerService.search(query || '');
  }

  @Roles(
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'LEAD_MANAGER',
  'CUSTOMER_MANAGER',
)
@Get('summary')
getSummary() {
  return this.customerService.getSummary();
}

@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
@Post('link-existing-projects')
linkExistingProjects() {
  return this.customerService.linkExistingProjects();
}

@Roles(
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'LEAD_MANAGER',
  'CUSTOMER_MANAGER',
)
@Get(':id/projects')
getCustomerProjects(@Param('id', ParseIntPipe) id: number) {
  return this.customerService.getCustomerProjects(id);
}

  @Roles(
    'OWNER',
    'MARKETING_HEAD',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'MEETING_MANAGER',
    'LEAD_MANAGER',
    'CUSTOMER_MANAGER',
  )
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.findOne(id);
  }

  @Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.customerService.update(id, body, user);
  }

  @Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
  @Patch(':id/hide')
  hide(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.customerService.hide(id, body, user);
  }

  @Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
  @Patch(':id/restore')
  restore(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.customerService.restore(id, body, user);
  }
}