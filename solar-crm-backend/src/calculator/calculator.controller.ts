import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { CreateCalculatorDto } from './dto/create-calculator.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('calculator')
@UseGuards(JwtAuthGuard)
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Post()
  async create(@Body() dto: CreateCalculatorDto, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id || null;
    return this.calculatorService.create(dto, userId);
  }

  @Post('calculate')
  async calculate(@Body() body: any) {
    return this.calculatorService.calculateProjectCost(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @Get('settings')
  getSettings() {
    return this.calculatorService.getSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @Patch('settings')
  updateSettings(@Body() body: any) {
    return this.calculatorService.updateSettings(body);
  }

  @Get('meeting/:meetingId')
  async findByMeetingId(
    @Param('meetingId', ParseIntPipe) meetingId: number,
  ) {
    return this.calculatorService.findByMeetingId(meetingId);
  }

  @Get('panel-options')
getPanelOptions(
  @Req() req: any,
) {
  const category = String(req.query?.category || 'DCR').toUpperCase();
  const type = String(req.query?.type || 'P Type');

  return this.calculatorService.getPanelOptions(
    category as 'DCR' | 'NONDCR',
    type as 'P Type' | 'N Type',
  );
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Post('panel-options')
createPanelOption(@Body() body: any) {
  return this.calculatorService.createPanelOption(body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Patch('panel-options/:id')
updatePanelOption(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.calculatorService.updatePanelOption(id, body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Delete('panel-options/:id')
deletePanelOption(@Param('id', ParseIntPipe) id: number) {
  return this.calculatorService.deletePanelOption(id);
}

  @Get()
  async findAll() {
    return this.calculatorService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.calculatorService.findOne(id);
  }
}