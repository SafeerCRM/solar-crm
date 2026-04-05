import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
  @Roles('OWNER', 'LEAD_MANAGER', 'TELECALLING_MANAGER')
  @Get('telecallers')
  findTelecallers() {
    return this.usersService.findTelecallers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @Get()
  findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }
}