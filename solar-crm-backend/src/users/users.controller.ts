import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create-role')
  createRole(@Body() data: Partial<User> & { roles?: UserRole[] }) {
    return this.usersService.createRole(data);
  }

  @Post('create')
  create(@Body() data: Partial<User> & { roles?: UserRole[] }) {
    return this.usersService.create(data);
  }

  @Post('login')
  login(@Body() data: { email: string; password: string }) {
    return this.usersService.login(data.email, data.password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'LEAD_MANAGER', 'TELECALLING_MANAGER')
  @Get('assignable-staff')
  findAssignableStaff() {
    return this.usersService.findAssignableStaff();
  }

    @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TELECALLING_MANAGER', 'TELECALLER', 'TELECALLING_ASSISTANT')
  @Get('telecalling-assistants')
  findTelecallingAssistants() {
    return this.usersService.findTelecallingAssistants();
  }

    @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
  'OWNER',
  'TELECALLING_MANAGER',
  'TELECALLER',
  'TELECALLING_ASSISTANT',
  'LEAD_MANAGER',
  'MEETING_MANAGER',
  'MEETING_ASSISTANT',
  'MARKETING_HEAD',
)
  @Get('meeting-managers')
  findMeetingManagers() {
    return this.usersService.findMeetingManagers();
  }
    @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'TELECALLING_MANAGER', 'TELECALLER', 'TELECALLING_ASSISTANT')
  @Get('lead-managers')
  findLeadManagers() {
    return this.usersService.findLeadManagers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'LEAD_MANAGER', 'TELECALLING_MANAGER')
  @Get('telecallers')
  findTelecallers() {
    return this.usersService.findTelecallers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'HR_MANAGER')
  @Get()
findAllUsers(@Query('includeHidden') includeHidden?: string) {
  return this.usersService.findAllUsers(includeHidden === 'true');
}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @Patch(':id/password')
  updateUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('password') password: string,
  ) {
    return this.usersService.updateUserPassword(id, password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @Patch(':id/roles')
  updateUserRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body('roles') roles: UserRole[],
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateUserRoles(id, roles, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Delete(':id')
deleteUser(
  @Param('id', ParseIntPipe) id: number,
  @Body('reason') reason: string,
  @CurrentUser() user: any,
) {
  return this.usersService.deleteUser(id, user, reason);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Patch(':id/restore')
restoreUser(
  @Param('id', ParseIntPipe) id: number,
  @Body('reason') reason: string,
  @CurrentUser() user: any,
) {
  return this.usersService.restoreUser(id, user, reason);
}

  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
@Get('customers')
findCustomers() {
  return this.usersService.findCustomers();
}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }
}