import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { StaffMember } from './staff-member.entity';
import { StaffDocument } from './staff-document.entity';
import { StaffAsset } from './staff-asset.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffMember)
    private readonly staffRepo: Repository<StaffMember>,

    @InjectRepository(StaffDocument)
    private readonly documentRepo: Repository<StaffDocument>,

    @InjectRepository(StaffAsset)
    private readonly assetRepo: Repository<StaffAsset>,
  ) {}

  async findAll(query: any) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const showHidden = query.showHidden === 'true';

    const where: any = {
      isHidden: showHidden,
    };

    if (query.search) {
      where.fullName = ILike(`%${query.search}%`);
    }

    if (query.branchName) where.branchName = query.branchName;
    if (query.department) where.department = query.department;
    if (query.designation) where.designation = query.designation;

    const [data, total] = await this.staffRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(body: any, user: any) {
    if (!String(body.fullName || '').trim()) {
      throw new BadRequestException('Staff full name is required');
    }

    const staff = this.staffRepo.create({
      ...body,
      isActive: body.isActive !== false,
      isHidden: false,
    });

    return this.staffRepo.save(staff);
  }

  async update(id: number, body: any) {
    const staff = await this.staffRepo.findOne({ where: { id } });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    Object.assign(staff, body);

    return this.staffRepo.save(staff);
  }

  async hide(id: number, body: any, user: any) {
    const staff = await this.staffRepo.findOne({ where: { id } });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    staff.isHidden = true;
    staff.isActive = false;
    staff.hiddenAt = new Date();
    staff.hiddenBy = user?.id || null;
    staff.hiddenByName = user?.name || '';
    staff.hiddenReason = body?.reason || '';

    return this.staffRepo.save(staff);
  }

  async restore(id: number, body: any, user: any) {
    const staff = await this.staffRepo.findOne({ where: { id } });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    staff.isHidden = false;
    staff.isActive = true;
    staff.restoredAt = new Date();
    staff.restoredBy = user?.id || null;
    staff.restoredByName = user?.name || '';
    staff.restoreReason = body?.reason || '';

    return this.staffRepo.save(staff);
  }

  async updatePhoto(id: number, body: any) {
    const staff = await this.staffRepo.findOne({ where: { id } });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    staff.photoUrl = body.photoUrl || '';

    return this.staffRepo.save(staff);
  }

  async addDocument(body: any, user: any) {
    if (!body.staffId || !body.fileUrl) {
      throw new BadRequestException('Staff and file URL are required');
    }

    const document = this.documentRepo.create({
      staffId: Number(body.staffId),
      documentType: body.documentType || 'OTHER',
      fileName: body.fileName || '',
      fileUrl: body.fileUrl,
      uploadedBy: user?.id || null,
      uploadedByName: user?.name || '',
      remarks: body.remarks || '',
      isHidden: false,
    });

    return this.documentRepo.save(document);
  }

  async getDocuments(staffId: number) {
    return this.documentRepo.find({
      where: {
        staffId,
        isHidden: false,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async hideDocument(id: number) {
    const document = await this.documentRepo.findOne({ where: { id } });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.isHidden = true;

    return this.documentRepo.save(document);
  }

  async addAsset(body: any) {
    if (!body.staffId || !body.assetName) {
      throw new BadRequestException('Staff and asset name are required');
    }

    const asset = this.assetRepo.create({
      staffId: Number(body.staffId),
      assetType: body.assetType || 'OTHER',
      assetName: body.assetName,
      assetNumber: body.assetNumber || '',
      assignedDate: body.assignedDate || null,
      returnedDate: body.returnedDate || null,
      isActive: body.isActive !== false,
      remarks: body.remarks || '',
      isHidden: false,
    });

    return this.assetRepo.save(asset);
  }

  async getAssets(staffId: number) {
    return this.assetRepo.find({
      where: {
        staffId,
        isHidden: false,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async hideAsset(id: number) {
    const asset = await this.assetRepo.findOne({ where: { id } });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    asset.isHidden = true;
    asset.isActive = false;

    return this.assetRepo.save(asset);
  }
}