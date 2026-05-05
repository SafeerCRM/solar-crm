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
async calculate(@Body() body: any, @Req() req: any) {
  return this.calculatorService.calculateProjectCost(body, req.user);
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

@Get('discount-options')
getDiscountOptions() {
  return this.calculatorService.getDiscountOptions();
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Post('discount-options')
createDiscountOption(@Body() body: any) {
  return this.calculatorService.createDiscountOption(body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Patch('discount-options/:id')
updateDiscountOption(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.calculatorService.updateDiscountOption(id, body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Delete('discount-options/:id')
deleteDiscountOption(@Param('id', ParseIntPipe) id: number) {
  return this.calculatorService.deleteDiscountOption(id);
}

@Get('expected-profit-options')
getExpectedProfitOptions() {
  return this.calculatorService.getExpectedProfitOptions();
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Post('expected-profit-options')
createExpectedProfitOption(@Body() body: any) {
  return this.calculatorService.createExpectedProfitOption(body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Patch('expected-profit-options/:id')
updateExpectedProfitOption(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.calculatorService.updateExpectedProfitOption(id, body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Delete('expected-profit-options/:id')
deleteExpectedProfitOption(@Param('id', ParseIntPipe) id: number) {
  return this.calculatorService.deleteExpectedProfitOption(id);
}

@Get('kit-options')
getKitOptions() {
  return this.calculatorService.getKitOptions();
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Post('kit-options')
createKitOption(@Body() body: any) {
  return this.calculatorService.createKitOption(body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Patch('kit-options/:id')
updateKitOption(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.calculatorService.updateKitOption(id, body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Delete('kit-options/:id')
deleteKitOption(@Param('id', ParseIntPipe) id: number) {
  return this.calculatorService.deleteKitOption(id);
}

@Get('battery-options')
getBatteryOptions(@Req() req: any) {
  const type = req.query?.type ? String(req.query.type) : undefined;
  return this.calculatorService.getBatteryOptions(type);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Post('battery-options')
createBatteryOption(@Body() body: any) {
  return this.calculatorService.createBatteryOption(body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Patch('battery-options/:id')
updateBatteryOption(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.calculatorService.updateBatteryOption(id, body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Delete('battery-options/:id')
deleteBatteryOption(@Param('id', ParseIntPipe) id: number) {
  return this.calculatorService.deleteBatteryOption(id);
}

@Get('hybrid-options')
getHybridOptions(@Req() req: any) {
  const phase = String(req.query.phase || 'Single Phase');
  return this.calculatorService.getHybridOptions(phase);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Post('hybrid-options')
createHybridOption(@Body() body: any) {
  return this.calculatorService.createHybridOption(body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Patch('hybrid-options/:id')
updateHybridOption(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.calculatorService.updateHybridOption(id, body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Delete('hybrid-options/:id')
deleteHybridOption(@Param('id', ParseIntPipe) id: number) {
  return this.calculatorService.deleteHybridOption(id);
}

@UseGuards()
@Get('margin-options')
getMarginOptions() {
  console.log('✅ margin-options route hit');
  return this.calculatorService.getMarginOptions();
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Post('margin-options')
createMarginOption(@Body() body: any) {
  return this.calculatorService.createMarginOption(body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Patch('margin-options/:id')
updateMarginOption(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
  return this.calculatorService.updateMarginOption(id, body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Delete('margin-options/:id')
deleteMarginOption(@Param('id', ParseIntPipe) id: number) {
  return this.calculatorService.deleteMarginOption(id);
}

@Get('electrical-options')
getElectricalOptions() {
  return this.calculatorService.getElectricalOptions();
}

@Get('structure-options')
getStructureOptions(@Req() req: any) {
  const type = req.query?.type ? String(req.query.type) : undefined;
  return this.calculatorService.getStructureOptions(type);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Post('structure-options')
createStructureOption(@Body() body: any) {
  return this.calculatorService.createStructureOption(body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Patch('structure-options/:id')
updateStructureOption(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.calculatorService.updateStructureOption(id, body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Delete('structure-options/:id')
deleteStructureOption(@Param('id', ParseIntPipe) id: number) {
  return this.calculatorService.deleteStructureOption(id);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Post('electrical-options')
createElectricalOption(@Body() body: any) {
  return this.calculatorService.createElectricalOption(body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Patch('electrical-options/:id')
updateElectricalOption(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.calculatorService.updateElectricalOption(id, body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Delete('electrical-options/:id')
deleteElectricalOption(@Param('id', ParseIntPipe) id: number) {
  return this.calculatorService.deleteElectricalOption(id);
}

@Get('ongrid-options')
getOngridOptions(@Req() req: any) {
  const phase = String(req.query.phase || '1 Phase');

  return this.calculatorService.getOngridOptions(
    phase as '1 Phase' | '3 Phase',
  );
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Post('ongrid-options')
createOngridOption(@Body() body: any) {
  return this.calculatorService.createOngridOption(body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Patch('ongrid-options/:id')
updateOngridOption(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.calculatorService.updateOngridOption(id, body);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Delete('ongrid-options/:id')
deleteOngridOption(@Param('id', ParseIntPipe) id: number) {
  return this.calculatorService.deleteOngridOption(id);
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
    console.log('❌ findOne route hit with id:', id);
    return this.calculatorService.findOne(id);
  }
}