import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import {
  Customer,
  CustomerStatus,
  CustomerSource,
} from './customer.entity';
import { Project } from '../project/project.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    @InjectRepository(Project)
private readonly projectRepository: Repository<Project>,
  ) {}

  private getRoles(user: any): string[] {
    return Array.isArray(user?.roles) ? user.roles : [];
  }

  private canManage(user: any): boolean {
    const roles = this.getRoles(user);

    return (
      roles.includes('OWNER') ||
      roles.includes('MARKETING_HEAD') ||
      roles.includes('PROJECT_MANAGER') ||
      roles.includes('CUSTOMER_MANAGER')
    );
  }

  private normalizeText(value: any): string {
    return String(value || '').trim();
  }

  private async generateCustomerCode(): Promise<string> {
    const latest = await this.customerRepository
      .createQueryBuilder('customer')
      .orderBy('customer.id', 'DESC')
      .getOne();

    const nextNumber = Number(latest?.id || 0) + 1;

    return `CUS-${String(nextNumber).padStart(6, '0')}`;
  }

  async findMatchingCustomer(data: any) {
    const mobile = this.normalizeText(data?.mobile || data?.customerPhone);
    const email = this.normalizeText(data?.email || data?.customerGmail).toLowerCase();
    const electricityKNumber = this.normalizeText(
      data?.electricityKNumber || data?.kNumber,
    );

    if (!mobile && !email && !electricityKNumber) {
      return null;
    }

    const query = this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.isHidden = false');

    query.andWhere(
      new Brackets((qb) => {
        if (electricityKNumber) {
          qb.orWhere('LOWER(customer.electricityKNumber) = :electricityKNumber', {
            electricityKNumber: electricityKNumber.toLowerCase(),
          });
        }

        if (mobile) {
          qb.orWhere('customer.mobile = :mobile', { mobile });
          qb.orWhere('customer.alternateMobile = :mobile', { mobile });
        }

        if (email) {
          qb.orWhere('LOWER(customer.email) = :email', { email });
        }
      }),
    );

    return query.getOne();
  }

  async create(data: Partial<Customer>, user: any) {
    if (!this.canManage(user)) {
      throw new ForbiddenException('You are not allowed to create customers');
    }

    const customerName = this.normalizeText(data.customerName);

    if (!customerName) {
      throw new BadRequestException('Customer name is required');
    }

    const existing = await this.findMatchingCustomer(data);

    if (existing) {
      return {
        message: 'Matching customer already exists',
        customer: existing,
        isExisting: true,
      };
    }

    const customer = this.customerRepository.create({
      customerCode: await this.generateCustomerCode(),
      customerName,
      mobile: this.normalizeText(data.mobile),
      alternateMobile: this.normalizeText(data.alternateMobile),
      email: this.normalizeText(data.email).toLowerCase(),
      aadhaarNumber: this.normalizeText(data.aadhaarNumber),
      panNumber: this.normalizeText(data.panNumber).toUpperCase(),
      electricityKNumber: this.normalizeText(data.electricityKNumber),
      address: this.normalizeText(data.address),
      city: this.normalizeText(data.city),
      zone: this.normalizeText(data.zone),
      branchId: data.branchId ? Number(data.branchId) : undefined,
      branchName: this.normalizeText(data.branchName),
      customerStatus: data.customerStatus || CustomerStatus.ACTIVE,
      isPortalEnabled: data.isPortalEnabled === true,
      remarks: this.normalizeText(data.remarks),
      createdBy: user?.id || user?.userId || null,
      createdByName: user?.name || user?.email || '',
      customerSource:
  data.customerSource || CustomerSource.MANUAL,
    });

    const saved = await this.customerRepository.save(customer);

    return {
      message: 'Customer created successfully',
      customer: saved,
      isExisting: false,
    };
  }

  async findAll(filters: any, user: any) {
    const page = Number(filters?.page) > 0 ? Number(filters.page) : 1;
    const limit =
      Number(filters?.limit) > 0 ? Math.min(Number(filters.limit), 100) : 20;
    const skip = (page - 1) * limit;

    const query = this.customerRepository.createQueryBuilder('customer');

    if (filters?.showHidden === 'true') {
      query.where('customer.isHidden = true');
    } else {
      query.where('customer.isHidden = false');
    }

    if (filters?.search) {
      const search = `%${String(filters.search).toLowerCase()}%`;

      query.andWhere(
        `
        LOWER(customer.customerCode) LIKE :search
        OR LOWER(customer.customerName) LIKE :search
        OR LOWER(customer.mobile) LIKE :search
        OR LOWER(customer.alternateMobile) LIKE :search
        OR LOWER(customer.email) LIKE :search
        OR LOWER(customer.electricityKNumber) LIKE :search
        OR LOWER(customer.city) LIKE :search
        OR LOWER(customer.zone) LIKE :search
        `,
        { search },
      );
    }

    if (filters?.city) {
      query.andWhere('LOWER(customer.city) LIKE :city', {
        city: `%${String(filters.city).toLowerCase()}%`,
      });
    }

    if (filters?.zone) {
      query.andWhere('LOWER(customer.zone) LIKE :zone', {
        zone: `%${String(filters.zone).toLowerCase()}%`,
      });
    }

    if (filters?.branch) {
      query.andWhere('LOWER(customer.branchName) LIKE :branch', {
        branch: `%${String(filters.branch).toLowerCase()}%`,
      });
    }

    if (filters?.customerSource) {
  query.andWhere(
    'customer.customerSource = :customerSource',
    {
      customerSource: filters.customerSource,
    },
  );
}

    if (filters?.status) {
      query.andWhere('customer.customerStatus = :status', {
        status: filters.status,
      });
    }

    query.orderBy('customer.createdAt', 'DESC');
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async search(queryText: string) {
    const search = String(queryText || '').trim().toLowerCase();

    if (!search || search.length < 2) {
      return [];
    }

    return this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.isHidden = false')
      .andWhere(
        `
        LOWER(customer.customerCode) LIKE :search
        OR LOWER(customer.customerName) LIKE :search
        OR LOWER(customer.mobile) LIKE :search
        OR LOWER(customer.email) LIKE :search
        OR LOWER(customer.electricityKNumber) LIKE :search
        `,
        { search: `%${search}%` },
      )
      .orderBy('customer.customerName', 'ASC')
      .take(20)
      .getMany();
  }

  async findOne(id: number) {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: number, data: Partial<Customer>, user: any) {
    if (!this.canManage(user)) {
      throw new ForbiddenException('You are not allowed to update customers');
    }

    const customer = await this.findOne(id);

    customer.customerName =
      this.normalizeText(data.customerName) || customer.customerName;

    customer.mobile = this.normalizeText(data.mobile);
    customer.alternateMobile = this.normalizeText(data.alternateMobile);
    customer.email = this.normalizeText(data.email).toLowerCase();
    customer.aadhaarNumber = this.normalizeText(data.aadhaarNumber);
    customer.panNumber = this.normalizeText(data.panNumber).toUpperCase();
    customer.electricityKNumber = this.normalizeText(data.electricityKNumber);
    customer.address = this.normalizeText(data.address);
    customer.city = this.normalizeText(data.city);
    customer.zone = this.normalizeText(data.zone);
    customer.branchId = data.branchId ? Number(data.branchId) : undefined;
    customer.branchName = this.normalizeText(data.branchName);
    customer.customerStatus = data.customerStatus || customer.customerStatus;
    customer.customerSource =
  data.customerSource || customer.customerSource;
    customer.isPortalEnabled = data.isPortalEnabled === true;
    customer.remarks = this.normalizeText(data.remarks);

    return this.customerRepository.save(customer);
  }

  async hide(id: number, body: any, user: any) {
    if (!this.canManage(user)) {
      throw new ForbiddenException('You are not allowed to hide customers');
    }

    const customer = await this.findOne(id);

    customer.isHidden = true;
    customer.hiddenReason = this.normalizeText(body?.reason);
    customer.hiddenAt = new Date();
    customer.hiddenBy = user?.id || user?.userId || null;
    customer.hiddenByName = user?.name || user?.email || '';

    return this.customerRepository.save(customer);
  }

  async restore(id: number, body: any, user: any) {
    if (!this.canManage(user)) {
      throw new ForbiddenException('You are not allowed to restore customers');
    }

    const customer = await this.findOne(id);

    customer.isHidden = false;
    customer.restoreReason = this.normalizeText(body?.reason);
    customer.restoredAt = new Date();
    customer.restoredBy = user?.id || user?.userId || null;
    customer.restoredByName = user?.name || user?.email || '';

    return this.customerRepository.save(customer);
  }

  async findOrCreateFromProjectData(data: any, user: any) {
    const existing = await this.findMatchingCustomer(data);

    if (existing) {
      return existing;
    }

    const result = await this.create(
      {
        customerName: data.customerName,
        mobile: data.customerPhone || data.mobile,
        email: data.customerGmail || data.email,
        electricityKNumber: data.electricityKNumber,
        address: data.address || data.gpsAddress,
        city: data.city,
        zone: data.zone,
        branchName: data.branchName,
        remarks: 'Auto-created from project data',
      },
      user,
    );

    return result.customer;
  }

  async getSummary() {
  const totalCustomers =
    await this.customerRepository.count({
      where: {
        isHidden: false,
      },
    });

  const activeCustomers =
    await this.customerRepository.count({
      where: {
        isHidden: false,
        customerStatus: CustomerStatus.ACTIVE,
      },
    });

  const inactiveCustomers =
    await this.customerRepository.count({
      where: {
        isHidden: false,
        customerStatus: CustomerStatus.INACTIVE,
      },
    });

  const blacklistedCustomers =
    await this.customerRepository.count({
      where: {
        isHidden: false,
        customerStatus: CustomerStatus.BLACKLISTED,
      },
    });

  const portalEnabledCustomers =
    await this.customerRepository.count({
      where: {
        isHidden: false,
        isPortalEnabled: true,
      },
    });

  return {
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
    blacklistedCustomers,
    portalEnabledCustomers,
  };
}

async getCustomerProjects(customerId: number) {
  const customer = await this.findOne(customerId);

  const projects = await this.projectRepository.find({
    where: {
      customerId: customer.id,
      isHidden: false,
    },
    order: {
      createdAt: 'DESC',
    },
  });

  return {
    customer,
    projects,
  };
}

async linkExistingProjects() {
  const customers = await this.customerRepository.find({
    where: {
      isHidden: false,
    },
  });

  const projects = await this.projectRepository.find({
    where: {
      isHidden: false,
    },
  });

  let linkedCount = 0;

  for (const project of projects) {
    if ((project as any).customerId) {
      continue;
    }

    const projectKNumber = this.normalizeText(
      (project as any).electricityKNumber,
    ).toLowerCase();

    const projectPhone = this.normalizeText(
      (project as any).customerPhone,
    );

    const projectEmail = this.normalizeText(
      (project as any).customerGmail,
    ).toLowerCase();

    const matchedCustomer = customers.find((customer) => {
      const customerKNumber = this.normalizeText(
        customer.electricityKNumber,
      ).toLowerCase();

      const customerMobile = this.normalizeText(
        customer.mobile,
      );

      const customerAltMobile = this.normalizeText(
        customer.alternateMobile,
      );

      const customerEmail = this.normalizeText(
        customer.email,
      ).toLowerCase();

      if (projectKNumber && customerKNumber && projectKNumber === customerKNumber) {
        return true;
      }

      if (
        projectPhone &&
        (projectPhone === customerMobile || projectPhone === customerAltMobile)
      ) {
        return true;
      }

      if (projectEmail && customerEmail && projectEmail === customerEmail) {
        return true;
      }

      return false;
    });

    if (matchedCustomer) {
      (project as any).customerId = matchedCustomer.id;
      (project as any).customerCode = matchedCustomer.customerCode;

      await this.projectRepository.save(project);
      linkedCount += 1;
    }
  }

  return {
    message: 'Existing projects linked successfully',
    totalCustomersChecked: customers.length,
    totalProjectsChecked: projects.length,
    linkedCount,
  };
}

async enablePortal(id: number, body: any, user: any) {
  if (!this.canManage(user)) {
    throw new ForbiddenException('You are not allowed to enable customer portal');
  }

  const customer = await this.findOne(id);

  const username =
    this.normalizeText(body?.portalUsername) ||
    this.normalizeText(customer.mobile) ||
    this.normalizeText(customer.electricityKNumber) ||
    customer.customerCode;

  if (!username) {
    throw new BadRequestException(
      'Portal username could not be generated. Please enter mobile or K number.',
    );
  }

  customer.isPortalEnabled = true;
  (customer as any).portalUsername = username;

  return this.customerRepository.save(customer);
}

async disablePortal(id: number, user: any) {
  if (!this.canManage(user)) {
    throw new ForbiddenException('You are not allowed to disable customer portal');
  }

  const customer = await this.findOne(id);

  customer.isPortalEnabled = false;

  return this.customerRepository.save(customer);
}

async resetPortalUsername(id: number, body: any, user: any) {
  if (!this.canManage(user)) {
    throw new ForbiddenException('You are not allowed to reset portal username');
  }

  const customer = await this.findOne(id);

  const username = this.normalizeText(body?.portalUsername);

  if (!username) {
    throw new BadRequestException('Portal username is required');
  }

  (customer as any).portalUsername = username;

  return this.customerRepository.save(customer);
}
}