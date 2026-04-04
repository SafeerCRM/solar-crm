import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterData } from './master-data.entity';

@Injectable()
export class MastersService {
  constructor(
    @InjectRepository(MasterData)
    private readonly masterRepository: Repository<MasterData>,
  ) {}

  async create(data: Partial<MasterData>) {
    const item = this.masterRepository.create(data);
    return this.masterRepository.save(item);
  }

  async findAll() {
    return this.masterRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByType(type: string) {
    return this.masterRepository.find({
      where: { type: type as any, isActive: true },
      order: { value: 'ASC' },
    });
  }

  async update(id: number, data: Partial<MasterData>) {
    const item = await this.masterRepository.findOne({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Master data not found');
    }

    Object.assign(item, data);
    return this.masterRepository.save(item);
  }

  async deactivate(id: number) {
    const item = await this.masterRepository.findOne({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Master data not found');
    }

    item.isActive = false;
    return this.masterRepository.save(item);
  }
}