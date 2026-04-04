import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './vendor.entity';
import { Project } from '../project/project.entity';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(data: Partial<Vendor>) {
    const vendor = this.vendorRepository.create(data);
    return this.vendorRepository.save(vendor);
  }

  async findAll() {
    return this.vendorRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, data: Partial<Vendor>) {
    const vendor = await this.vendorRepository.findOne({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    Object.assign(vendor, data);
    return this.vendorRepository.save(vendor);
  }

  async assignToProject(vendorId: number, projectId: number) {
    const vendor = await this.vendorRepository.findOne({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    project.vendorId = vendorId;
    const updatedProject = await this.projectRepository.save(project);

    return {
      message: 'Vendor assigned to project successfully',
      vendor,
      project: updatedProject,
    };
  }
}