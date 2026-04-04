import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CalculatorService } from '../calculator/calculator.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly calculatorService: CalculatorService,
  ) {}

  async create(data: Partial<Project>) {
    const project = this.projectRepository.create(data);
    return this.projectRepository.save(project);
  }

  async findAll() {
    return this.projectRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, data: Partial<Project>) {
    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    Object.assign(project, data);
    return this.projectRepository.save(project);
  }

  async createWithCalculation(data: any) {
    const calculation = this.calculatorService.calculateProjectCost(data);

    const project = this.projectRepository.create({
      leadId: data.leadId,
      projectSize: data?.projectSize || null,
      projectCost: calculation.totalProjectCost,
      subsidy: data?.subsidy || 0,
      netAmount: calculation.totalProjectCost - Number(data?.subsidy || 0),
      status: data?.status || 'NEW',
      vendorId: data?.vendorId || null,
      paymentStatus: data?.paymentStatus || 'PENDING',
      remarks: data?.remarks || 'Project created using calculator',
    });

    const savedProject = await this.projectRepository.save(project);

    return {
      message: 'Project created with calculated cost successfully',
      calculation,
      project: savedProject,
    };
  }
}