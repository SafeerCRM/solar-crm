import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { MastersService } from './masters.service';

@Controller('masters')
export class MastersController {
  constructor(private readonly mastersService: MastersService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.mastersService.create(body);
  }

  @Get()
  findAll() {
    return this.mastersService.findAll();
  }

  @Get(':type')
  findByType(@Param('type') type: string) {
    return this.mastersService.findByType(type);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.mastersService.update(Number(id), body);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.mastersService.deactivate(Number(id));
  }
}