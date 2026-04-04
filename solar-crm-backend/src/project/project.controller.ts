import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.projectService.create(body);
  }

  @Post('create-with-calculation')
  createWithCalculation(@Body() body: any) {
    return this.projectService.createWithCalculation(body);
  }

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.projectService.update(Number(id), body);
  }
}