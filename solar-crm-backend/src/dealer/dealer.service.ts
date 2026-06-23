import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';

import { Dealer } from './dealer.entity';
import { ProjectDealerOrder } from '../project/project-dealer-order.entity';
import { ProjectDealerPayment } from '../project/project-dealer-payment.entity';
import { ProjectDealerNotification } from '../project/project-dealer-notification.entity';
import { ProjectDealerMonthlyRequirement } from '../project/project-dealer-monthly-requirement.entity';
import { ProjectMaterialMaster } from '../project/project-material-master.entity';
import { ProjectStockItem } from '../project/project-stock-item.entity';
import { DealerCompanyBankDetail } from './dealer-company-bank-detail.entity';
import { User } from '../users/user.entity';
import {
  ProjectDealerOrderStatus,
  ProjectDealerPaymentType,
  ProjectDealerDeliveryMode,
} from '../project/project-dealer-order.entity';
import { ProjectDealerOrderItem } from '../project/project-dealer-order-item.entity';
import { BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { DealerComplaint } from './dealer-complaint.entity';
import { ProjectDealerComment } from '../project/project-dealer-comment.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ProjectProformaInvoice,
  ProjectProformaInvoiceStatus,
} from '../project/project-proforma-invoice.entity';
import { ProjectProformaInvoiceItem } from '../project/project-proforma-invoice-item.entity';
import {
  ProjectFinalInvoice,
  ProjectFinalInvoiceStatus,
} from '../project/project-final-invoice.entity';
import { ProjectFinalInvoiceItem } from '../project/project-final-invoice-item.entity';
import { ProjectService } from '../project/project.service';
import { StaffMember } from '../staff/staff-member.entity';
import { DealerPortalCompanySetting } from './dealer-portal-company-setting.entity';
import { DealerDeliverySetting } from './dealer-delivery-setting.entity';
import { DealerKit } from './dealer-kit.entity';
import { DealerKitItem } from './dealer-kit-item.entity';

@Injectable()
export class DealerService {
  constructor(
    @InjectRepository(Dealer)
    private readonly dealerRepository: Repository<Dealer>,

        @InjectRepository(DealerCompanyBankDetail)
    private readonly bankDetailRepository: Repository<DealerCompanyBankDetail>,

        @InjectRepository(DealerComplaint)
    private readonly dealerComplaintRepository: Repository<DealerComplaint>,

        @InjectRepository(User)
    private readonly userRepository: Repository<User>,

        @InjectRepository(ProjectMaterialMaster)
    private readonly materialRepository: Repository<ProjectMaterialMaster>,

    @InjectRepository(ProjectStockItem)
    private readonly stockRepository: Repository<ProjectStockItem>,

    @InjectRepository(ProjectDealerOrder)
    private readonly dealerOrderRepository: Repository<ProjectDealerOrder>,

        @InjectRepository(ProjectDealerOrderItem)
    private readonly dealerOrderItemRepository: Repository<ProjectDealerOrderItem>,

    @InjectRepository(ProjectDealerPayment)
    private readonly dealerPaymentRepository: Repository<ProjectDealerPayment>,

        @InjectRepository(ProjectDealerComment)
    private readonly dealerCommentRepository: Repository<ProjectDealerComment>,

    @InjectRepository(ProjectDealerNotification)
    private readonly dealerNotificationRepository: Repository<ProjectDealerNotification>,

    @InjectRepository(ProjectDealerMonthlyRequirement)
    private readonly dealerMonthlyRequirementRepository: Repository<ProjectDealerMonthlyRequirement>,

        @InjectRepository(ProjectProformaInvoice)
    private readonly proformaInvoiceRepository: Repository<ProjectProformaInvoice>,

    @InjectRepository(ProjectProformaInvoiceItem)
    private readonly proformaInvoiceItemRepository: Repository<ProjectProformaInvoiceItem>,

        @InjectRepository(ProjectFinalInvoice)
    private readonly finalInvoiceRepository: Repository<ProjectFinalInvoice>,

    @InjectRepository(ProjectFinalInvoiceItem)
    private readonly finalInvoiceItemRepository: Repository<ProjectFinalInvoiceItem>,

    @InjectRepository(StaffMember)
private readonly staffMemberRepository: Repository<StaffMember>,

@InjectRepository(DealerPortalCompanySetting)
private readonly portalCompanySettingRepository: Repository<DealerPortalCompanySetting>,

@InjectRepository(DealerKit)
private readonly dealerKitRepository: Repository<DealerKit>,

@InjectRepository(DealerKitItem)
private readonly dealerKitItemRepository: Repository<DealerKitItem>,

@InjectRepository(DealerDeliverySetting)
private readonly deliverySettingRepository: Repository<DealerDeliverySetting>,

    private readonly projectService: ProjectService,
  ) {}

  healthCheck() {
    return {
      success: true,
      message: 'Dealer module is active',
    };
  }

  async dealerLogin(username: string, password: string) {
    const loginUsername = String(username || '').trim();
    const loginPassword = String(password || '').trim();

    if (!loginUsername || !loginPassword) {
      throw new UnauthorizedException('Username and password are required');
    }

    const dealer = await this.dealerRepository.findOne({
      where: [
        { email: loginUsername, isHidden: false },
        { phone: loginUsername, isHidden: false },
        { gstNumber: loginUsername, isHidden: false },
      ] as any,
    });

    if (!dealer) {
      throw new UnauthorizedException('Dealer portal access not found');
    }

    const expectedPassword =
      (dealer as any).portalPassword ||
      dealer.phone ||
      dealer.gstNumber ||
      String(dealer.id);

    if (loginPassword !== expectedPassword) {
      throw new UnauthorizedException('Invalid dealer password');
    }

    const access_token = jwt.sign(
      {
        sub: dealer.id,
        dealerId: dealer.id,
        dealerName: dealer.dealerName,
        roleType: 'DEALER_PORTAL',
        roles: ['DEALER'],
      },
      'mysecretkey',
      { expiresIn: '7d' },
    );

    return {
      access_token,
      dealer: {
        id: dealer.id,
        dealerName: dealer.dealerName,
        firmName: dealer.firmName,
        phone: dealer.phone,
        email: dealer.email,
        gstNumber: dealer.gstNumber,
        branchName: dealer.branchName,
        city: dealer.city,
        creditEnabled: dealer.creditEnabled,
        creditLimit: dealer.creditLimit,
        creditDays: dealer.creditDays,
      },
    };
  }

  async updateDealerPortalPassword(id: number, body: any) {
  const newPassword = String(body?.portalPassword || '').trim();

  if (!newPassword) {
    throw new BadRequestException('Password is required');
  }

  if (newPassword.length < 4) {
    throw new BadRequestException('Password must be at least 4 characters');
  }

  let dealer = await this.dealerRepository.findOne({
  where: { id, isHidden: false },
});

if (!dealer && body?.phone) {
  dealer = await this.dealerRepository.findOne({
    where: { phone: String(body.phone).trim(), isHidden: false },
  });
}

if (!dealer && body?.gstNumber) {
  dealer = await this.dealerRepository.findOne({
    where: { gstNumber: String(body.gstNumber).trim(), isHidden: false },
  });
}

if (!dealer && body?.email) {
  dealer = await this.dealerRepository.findOne({
    where: { email: String(body.email).trim(), isHidden: false },
  });
}

  if (!dealer) {
    throw new NotFoundException('Dealer not found');
  }

  (dealer as any).portalPassword = newPassword;

  return this.dealerRepository.save(dealer);
}

async getDealerDeliverySetting() {
  let setting = await this.deliverySettingRepository.findOne({
    where: { isActive: true },
    order: { id: 'ASC' } as any,
  });

  if (!setting) {
    setting = this.deliverySettingRepository.create({
      officeName: 'Main Office',
      officeAddress: '',
      baseKm: 0,
      baseCharge: 0,
      perKmCharge: 0,
      minimumCharge: 0,
      isActive: true,
    });

    setting = await this.deliverySettingRepository.save(setting);
  }

  return setting;
}

async saveDealerDeliverySetting(body: any) {
  let setting = await this.deliverySettingRepository.findOne({
    where: { isActive: true },
    order: { id: 'ASC' } as any,
  });

  if (!setting) {
    setting = this.deliverySettingRepository.create({
      isActive: true,
    });
  }

  setting.officeName = body.officeName || '';
  setting.officeAddress = body.officeAddress || '';
  setting.baseKm = Number(body.baseKm || 0);
  setting.baseCharge = Number(body.baseCharge || 0);
  setting.perKmCharge = Number(body.perKmCharge || 0);
  setting.minimumCharge = Number(body.minimumCharge || 0);
  setting.isActive = true;

  return this.deliverySettingRepository.save(setting);
}

calculateDealerDeliveryCharge(distanceKm: number, setting: any) {
  const distance = Math.max(Number(distanceKm || 0), 0);
  const baseKm = Math.max(Number(setting?.baseKm || 0), 0);
  const baseCharge = Math.max(Number(setting?.baseCharge || 0), 0);
  const perKmCharge = Math.max(Number(setting?.perKmCharge || 0), 0);
  const minimumCharge = Math.max(Number(setting?.minimumCharge || 0), 0);

  const extraKm = Math.max(distance - baseKm, 0);
  const calculatedCharge = baseCharge + extraKm * perKmCharge;

  return Math.max(calculatedCharge, minimumCharge);
}

async listDealerKits(query: any) {
  const showHidden = query?.showHidden === 'true';

  const where: any = {};

  if (!showHidden) {
    where.isHidden = false;
  }

  const kits = await this.dealerKitRepository.find({
    where,
    order: {
      createdAt: 'DESC',
    } as any,
  });

  const result: any[] = [];

  for (const kit of kits) {
    const items = await this.dealerKitItemRepository.find({
      where: { kitId: kit.id },
      order: { sortOrder: 'ASC', id: 'ASC' } as any,
    });

    result.push({
      ...kit,
      items,
    });
  }

  return result;
}

async listDealerKitsForPortal() {
  const kits = await this.dealerKitRepository.find({
    where: {
      isHidden: false,
      isAvailable: true,
    } as any,
    order: {
      createdAt: 'DESC',
    } as any,
  });

  const result: any[] = [];

  for (const kit of kits) {
    const items = await this.dealerKitItemRepository.find({
      where: { kitId: kit.id },
      order: { sortOrder: 'ASC', id: 'ASC' } as any,
    });

    result.push({
      ...kit,
      items,
    });
  }

  return result;
}

async saveDealerKit(body: any, user: any) {
  if (!String(body?.kitName || '').trim()) {
    throw new BadRequestException('Kit name is required');
  }

  let kit: any = null;

  if (body?.id) {
    kit = await this.dealerKitRepository.findOne({
      where: { id: Number(body.id) },
    });
  }

  if (!kit) {
    kit = this.dealerKitRepository.create({
      createdBy: user?.id || user?.userId || null,
      createdByName: user?.name || user?.email || '',
    });
  }

  kit.kitName = String(body.kitName || '').trim();
  kit.shortDescription = body.shortDescription || '';
  kit.displayBrand = body.displayBrand || '';
  kit.displayCapacity = body.displayCapacity || '';
  kit.sellingPrice = Number(body.sellingPrice || 0);
  kit.gstPercent = Number(body.gstPercent || 0);
  kit.gstMode =
  body.gstMode === 'INCLUDING' ? 'INCLUDING' : 'EXCLUDING';
  kit.isAvailable = body.isAvailable !== false;

  const savedKit = await this.dealerKitRepository.save(kit);

  await this.dealerKitItemRepository.delete({
    kitId: savedKit.id,
  });

  const items = Array.isArray(body.items) ? body.items : [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    if (
      !String(item?.material || '').trim() &&
      !String(item?.brandSizeType || '').trim() &&
      !String(item?.quantity || '').trim()
    ) {
      continue;
    }

    await this.dealerKitItemRepository.save(
      this.dealerKitItemRepository.create({
        kitId: savedKit.id,
        material: item.material || '',
        brandSizeType: item.brandSizeType || '',
        quantity: item.quantity || '',
        sortOrder: index,
      }),
    );
  }

  return this.getDealerKitById(savedKit.id);
}

async getDealerKitById(id: number) {
  const kit = await this.dealerKitRepository.findOne({
    where: { id },
  });

  if (!kit) {
    throw new NotFoundException('Dealer kit not found');
  }

  const items = await this.dealerKitItemRepository.find({
    where: { kitId: kit.id },
    order: { sortOrder: 'ASC', id: 'ASC' } as any,
  });

  return {
    ...kit,
    items,
  };
}

async hideDealerKit(id: number, body: any, user: any) {
  const kit = await this.dealerKitRepository.findOne({
    where: { id },
  });

  if (!kit) {
    throw new NotFoundException('Dealer kit not found');
  }

  kit.isHidden = true;
  kit.hiddenReason = body?.reason || '';
  kit.hiddenAt = new Date();
  kit.hiddenBy = user?.id || user?.userId || null;
  kit.hiddenByName = user?.name || user?.email || '';

  return this.dealerKitRepository.save(kit);
}

async restoreDealerKit(id: number) {
  const kit = await this.dealerKitRepository.findOne({
    where: { id },
  });

  if (!kit) {
    throw new NotFoundException('Dealer kit not found');
  }

  kit.isHidden = false;
  kit.hiddenReason = '';
  (kit as any).hiddenAt = null;
(kit as any).hiddenBy = null;
  kit.hiddenByName = '';

  return this.dealerKitRepository.save(kit);
}

async toggleDealerKitAvailability(id: number, body: any) {
  const kit = await this.dealerKitRepository.findOne({
    where: { id },
  });

  if (!kit) {
    throw new NotFoundException('Dealer kit not found');
  }

  kit.isAvailable = body?.isAvailable === true;

  return this.dealerKitRepository.save(kit);
}

  async getDealerDashboard(dealerId: number) {
    const dealer = await this.dealerRepository.findOne({
      where: { id: dealerId, isHidden: false },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    const recentOrders = await this.dealerOrderRepository.find({
      where: { dealerId, isHidden: false },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const recentPayments = await this.dealerPaymentRepository.find({
      where: { dealerId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const notifications = await this.dealerNotificationRepository.find({
      where: { dealerId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const monthlyRequirements =
      await this.dealerMonthlyRequirementRepository.find({
        where: { dealerId, isHidden: false },
        order: { createdAt: 'DESC' },
        take: 10,
      });

    const totalOrders = recentOrders.length;
    const totalOrderValue = recentOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    );
    const pendingAmount = recentOrders.reduce(
      (sum, order) => sum + Number(order.pendingAmount || 0),
      0,
    );

    return {
      dealer,
      recentOrders,
      recentPayments,
      notifications,
      monthlyRequirements,
      totalOrders,
      totalOrderValue,
      pendingAmount,
      unreadNotifications: notifications.filter(
        (item) => item.status === 'UNREAD',
      ).length,
    };
  }

    async getDealerStock() {
    const stockItems = await this.stockRepository.find({
      where: { isHidden: false },
      order: {
        materialName: 'ASC',
        branchName: 'ASC',
      },
    });

    const materialIds = stockItems.map((item) => item.materialId);

    const materials = materialIds.length
      ? await this.materialRepository
          .createQueryBuilder('material')
          .where('material.id IN (:...materialIds)', { materialIds })
          .andWhere('material.isActive = true')
          .getMany()
      : [];

    const materialMap = new Map(
      materials.map((material) => [material.id, material]),
    );

    return stockItems
      .map((stock) => {
        const material = materialMap.get(stock.materialId);

        if (!material) return null;

        const sellingRateWithoutGst = Number(
          material.sellingRate || material.rate || 0,
        );
        const gstPercent = Number(material.gstPercent || 0);
        const sellingRateWithGst =
          sellingRateWithoutGst +
          (sellingRateWithoutGst * gstPercent) / 100;

        return {
          materialId: material.id,
          materialName: material.name,
          category: material.category,
          brand: material.brand,
          unit: material.unit,
          hsnCode: material.hsnCode,
          branchId: stock.branchId,
          branchName: stock.branchName,
          availableQuantity: Math.max(
            Number(stock.currentQuantity || 0) -
              Number(stock.reservedQuantity || 0),
            0,
          ),
          sellingRateWithoutGst,
          gstPercent,
          sellingRateWithGst,
        };
      })
      .filter(Boolean);
  }

    async generateDealerProformaInvoice(orderId: number, user: any) {
    const order = await this.dealerOrderRepository.findOne({
      where: { id: orderId, isHidden: false },
    });

    if (!order) {
      throw new NotFoundException('Dealer order not found');
    }

    const orderItems = await this.dealerOrderItemRepository.find({
      where: { dealerOrderId: order.id },
      order: { createdAt: 'ASC' },
    });

    if (!orderItems.length) {
      throw new BadRequestException('Dealer order has no items');
    }

    const invoice = new ProjectProformaInvoice();

    invoice.projectId = 0;
    invoice.invoiceType = 'DEALER';
    invoice.dealerId = order.dealerId;
    invoice.dealerName = order.dealerName;
    invoice.dealerPhone = order.dealerPhone;
    invoice.dealerGstNumber = order.dealerGstNumber;
    invoice.dealerAddress = order.dealerAddress;
    invoice.invoiceNumber = `DPI-${order.id}`;
    invoice.status = ProjectProformaInvoiceStatus.SENT;
    invoice.subtotalAmount = Number(order.subtotalAmount || 0);
    invoice.discountAmount = Number(order.discountAmount || 0);
    invoice.gstAmount = Number(order.gstAmount || 0);
    invoice.totalAmount = Number(order.totalAmount || 0);
    invoice.invoiceDate = new Date();
    invoice.validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    invoice.remarks = order.remarks || '';
    invoice.createdBy = user?.id || null;
    invoice.createdByName = user?.name || user?.email || 'Dealer Portal';
    invoice.createdByRole = Array.isArray(user?.roles)
      ? user.roles.join(', ')
      : 'DEALER';

    const savedInvoice = await this.proformaInvoiceRepository.save(invoice);

    for (const item of orderItems) {
      const invoiceItem = this.proformaInvoiceItemRepository.create({
        proformaInvoiceId: savedInvoice.id,
        materialId: item.materialId || 0,
        itemName: item.materialName,
        category: item.category,
        brand: item.brand,
        unit: item.unit,
        hsnCode: item.hsnCode,
        quantity: Number(item.quantity || 0),
        sellingRate: Number(item.sellingRate || 0),
        gstPercent: Number(item.gstPercent || 0),
        discountAmount: Number(item.discountAmount || 0),
        subtotalAmount: Number(item.subtotalAmount || 0),
        gstAmount: Number(item.gstAmount || 0),
        totalAmount: Number(item.totalAmount || 0),
        remarks: item.remarks || '',
      } as any);

      await this.proformaInvoiceItemRepository.save(invoiceItem);
    }

    order.status = ProjectDealerOrderStatus.SUBMITTED;
    await this.dealerOrderRepository.save(order);

    const notification = this.dealerNotificationRepository.create({
      dealerId: order.dealerId,
      dealerName: order.dealerName,
      title: 'Proforma Invoice Generated',
      message: `Proforma Invoice ${savedInvoice.invoiceNumber} generated for order ${order.orderNumber}.`,
      notificationType: 'DEALER_PI_GENERATED',
      createdBy: user?.id || null,
      createdByName: user?.name || user?.email || '',
    });

    await this.dealerNotificationRepository.save(notification);

    return {
      invoice: savedInvoice,
      message: 'Dealer Proforma Invoice generated successfully',
    };
  }

    async getBankDetails() {
  const bankDetails = await this.bankDetailRepository.find({
    where: { isActive: true },
    order: { createdAt: 'DESC' },
  });

  const setting = await this.getPortalCompanySetting();

  return {
    companyName: setting.companyName || '',
    email: setting.email || '',
    phone1: setting.phone1 || '',
    phone2: setting.phone2 || '',
    gstin: setting.gstin || '',
    website: setting.website || '',
    logoUrl: setting.logoUrl || '',
    bankDetails,
  };
}

  async getPortalCompanySetting() {
  let setting = await this.portalCompanySettingRepository.findOne({
    where: {},
    order: { id: 'ASC' } as any,
  });

  if (!setting) {
    setting = this.portalCompanySettingRepository.create({
      companyName: '',
      email: '',
      phone1: '',
      phone2: '',
      gstin: '',
      website: '',
      logoUrl: '',
    });

    setting = await this.portalCompanySettingRepository.save(setting);
  }

  return setting;
}

async savePortalCompanySetting(body: any) {
  let setting = await this.portalCompanySettingRepository.findOne({
    where: {},
    order: { id: 'ASC' } as any,
  });

  if (!setting) {
    setting = this.portalCompanySettingRepository.create();
  }

  setting.companyName = body.companyName || '';
  setting.email = body.email || '';
  setting.phone1 = body.phone1 || '';
  setting.phone2 = body.phone2 || '';
  setting.gstin = body.gstin || '';
  setting.website = body.website || '';
  setting.logoUrl = body.logoUrl || '';

  return this.portalCompanySettingRepository.save(setting);
}

    async getDealerStaffContacts() {
  return this.staffMemberRepository.find({
    where: {
      visibleToDealer: true,
      isActive: true,
      isHidden: false,
    } as any,
    order: {
      department: 'ASC',
      fullName: 'ASC',
    } as any,
  });
}

    async createDealerOrder(dealerId: number, body: any) {
    const dealer = await this.dealerRepository.findOne({
      where: { id: dealerId, isHidden: false },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      throw new NotFoundException('At least one kit or material is required');
    }

    const paymentType = body.paymentType || ProjectDealerPaymentType.CASH;

    if (!body.expectedDeliveryAt) {
  throw new BadRequestException(
    'Expected delivery date is required',
  );
}

if (!String(body.remarks || '').trim()) {
  throw new BadRequestException(
    'Order remarks are required',
  );
}

if (
  body.deliveryMode === 'DELIVERY' &&
  !String(body.deliveryAddress || '').trim()
) {
  throw new BadRequestException(
    'Delivery address is required',
  );
}

    const deliveryMode =
  body.deliveryMode === ProjectDealerDeliveryMode.DELIVERY
    ? ProjectDealerDeliveryMode.DELIVERY
    : ProjectDealerDeliveryMode.SELF_COLLECTION;

const deliveryAddress =
  deliveryMode === ProjectDealerDeliveryMode.DELIVERY
    ? String(body.deliveryAddress || '').trim()
    : '';

let deliveryLatitude =
  deliveryMode === ProjectDealerDeliveryMode.DELIVERY
    ? Number(body.deliveryLatitude || 0)
    : 0;

let deliveryLongitude =
  deliveryMode === ProjectDealerDeliveryMode.DELIVERY
    ? Number(body.deliveryLongitude || 0)
    : 0;

const deliveryGpsUrl =
  deliveryMode === ProjectDealerDeliveryMode.DELIVERY
    ? String(body.deliveryGpsUrl || '').trim()
    : '';

const deliveryLocationSource =
  deliveryMode === ProjectDealerDeliveryMode.DELIVERY
    ? String(body.deliveryLocationSource || '').trim()
    : '';

if (
  deliveryMode === ProjectDealerDeliveryMode.DELIVERY &&
  (!deliveryLatitude || !deliveryLongitude) &&
  deliveryGpsUrl
) {
  const extracted = this.extractCoordinatesFromGpsUrl(deliveryGpsUrl);

  deliveryLatitude = extracted.latitude;
  deliveryLongitude = extracted.longitude;
}

let deliveryDistanceKm = 0;
let autoDeliveryDistanceKm = 0;
let autoDeliveryCharge = 0;
let deliveryCharge = 0;

if (
  deliveryMode === ProjectDealerDeliveryMode.DELIVERY &&
  deliveryLatitude &&
  deliveryLongitude
) {
  const deliverySetting = await this.deliverySettingRepository.findOne({
    where: {},
    order: { id: 'DESC' } as any,
  });

  if (
    deliverySetting &&
    (deliverySetting as any).autoDeliveryChargeEnabled !== false &&
    Number((deliverySetting as any).warehouseLatitude || 0) &&
    Number((deliverySetting as any).warehouseLongitude || 0)
  ) {
    autoDeliveryDistanceKm = this.calculateDistanceKm(
      Number((deliverySetting as any).warehouseLatitude || 0),
      Number((deliverySetting as any).warehouseLongitude || 0),
      deliveryLatitude,
      deliveryLongitude,
    );

    autoDeliveryCharge = this.calculateDeliveryChargeFromSetting(
      autoDeliveryDistanceKm,
      deliverySetting,
    );

    deliveryDistanceKm = autoDeliveryDistanceKm;
    deliveryCharge = autoDeliveryCharge;
  }
}

    if (
      paymentType === ProjectDealerPaymentType.CREDIT &&
      !dealer.creditEnabled
    ) {
      throw new UnauthorizedException(
        'Credit facility is not enabled for this dealer',
      );
    }

    const order = new ProjectDealerOrder();

order.dealerId = dealer.id;
order.dealerName = dealer.dealerName;
order.dealerPhone = dealer.phone;
order.dealerGstNumber = dealer.gstNumber;
order.dealerAddress = dealer.address;
order.branchName = dealer.branchName;
order.status = ProjectDealerOrderStatus.SUBMITTED;
order.paymentType = paymentType;
order.deliveryMode = deliveryMode;
order.deliveryAddress = deliveryAddress;
order.deliveryDistanceKm = deliveryDistanceKm;
order.deliveryCharge = deliveryCharge;
order.deliveryLatitude = deliveryLatitude;
order.deliveryLongitude = deliveryLongitude;
order.deliveryGpsUrl = deliveryGpsUrl;
order.deliveryLocationSource = deliveryLocationSource;
order.autoDeliveryDistanceKm = autoDeliveryDistanceKm;
order.autoDeliveryCharge = autoDeliveryCharge;
if (paymentType === ProjectDealerPaymentType.CREDIT && body.creditDueDate) {
  order.creditDueDate = new Date(body.creditDueDate);
}

if (body.expectedDeliveryAt) {
  order.expectedDeliveryAt = new Date(body.expectedDeliveryAt);
}
order.assignedStaffName = body.pickupStaffName || '';
order.assignedStaffPhone = body.pickupStaffPhone || '';
order.remarks = body.remarks || '';
order.createdBy = dealer.id;
order.createdByName = dealer.dealerName;

    const savedOrder = await this.dealerOrderRepository.save(order);

    savedOrder.orderNumber = `DO-${savedOrder.id}`;
    await this.dealerOrderRepository.save(savedOrder);

    let subtotalAmount = 0;
    let gstAmount = 0;
    let totalAmount = 0;
    let discountAmount = 0;

    for (const item of items) {
  const itemType = String(item.itemType || 'MATERIAL').toUpperCase();
  const quantity = Number(item.quantity || 0);

  if (quantity <= 0) {
    continue;
  }

  if (itemType === 'KIT') {
    const kitId = Number(item.kitId || 0);

    if (!kitId) {
      continue;
    }

    const kit = await this.dealerKitRepository.findOne({
      where: {
        id: kitId,
        isHidden: false,
        isAvailable: true,
      } as any,
    });

    if (!kit) {
      continue;
    }

    const kitItems = await this.dealerKitItemRepository.find({
      where: { kitId: kit.id },
      order: { sortOrder: 'ASC', id: 'ASC' } as any,
    });

    const kitPrice = Number(kit.sellingPrice || 0);
const gstPercent = Number(kit.gstPercent || 0);
const gstMode = String((kit as any).gstMode || 'EXCLUDING');
const itemDiscount = Number(item.discountAmount || 0);

let sellingRate = kitPrice;
let itemSubtotal = quantity * kitPrice;
let itemGst = 0;
let itemTotal = 0;

if (gstMode === 'INCLUDING' && gstPercent > 0) {
  const totalIncludingGst = Math.max(itemSubtotal - itemDiscount, 0);
  const taxable = totalIncludingGst / (1 + gstPercent / 100);

  itemGst = totalIncludingGst - taxable;
  itemSubtotal = taxable + itemDiscount;
  sellingRate = kitPrice / (1 + gstPercent / 100);
  itemTotal = totalIncludingGst;
} else {
  const taxable = Math.max(itemSubtotal - itemDiscount, 0);
  itemGst = (taxable * gstPercent) / 100;
  itemTotal = taxable + itemGst;
}

    subtotalAmount += itemSubtotal;
    discountAmount += itemDiscount;
    gstAmount += itemGst;
    totalAmount += itemTotal;

    const kitSpecification = kitItems
      .map(
        (row) =>
          `${row.material || '-'} | ${row.brandSizeType || '-'} | Qty: ${
            row.quantity || '-'
          }`,
      )
      .join('\n');

    const orderItem = this.dealerOrderItemRepository.create({
      dealerOrderId: savedOrder.id,
      itemType: 'KIT',
      kitId: kit.id,
      kitSpecification,
      materialId: null,
      materialName: kit.kitName,
      category: 'KIT',
      brand: kit.displayBrand || '',
      unit: 'KIT',
      hsnCode: '',
      quantity,
      pendingQuantity: quantity,
      sellingRate,
      gstPercent,
      discountAmount: itemDiscount,
      subtotalAmount: itemSubtotal,
      gstAmount: itemGst,
      totalAmount: itemTotal,
      stockAvailableQuantity: 0,
      remarks:
  item.remarks ||
  `${kit.shortDescription || kit.displayCapacity || ''}${
    gstMode === 'INCLUDING' ? ' | GST Included' : ' | GST Extra'
  }`,
    } as any);

    await this.dealerOrderItemRepository.save(orderItem);
    continue;
  }

  const materialId = Number(item.materialId || 0);

  if (!materialId) {
    continue;
  }

  const material = await this.materialRepository.findOne({
    where: { id: materialId, isActive: true },
  });

  if (!material) {
    continue;
  }

  const stockItems = await this.stockRepository.find({
    where: {
      materialId,
      isHidden: false,
    },
  });

  const availableQuantity = stockItems.reduce(
    (sum, stock) =>
      sum +
      Math.max(
        Number(stock.currentQuantity || 0) -
          Number(stock.reservedQuantity || 0),
        0,
      ),
    0,
  );

  const sellingRate = Number(material.sellingRate || material.rate || 0);
  const gstPercent = Number(material.gstPercent || 0);
  const itemDiscount = Number(item.discountAmount || 0);

  const itemSubtotal = quantity * sellingRate;
  const itemGst = ((itemSubtotal - itemDiscount) * gstPercent) / 100;
  const itemTotal = itemSubtotal - itemDiscount + itemGst;

  subtotalAmount += itemSubtotal;
  discountAmount += itemDiscount;
  gstAmount += itemGst;
  totalAmount += itemTotal;

  const orderItem = this.dealerOrderItemRepository.create({
    dealerOrderId: savedOrder.id,
    itemType: 'MATERIAL',
    kitId: null,
    kitSpecification: '',
    materialId: material.id,
    materialName: material.name,
    category: material.category,
    brand: material.brand,
    unit: material.unit,
    hsnCode: material.hsnCode,
    quantity,
    pendingQuantity: quantity,
    sellingRate,
    gstPercent,
    discountAmount: itemDiscount,
    subtotalAmount: itemSubtotal,
    gstAmount: itemGst,
    totalAmount: itemTotal,
    stockAvailableQuantity: availableQuantity,
    remarks: item.remarks || '',
  } as any);

  await this.dealerOrderItemRepository.save(orderItem);
}

    savedOrder.subtotalAmount = subtotalAmount;
    savedOrder.discountAmount = discountAmount;
    savedOrder.gstAmount = gstAmount;
    savedOrder.deliveryCharge = deliveryCharge;
savedOrder.totalAmount = totalAmount + deliveryCharge;
savedOrder.paidAmount = 0;
savedOrder.pendingAmount = savedOrder.totalAmount;

    await this.dealerOrderRepository.save(savedOrder);

    const notification = this.dealerNotificationRepository.create({
      dealerId: dealer.id,
      dealerName: dealer.dealerName,
      title: 'Order Submitted',
      message: `Your dealer order ${savedOrder.orderNumber} has been submitted successfully.`,
      notificationType: 'DEALER_ORDER',
      createdBy: dealer.id,
      createdByName: dealer.dealerName,
    });

    await this.dealerNotificationRepository.save(notification);

    const piResult = await this.generateDealerProformaInvoice(savedOrder.id, {
  id: dealer.id,
  name: dealer.dealerName,
  roles: ['DEALER'],
});

return {
  order: savedOrder,
  proformaInvoice: piResult.invoice,
  message: 'Dealer order submitted and Proforma Invoice generated successfully',
};
  }

    async listDealerOrders(dealerId: number, query: any) {
    const page = Number(query?.page || 1);
    const limit = Math.min(Number(query?.limit || 20), 100);
    const skip = (page - 1) * limit;

    const qb = this.dealerOrderRepository
      .createQueryBuilder('order')
      .where('order.dealerId = :dealerId', { dealerId })
      .andWhere('order.isHidden = false')
      .orderBy('order.createdAt', 'DESC');

    if (query?.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query?.paymentType) {
      qb.andWhere('order.paymentType = :paymentType', {
        paymentType: query.paymentType,
      });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getDealerOrderDetail(dealerId: number, orderId: number) {
    const order = await this.dealerOrderRepository.findOne({
      where: {
        id: orderId,
        dealerId,
        isHidden: false,
      },
    });

    if (!order) {
      throw new NotFoundException('Dealer order not found');
    }

    const items = await this.dealerOrderItemRepository.find({
      where: { dealerOrderId: order.id },
      order: { createdAt: 'ASC' },
    });

    const payments = await this.dealerPaymentRepository.find({
      where: { dealerOrderId: order.id, dealerId },
      order: { createdAt: 'DESC' },
    });

    return {
      order,
      items,
      payments,
    };
  }

  async updateDealerOrderDelivery(orderId: number, body: any) {
  const order = await this.dealerOrderRepository.findOne({
    where: {
      id: orderId,
      isHidden: false,
    },
  });

  if (!order) {
    throw new NotFoundException('Dealer order not found');
  }

  const oldDeliveryCharge = Number(order.deliveryCharge || 0);
  const currentTotal = Number(order.totalAmount || 0);
  const currentPending = Number(order.pendingAmount || 0);

  let deliveryDistanceKm = Number(
    body?.deliveryDistanceKm ??
      order.deliveryDistanceKm ??
      order.autoDeliveryDistanceKm ??
      0,
  );

  if (deliveryDistanceKm < 0) {
    throw new BadRequestException('Distance cannot be negative');
  }

  let deliveryLatitude = Number(
    body?.deliveryLatitude ?? order.deliveryLatitude ?? 0,
  );

  let deliveryLongitude = Number(
    body?.deliveryLongitude ?? order.deliveryLongitude ?? 0,
  );

  const deliveryGpsUrl = String(
    body?.deliveryGpsUrl ?? order.deliveryGpsUrl ?? '',
  ).trim();

  if ((!deliveryLatitude || !deliveryLongitude) && deliveryGpsUrl) {
    const extracted = this.extractCoordinatesFromGpsUrl(deliveryGpsUrl);
    deliveryLatitude = extracted.latitude;
    deliveryLongitude = extracted.longitude;
  }

  const deliverySetting = await this.getDealerDeliverySetting();

  let autoDeliveryDistanceKm = Number(order.autoDeliveryDistanceKm || 0);
  let autoDeliveryCharge = Number(order.autoDeliveryCharge || 0);

  if (
    deliveryLatitude &&
    deliveryLongitude &&
    Number((deliverySetting as any)?.warehouseLatitude || 0) &&
    Number((deliverySetting as any)?.warehouseLongitude || 0)
  ) {
    autoDeliveryDistanceKm = this.calculateDistanceKm(
      Number((deliverySetting as any).warehouseLatitude || 0),
      Number((deliverySetting as any).warehouseLongitude || 0),
      deliveryLatitude,
      deliveryLongitude,
    );

    autoDeliveryCharge = this.calculateDeliveryChargeFromSetting(
      autoDeliveryDistanceKm,
      deliverySetting,
    );

    deliveryDistanceKm = autoDeliveryDistanceKm;
  }

  const manualDeliveryChargeProvided =
    body?.deliveryCharge !== undefined &&
    body?.deliveryCharge !== null &&
    body?.deliveryCharge !== '';

  const deliveryCharge = manualDeliveryChargeProvided
    ? Number(body.deliveryCharge || 0)
    : autoDeliveryCharge > 0
      ? autoDeliveryCharge
      : this.calculateDealerDeliveryCharge(
          deliveryDistanceKm,
          deliverySetting,
        );

  if (deliveryCharge < 0) {
    throw new BadRequestException('Delivery charge cannot be negative');
  }

  order.deliveryDistanceKm = deliveryDistanceKm;
  order.deliveryLatitude = deliveryLatitude;
  order.deliveryLongitude = deliveryLongitude;
  order.deliveryGpsUrl = deliveryGpsUrl;
  order.deliveryLocationSource =
    body?.deliveryLocationSource ||
    order.deliveryLocationSource ||
    '';
  order.autoDeliveryDistanceKm = autoDeliveryDistanceKm;
  order.autoDeliveryCharge = autoDeliveryCharge;
  order.deliveryCharge = deliveryCharge;

  order.totalAmount =
    currentTotal - oldDeliveryCharge + deliveryCharge;

  order.pendingAmount = Math.max(
    currentPending - oldDeliveryCharge + deliveryCharge,
    0,
  );

  return this.dealerOrderRepository.save(order);
}

    async createDealerPayment(dealerId: number, body: any) {
    const dealer = await this.dealerRepository.findOne({
      where: { id: dealerId, isHidden: false },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    const orderId = Number(body.dealerOrderId || 0);

    if (!orderId) {
      throw new NotFoundException('Dealer order is required');
    }

    const order = await this.dealerOrderRepository.findOne({
      where: {
        id: orderId,
        dealerId,
        isHidden: false,
      },
    });

    if (!order) {
      throw new NotFoundException('Dealer order not found');
    }

    const amount = Number(body.amount || 0);

    if (amount <= 0) {
      throw new NotFoundException('Payment amount is required');
    }

    const payment = this.dealerPaymentRepository.create({
      dealerOrderId: order.id,
      dealerId: dealer.id,
      dealerName: dealer.dealerName,
      amount,
      paymentMode: body.paymentMode || order.paymentType || 'ONLINE',
      transactionId: body.transactionId || '',
      receiptUrl: body.receiptUrl || '',
      remarks: body.remarks || '',
      createdBy: dealer.id,
      createdByName: dealer.dealerName,
    });

    const savedPayment = await this.dealerPaymentRepository.save(payment);

    order.paidAmount = Number(order.paidAmount || 0) + amount;
    order.pendingAmount = Math.max(
      Number(order.totalAmount || 0) - Number(order.paidAmount || 0),
      0,
    );

    await this.dealerOrderRepository.save(order);

    const notification = this.dealerNotificationRepository.create({
      dealerId: dealer.id,
      dealerName: dealer.dealerName,
      title: 'Payment Submitted',
      message: `Payment of ₹${amount} submitted for order ${order.orderNumber}.`,
      notificationType: 'DEALER_PAYMENT',
      createdBy: dealer.id,
      createdByName: dealer.dealerName,
    });

    await this.dealerNotificationRepository.save(notification);

    return {
      payment: savedPayment,
      order,
      message: 'Payment submitted successfully',
    };
  }

    async uploadDealerPaymentReceipts(files: any[], user: any) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('At least one payment receipt is required');
    }

    const uploadedFiles: any[] = [];

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket =
      process.env.SUPABASE_PROJECT_DOCUMENTS_BUCKET || 'project-documents';

    if (!supabaseUrl || !serviceKey) {
      throw new BadRequestException('Supabase storage is not configured');
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    for (const file of files) {
      if (!file) continue;

      const mimeType = String(file.mimetype || '');

      if (!allowedTypes.includes(mimeType)) {
        throw new BadRequestException(
          'Only JPG, PNG, WEBP and PDF receipts are allowed',
        );
      }

      const maxSize = 5 * 1024 * 1024;

      if (file.size > maxSize) {
        throw new BadRequestException('Receipt file must be less than 5 MB');
      }

      const originalName = String(file.originalname || 'dealer-payment-receipt');
      const extension = originalName.includes('.')
        ? originalName.split('.').pop()
        : mimeType.split('/')[1] || 'file';

      const safeExtension = String(extension || 'file').replace(
        /[^a-zA-Z0-9]/g,
        '',
      );

      const filePath = `dealer-payment-receipts/dealer-${
        user?.id || 'unknown'
      }/${Date.now()}-${randomUUID()}.${safeExtension}`;

      const uploadResult = await supabase.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadResult.error) {
        throw new BadRequestException(uploadResult.error.message);
      }

      const publicUrlResult = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      uploadedFiles.push({
        fileUrl: publicUrlResult.data.publicUrl,
        fileName: originalName,
        fileSize: file.size,
        filePath,
        mimeType,
      });
    }

    return {
      message: `${uploadedFiles.length} dealer payment receipt file(s) uploaded successfully`,
      receipts: uploadedFiles,
    };
  }

    async createDealerComplaint(dealerId: number, body: any, user: any) {
    const dealer = await this.dealerRepository.findOne({
      where: { id: dealerId, isHidden: false },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    const complaint = this.dealerComplaintRepository.create({
      dealerId: dealer.id,
      dealerOrderId: body.dealerOrderId ? Number(body.dealerOrderId) : null,
      subject: body.subject || 'Dealer Complaint',
      description: body.description || body.complaintText || '',
      photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls : [],
      createdBy: user?.id || dealer.id,
      createdByName: user?.name || dealer.dealerName,
      createdByRole: 'DEALER',
    } as any);

    return this.dealerComplaintRepository.save(complaint);
  }

  async listDealerComplaints(dealerId: number, query: any) {
    const page = Number(query?.page || 1);
    const limit = Math.min(Number(query?.limit || 20), 100);
    const skip = (page - 1) * limit;

    const qb = this.dealerComplaintRepository
      .createQueryBuilder('complaint')
      .where('complaint.dealerId = :dealerId', { dealerId })
      .orderBy('complaint.createdAt', 'DESC');

    if (query?.status) {
      qb.andWhere('complaint.status = :status', {
        status: query.status,
      });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async uploadDealerComplaintPhotos(files: any[], user: any) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('At least one complaint photo is required');
    }

    const uploadedFiles: any[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket =
      process.env.SUPABASE_PROJECT_DOCUMENTS_BUCKET || 'project-documents';

    if (!supabaseUrl || !serviceKey) {
      throw new BadRequestException('Supabase storage is not configured');
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    for (const file of files) {
      if (!file) continue;

      const mimeType = String(file.mimetype || '');

      if (!allowedTypes.includes(mimeType)) {
        throw new BadRequestException('Only JPG, PNG, and WEBP photos are allowed');
      }

      const maxSize = 5 * 1024 * 1024;

      if (file.size > maxSize) {
        throw new BadRequestException('Complaint photo must be less than 5 MB');
      }

      const originalName = String(file.originalname || 'dealer-complaint-photo');
      const extension = originalName.includes('.')
        ? originalName.split('.').pop()
        : mimeType.split('/')[1] || 'jpg';

      const safeExtension = String(extension || 'jpg').replace(
        /[^a-zA-Z0-9]/g,
        '',
      );

      const filePath = `dealer-complaints/dealer-${
        user?.id || 'unknown'
      }/${Date.now()}-${randomUUID()}.${safeExtension}`;

      const uploadResult = await supabase.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadResult.error) {
        throw new BadRequestException(uploadResult.error.message);
      }

      const publicUrlResult = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      uploadedFiles.push({
        fileUrl: publicUrlResult.data.publicUrl,
        fileName: originalName,
        fileSize: file.size,
        filePath,
      });
    }

    return {
      message: `${uploadedFiles.length} dealer complaint photo(s) uploaded successfully`,
      photos: uploadedFiles,
    };
  }

    async createDealerOrderComment(
    dealerId: number,
    orderId: number,
    body: any,
    user: any,
  ) {
    const dealer = await this.dealerRepository.findOne({
      where: { id: dealerId, isHidden: false },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    const order = await this.dealerOrderRepository.findOne({
      where: {
        id: orderId,
        dealerId,
        isHidden: false,
      },
    });

    if (!order) {
      throw new NotFoundException('Dealer order not found');
    }

    const commentText = String(body.comment || '').trim();

    if (!commentText) {
      throw new NotFoundException('Comment is required');
    }

    const comment = this.dealerCommentRepository.create({
      dealerOrderId: order.id,
      dealerId: dealer.id,
      dealerName: dealer.dealerName,
      comment: commentText,
      commentType: body.commentType || 'DEALER_COMMENT',
      createdBy: user?.id || dealer.id,
      createdByName: user?.name || dealer.dealerName,
      createdByRole: 'DEALER',
    });

    const savedComment = await this.dealerCommentRepository.save(comment);

    const notification = this.dealerNotificationRepository.create({
      dealerId: dealer.id,
      dealerName: dealer.dealerName,
      title: 'Comment Added',
      message: `A comment was added on order ${order.orderNumber}.`,
      notificationType: 'DEALER_ORDER_COMMENT',
      createdBy: dealer.id,
      createdByName: dealer.dealerName,
    });

    await this.dealerNotificationRepository.save(notification);

    return savedComment;
  }

  async listDealerOrderComments(dealerId: number, orderId: number) {
    const order = await this.dealerOrderRepository.findOne({
      where: {
        id: orderId,
        dealerId,
        isHidden: false,
      },
    });

    if (!order) {
      throw new NotFoundException('Dealer order not found');
    }

    return this.dealerCommentRepository.find({
      where: {
        dealerOrderId: order.id,
        dealerId,
      },
      order: { createdAt: 'ASC' },
    });
  }

    async listDealerNotifications(dealerId: number, query: any) {
    const page = Number(query?.page || 1);
    const limit = Math.min(Number(query?.limit || 20), 100);
    const skip = (page - 1) * limit;

    const qb = this.dealerNotificationRepository
      .createQueryBuilder('notification')
      .where('notification.dealerId = :dealerId', { dealerId })
      .orderBy('notification.createdAt', 'DESC');

    if (query?.status) {
      qb.andWhere('notification.status = :status', {
        status: query.status,
      });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async markDealerNotificationRead(dealerId: number, notificationId: number) {
    const notification = await this.dealerNotificationRepository.findOne({
      where: {
        id: notificationId,
        dealerId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Dealer notification not found');
    }

    notification.status = 'READ' as any;

    return this.dealerNotificationRepository.save(notification);
  }

    async createMonthlyRequirement(dealerId: number, body: any, user: any) {
    const dealer = await this.dealerRepository.findOne({
      where: { id: dealerId, isHidden: false },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    const materialId = Number(body.materialId || 0);
    const expectedQuantity = Number(body.expectedQuantity || 0);

    if (!materialId) {
      throw new NotFoundException('Material is required');
    }

    if (expectedQuantity <= 0) {
      throw new NotFoundException('Expected quantity is required');
    }

    const material = await this.materialRepository.findOne({
      where: { id: materialId, isActive: true },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const requirement = this.dealerMonthlyRequirementRepository.create({
      dealerId: dealer.id,
      dealerName: dealer.dealerName,
      materialId: material.id,
      materialName: material.name,
      category: material.category,
      brand: material.brand,
      unit: material.unit,
      requirementMonth:
        body.requirementMonth ||
        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      expectedQuantity,
      remarks: body.remarks || '',
      createdBy: user?.id || dealer.id,
      createdByName: user?.name || dealer.dealerName,
    });

    return this.dealerMonthlyRequirementRepository.save(requirement);
  }

  async listMonthlyRequirements(dealerId: number, query: any) {
    const page = Number(query?.page || 1);
    const limit = Math.min(Number(query?.limit || 20), 100);
    const skip = (page - 1) * limit;

    const qb = this.dealerMonthlyRequirementRepository
      .createQueryBuilder('requirement')
      .where('requirement.dealerId = :dealerId', { dealerId })
      .andWhere('requirement.isHidden = false')
      .orderBy('requirement.createdAt', 'DESC');

    if (query?.requirementMonth) {
      qb.andWhere('requirement.requirementMonth = :requirementMonth', {
        requirementMonth: query.requirementMonth,
      });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

    async updateDealerOrderStatus(orderId: number, body: any, user: any) {
    const order = await this.dealerOrderRepository.findOne({
      where: { id: orderId, isHidden: false },
    });

    if (!order) {
      throw new NotFoundException('Dealer order not found');
    }

    if (body.status) {
      order.status = body.status;
    }

    if (body.expectedDeliveryAt) {
      order.expectedDeliveryAt = new Date(body.expectedDeliveryAt);
    }

    if (body.adminRemarks !== undefined) {
      order.adminRemarks = body.adminRemarks || '';
    }

    if (body.status === 'DELIVERED') {
      order.deliveredAt = new Date();
    }

    const savedOrder = await this.dealerOrderRepository.save(order);

    const notification = this.dealerNotificationRepository.create({
      dealerId: savedOrder.dealerId,
      dealerName: savedOrder.dealerName,
      title: 'Order Status Updated',
      message: `Your order ${savedOrder.orderNumber} status is now ${savedOrder.status}.`,
      notificationType: 'DEALER_ORDER_STATUS',
      createdBy: user?.id || null,
      createdByName: user?.name || user?.email || '',
    });

    await this.dealerNotificationRepository.save(notification);

    return savedOrder;
  }

  async updateDealerOrderItem(
  orderId: number,
  itemId: number,
  body: any,
  user: any,
) {
  const order = await this.dealerOrderRepository.findOne({
    where: { id: orderId, isHidden: false },
  });

  if (!order) {
    throw new NotFoundException('Dealer order not found');
  }

  const item = await this.dealerOrderItemRepository.findOne({
    where: {
      id: itemId,
      dealerOrderId: order.id,
    },
  });

  if (!item) {
    throw new NotFoundException('Dealer order item not found');
  }

  const acceptedQuantity =
    body.acceptedQuantity !== undefined
      ? Number(body.acceptedQuantity || 0)
      : Number(item.acceptedQuantity || 0);

  if (acceptedQuantity < 0) {
    throw new BadRequestException('Accepted quantity cannot be negative');
  }

  if (acceptedQuantity > Number(item.quantity || 0)) {
    throw new BadRequestException(
      'Accepted quantity cannot be greater than ordered quantity',
    );
  }

  const discountAmount =
    body.discountAmount !== undefined
      ? Number(body.discountAmount || 0)
      : Number(item.discountAmount || 0);

  if (discountAmount < 0) {
    throw new BadRequestException('Discount cannot be negative');
  }

  item.acceptedQuantity = acceptedQuantity;
  item.pendingQuantity = Math.max(
    Number(item.quantity || 0) - acceptedQuantity,
    0,
  );

  item.discountAmount = discountAmount;

  const baseQuantity =
    acceptedQuantity > 0
      ? acceptedQuantity
      : Number(item.quantity || 0);

  const subtotalAmount =
    baseQuantity * Number(item.sellingRate || 0);

  const taxableAmount = Math.max(
    subtotalAmount - discountAmount,
    0,
  );

  const gstAmount =
    (taxableAmount * Number(item.gstPercent || 0)) / 100;

  item.subtotalAmount = subtotalAmount;
  item.gstAmount = gstAmount;
  item.totalAmount = taxableAmount + gstAmount;

  if (body.reservedQuantity !== undefined) {
    item.reservedQuantity = Number(body.reservedQuantity || 0);
  }

  if (body.dispatchedQuantity !== undefined) {
    item.dispatchedQuantity = Number(body.dispatchedQuantity || 0);
  }

  if (body.remarks !== undefined) {
    item.remarks = body.remarks || '';
  }

  await this.dealerOrderItemRepository.save(item);

  const items = await this.dealerOrderItemRepository.find({
    where: { dealerOrderId: order.id },
  });

  const totalOrdered = items.reduce(
    (sum, row) => sum + Number(row.quantity || 0),
    0,
  );

  const totalAccepted = items.reduce(
    (sum, row) => sum + Number(row.acceptedQuantity || 0),
    0,
  );

  const subtotalAmountTotal = items.reduce(
    (sum, row) => sum + Number(row.subtotalAmount || 0),
    0,
  );

  const discountAmountTotal = items.reduce(
    (sum, row) => sum + Number(row.discountAmount || 0),
    0,
  );

  const gstAmountTotal = items.reduce(
    (sum, row) => sum + Number(row.gstAmount || 0),
    0,
  );

  const itemsTotalAmount = items.reduce(
    (sum, row) => sum + Number(row.totalAmount || 0),
    0,
  );

  order.subtotalAmount = subtotalAmountTotal;
  order.discountAmount = discountAmountTotal;
  order.gstAmount = gstAmountTotal;
  order.totalAmount =
    itemsTotalAmount + Number(order.deliveryCharge || 0);
  order.pendingAmount = Math.max(
    Number(order.totalAmount || 0) -
      Number(order.paidAmount || 0),
    0,
  );

  if (totalAccepted <= 0) {
    order.status = 'STOCK_OUT' as any;
  } else if (totalAccepted < totalOrdered) {
    order.status = 'PARTIALLY_ACCEPTED' as any;
  } else {
    order.status = 'ACCEPTED' as any;
  }

  await this.dealerOrderRepository.save(order);

  const notification = this.dealerNotificationRepository.create({
    dealerId: order.dealerId,
    dealerName: order.dealerName,
    title: 'Order Item Updated',
    message: `Order item updated in order ${order.orderNumber}.`,
    notificationType: 'DEALER_ORDER_ITEM',
    createdBy: user?.id || null,
    createdByName: user?.name || user?.email || '',
  });

  await this.dealerNotificationRepository.save(notification);

  return {
    order,
    item,
    items,
  };
}

    async approveDealerPayment(paymentId: number, body: any, user: any) {
    const payment = await this.dealerPaymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Dealer payment not found');
    }

    const order = await this.dealerOrderRepository.findOne({
      where: {
        id: payment.dealerOrderId,
        dealerId: payment.dealerId,
        isHidden: false,
      },
    });

    if (!order) {
      throw new NotFoundException('Dealer order not found');
    }

    payment.status = body.status || 'APPROVED';
    payment.approvalNote = body.approvalNote || payment.approvalNote;
    payment.approvedBy = user?.id || null;
    payment.approvedByName = user?.name || user?.email || '';
    payment.approvedAt = new Date();

    const savedPayment = await this.dealerPaymentRepository.save(payment);

    if (savedPayment.status === 'APPROVED') {
      const approvedPayments = await this.dealerPaymentRepository.find({
        where: {
          dealerOrderId: order.id,
          dealerId: order.dealerId,
          status: 'APPROVED' as any,
        },
      });

      const paidAmount = approvedPayments.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

      order.paidAmount = paidAmount;
      order.pendingAmount = Math.max(
        Number(order.totalAmount || 0) - paidAmount,
        0,
      );

      await this.dealerOrderRepository.save(order);
    }

    const notification = this.dealerNotificationRepository.create({
      dealerId: order.dealerId,
      dealerName: order.dealerName,
      title: 'Payment Updated',
      message: `Your payment for order ${order.orderNumber} is now ${savedPayment.status}.`,
      notificationType: 'DEALER_PAYMENT_STATUS',
      createdBy: user?.id || null,
      createdByName: user?.name || user?.email || '',
    });

    await this.dealerNotificationRepository.save(notification);

    return {
      payment: savedPayment,
      order,
    };
  }

    @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDealerCreditOverdueReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueOrders = await this.dealerOrderRepository
      .createQueryBuilder('order')
      .where('order.isHidden = false')
      .andWhere('order.paymentType = :paymentType', {
        paymentType: ProjectDealerPaymentType.CREDIT,
      })
      .andWhere('order.pendingAmount > 0')
      .andWhere('order.creditDueDate IS NOT NULL')
      .andWhere('order.creditDueDate < :today', { today })
      .getMany();

    for (const order of overdueOrders) {
      const alreadySentToday =
        await this.dealerNotificationRepository
          .createQueryBuilder('notification')
          .where('notification.dealerId = :dealerId', {
            dealerId: order.dealerId,
          })
          .andWhere('notification.notificationType = :type', {
            type: 'CREDIT_OVERDUE_REMINDER',
          })
          .andWhere('notification.message LIKE :orderText', {
            orderText: `%${order.orderNumber}%`,
          })
          .andWhere('notification.createdAt >= :today', { today })
          .getOne();

      if (alreadySentToday) {
        continue;
      }

      const notification = this.dealerNotificationRepository.create({
        dealerId: order.dealerId,
        dealerName: order.dealerName,
        title: 'Credit Payment Overdue',
        message: `Credit payment for order ${order.orderNumber} is overdue. Pending amount: ₹${Number(
          order.pendingAmount || 0,
        ).toFixed(2)}.`,
        notificationType: 'CREDIT_OVERDUE_REMINDER',
        createdByName: 'System',
      });

      await this.dealerNotificationRepository.save(notification);
    }

    return {
      checkedAt: new Date(),
      overdueCount: overdueOrders.length,
    };
  }

    async listInternalDealerOrders(query: any) {
    const page = Number(query?.page || 1);
    const limit = Math.min(Number(query?.limit || 20), 100);
    const skip = (page - 1) * limit;

    const qb = this.dealerOrderRepository
      .createQueryBuilder('order')
      .where('order.isHidden = false')
      .orderBy('order.createdAt', 'DESC');

    if (query?.dealerId) {
      qb.andWhere('order.dealerId = :dealerId', {
        dealerId: Number(query.dealerId),
      });
    }

    if (query?.dealerSearch) {
      const search = `%${String(query.dealerSearch).toLowerCase()}%`;

      qb.andWhere(
        `
        LOWER(order.dealerName) LIKE :search
        OR LOWER(order.dealerPhone) LIKE :search
        OR LOWER(order.dealerGstNumber) LIKE :search
        `,
        { search },
      );
    }

    if (query?.branchName) {
      qb.andWhere('LOWER(order.branchName) LIKE :branchName', {
        branchName: `%${String(query.branchName).toLowerCase()}%`,
      });
    }

    if (query?.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query?.paymentType) {
      qb.andWhere('order.paymentType = :paymentType', {
        paymentType: query.paymentType,
      });
    }

    if (query?.fromDate) {
      qb.andWhere('order.createdAt >= :fromDate', {
        fromDate: new Date(query.fromDate),
      });
    }

    if (query?.toDate) {
      const endDate = new Date(query.toDate);
      endDate.setHours(23, 59, 59, 999);

      qb.andWhere('order.createdAt <= :toDate', {
        toDate: endDate,
      });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getInternalDealerOrderDetail(orderId: number) {
    const order = await this.dealerOrderRepository.findOne({
      where: {
        id: orderId,
        isHidden: false,
      },
    });

    if (!order) {
      throw new NotFoundException('Dealer order not found');
    }

    const items = await this.dealerOrderItemRepository.find({
      where: { dealerOrderId: order.id },
      order: { createdAt: 'ASC' },
    });

    const payments = await this.dealerPaymentRepository.find({
      where: { dealerOrderId: order.id, dealerId: order.dealerId },
      order: { createdAt: 'DESC' },
    });

    const comments = await this.dealerCommentRepository.find({
      where: { dealerOrderId: order.id },
      order: { createdAt: 'ASC' },
    });

    return {
      order,
      items,
      payments,
      comments,
    };
  }

  async listInternalDealerPayments(query: any) {
    const page = Number(query?.page || 1);
    const limit = Math.min(Number(query?.limit || 20), 100);
    const skip = (page - 1) * limit;

    const qb = this.dealerPaymentRepository
      .createQueryBuilder('payment')
      .orderBy('payment.createdAt', 'DESC');

    if (query?.dealerId) {
      qb.andWhere('payment.dealerId = :dealerId', {
        dealerId: Number(query.dealerId),
      });
    }

    if (query?.dealerSearch) {
      const search = `%${String(query.dealerSearch).toLowerCase()}%`;

      qb.andWhere('LOWER(payment.dealerName) LIKE :search', { search });
    }

    if (query?.dealerOrderId) {
      qb.andWhere('payment.dealerOrderId = :dealerOrderId', {
        dealerOrderId: Number(query.dealerOrderId),
      });
    }

    if (query?.status) {
      qb.andWhere('payment.status = :status', {
        status: query.status,
      });
    }

    if (query?.paymentMode) {
      qb.andWhere('payment.paymentMode = :paymentMode', {
        paymentMode: query.paymentMode,
      });
    }

    if (query?.fromDate) {
      qb.andWhere('payment.createdAt >= :fromDate', {
        fromDate: new Date(query.fromDate),
      });
    }

    if (query?.toDate) {
      const endDate = new Date(query.toDate);
      endDate.setHours(23, 59, 59, 999);

      qb.andWhere('payment.createdAt <= :toDate', {
        toDate: endDate,
      });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

    async createDealer(body: any, user: any) {
    const dealerName = String(body.dealerName || '').trim();

    if (!dealerName) {
      throw new BadRequestException('Dealer name is required');
    }

    const dealer = this.dealerRepository.create({
      dealerName,
      firmName: body.firmName || '',
      phone: body.phone || '',
      email: body.email || '',
      gstNumber: body.gstNumber || '',
      branchName: body.branchName || '',
      city: body.city || '',
      address: body.address || '',
      creditEnabled: Boolean(body.creditEnabled),
      creditLimit: Number(body.creditLimit || 0),
      creditDays: Number(body.creditDays || 0),
      status: body.status || 'ACTIVE',
    } as any);

    return this.dealerRepository.save(dealer);
  }

  async listDealers(query: any) {
    const page = Number(query?.page || 1);
    const limit = Math.min(Number(query?.limit || 20), 100);
    const skip = (page - 1) * limit;
    const includeHidden = query?.includeHidden === 'true';

    const qb = this.dealerRepository
      .createQueryBuilder('dealer')
      .orderBy('dealer.createdAt', 'DESC');

    if (!includeHidden) {
      qb.where('dealer.isHidden = false');
    } else {
      qb.where('1=1');
    }

    if (query?.search) {
      const search = `%${String(query.search).toLowerCase()}%`;

      qb.andWhere(
        `
        LOWER(dealer.dealerName) LIKE :search
        OR LOWER(dealer.firmName) LIKE :search
        OR LOWER(dealer.phone) LIKE :search
        OR LOWER(dealer.gstNumber) LIKE :search
        OR LOWER(dealer.city) LIKE :search
        `,
        { search },
      );
    }

    if (query?.branchName) {
      qb.andWhere('LOWER(dealer.branchName) LIKE :branchName', {
        branchName: `%${String(query.branchName).toLowerCase()}%`,
      });
    }

    if (query?.status) {
      qb.andWhere('dealer.status = :status', { status: query.status });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getDealer(id: number) {
    const dealer = await this.dealerRepository.findOne({
      where: { id },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    return dealer;
  }

  async updateDealer(id: number, body: any, user: any) {
    const dealer = await this.dealerRepository.findOne({
      where: { id },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    dealer.dealerName = body.dealerName ?? dealer.dealerName;
    dealer.firmName = body.firmName ?? dealer.firmName;
    dealer.phone = body.phone ?? dealer.phone;
    dealer.email = body.email ?? dealer.email;
    dealer.gstNumber = body.gstNumber ?? dealer.gstNumber;
    dealer.branchName = body.branchName ?? dealer.branchName;
    dealer.city = body.city ?? dealer.city;
    dealer.address = body.address ?? dealer.address;
    dealer.creditEnabled =
      body.creditEnabled !== undefined
        ? Boolean(body.creditEnabled)
        : dealer.creditEnabled;
    dealer.creditLimit =
      body.creditLimit !== undefined
        ? Number(body.creditLimit || 0)
        : dealer.creditLimit;
    dealer.creditDays =
      body.creditDays !== undefined
        ? Number(body.creditDays || 0)
        : dealer.creditDays;
    dealer.status = body.status ?? dealer.status;

    return this.dealerRepository.save(dealer);
  }

  async hideDealer(id: number, body: any, user: any) {
    const dealer = await this.dealerRepository.findOne({
      where: { id },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    dealer.isHidden = true;
    dealer.hiddenAt = new Date();
    dealer.hiddenBy = user?.id || null;
    dealer.hiddenByName = user?.name || user?.email || '';
    dealer.hiddenReason = body.hiddenReason || body.reason || '';

    return this.dealerRepository.save(dealer);
  }

  async restoreDealer(id: number, body: any, user: any) {
    const dealer = await this.dealerRepository.findOne({
      where: { id },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    dealer.isHidden = false;
    dealer.restoredAt = new Date();
    dealer.restoredBy = user?.id || null;
    dealer.restoredByName = user?.name || user?.email || '';
    dealer.restoreReason = body.restoreReason || body.reason || '';

    return this.dealerRepository.save(dealer);
  }

    async createBankDetail(body: any, user: any) {
    const accountName = String(body.accountName || '').trim();

    if (!accountName) {
      throw new BadRequestException('Account name is required');
    }

    const bankDetail = this.bankDetailRepository.create({
      accountName,
      bankName: body.bankName || '',
      accountNumber: body.accountNumber || '',
      ifsc: body.ifsc || '',
      upiId: body.upiId || '',
      qrCodeUrl: body.qrCodeUrl || '',
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });

    return this.bankDetailRepository.save(bankDetail);
  }

  async listBankDetails() {
    return this.bankDetailRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateBankDetail(id: number, body: any, user: any) {
    const bankDetail = await this.bankDetailRepository.findOne({
      where: { id },
    });

    if (!bankDetail) {
      throw new NotFoundException('Bank detail not found');
    }

    bankDetail.accountName = body.accountName ?? bankDetail.accountName;
    bankDetail.bankName = body.bankName ?? bankDetail.bankName;
    bankDetail.accountNumber =
      body.accountNumber ?? bankDetail.accountNumber;
    bankDetail.ifsc = body.ifsc ?? bankDetail.ifsc;
    bankDetail.upiId = body.upiId ?? bankDetail.upiId;
    bankDetail.qrCodeUrl = body.qrCodeUrl ?? bankDetail.qrCodeUrl;
    bankDetail.isActive =
      body.isActive !== undefined
        ? Boolean(body.isActive)
        : bankDetail.isActive;

    return this.bankDetailRepository.save(bankDetail);
  }

  async listCompanyBankDetails(query: any) {
  const showInactive = query?.showInactive === 'true';

  return this.bankDetailRepository.find({
    where: showInactive ? {} : { isActive: true },
    order: { createdAt: 'DESC' } as any,
  });
}

async saveCompanyBankDetail(body: any) {
  const isActive = body?.isActive !== false;

  if (isActive) {
    const activeRecords = await this.bankDetailRepository.find({
  where: { isActive: true } as any,
});

for (const record of activeRecords) {
  record.isActive = false;
}

await this.bankDetailRepository.save(activeRecords);
  }

  let detail: any = null;

  if (body?.id) {
    detail = await this.bankDetailRepository.findOne({
      where: { id: Number(body.id) },
    });
  }

  if (!detail) {
    detail = this.bankDetailRepository.create();
  }

  detail.accountName = body.accountName || '';
  detail.bankName = body.bankName || '';
  detail.accountNumber = body.accountNumber || '';
  detail.ifsc = body.ifsc || '';
  detail.upiId = body.upiId || '';
  detail.qrCodeUrl = body.qrCodeUrl || '';
  detail.isActive = isActive;

  return this.bankDetailRepository.save(detail);
}

async activateCompanyBankDetail(id: number) {
  const detail = await this.bankDetailRepository.findOne({
    where: { id },
  });

  if (!detail) {
    throw new NotFoundException('Bank detail not found');
  }

 const activeRecords = await this.bankDetailRepository.find({
  where: { isActive: true } as any,
});

for (const record of activeRecords) {
  record.isActive = false;
}

await this.bankDetailRepository.save(activeRecords);

  detail.isActive = true;

  return this.bankDetailRepository.save(detail);
}

async deactivateCompanyBankDetail(id: number) {
  const detail = await this.bankDetailRepository.findOne({
    where: { id },
  });

  if (!detail) {
    throw new NotFoundException('Bank detail not found');
  }

  detail.isActive = false;

  return this.bankDetailRepository.save(detail);
}

    async listInternalDealerComplaints(query: any) {
    const page = Number(query?.page || 1);
    const limit = Math.min(Number(query?.limit || 20), 100);
    const skip = (page - 1) * limit;

    const qb = this.dealerComplaintRepository
      .createQueryBuilder('complaint')
      .orderBy('complaint.createdAt', 'DESC');

    if (query?.dealerId) {
      qb.andWhere('complaint.dealerId = :dealerId', {
        dealerId: Number(query.dealerId),
      });
    }

    if (query?.dealerOrderId) {
      qb.andWhere('complaint.dealerOrderId = :dealerOrderId', {
        dealerOrderId: Number(query.dealerOrderId),
      });
    }

    if (query?.status) {
      qb.andWhere('complaint.status = :status', {
        status: query.status,
      });
    }

    if (query?.search) {
      const search = `%${String(query.search).toLowerCase()}%`;

      qb.andWhere(
        `
        LOWER(complaint.subject) LIKE :search
        OR LOWER(complaint.description) LIKE :search
        `,
        { search },
      );
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async updateInternalDealerComplaint(id: number, body: any, user: any) {
    const complaint = await this.dealerComplaintRepository.findOne({
      where: { id },
    });

    if (!complaint) {
      throw new NotFoundException('Dealer complaint not found');
    }

    complaint.status = body.status || complaint.status;

if (body.adminRemarks !== undefined) {
  complaint.adminRemarks = body.adminRemarks || '';
  complaint.lastResponseBy = user?.id || null;
  complaint.lastResponseByName = user?.name || user?.email || '';
  complaint.lastResponseAt = new Date();
}

    const savedComplaint =
      await this.dealerComplaintRepository.save(complaint);

    const dealer = await this.dealerRepository.findOne({
      where: { id: savedComplaint.dealerId },
    });

    if (dealer) {
      const notification = this.dealerNotificationRepository.create({
        dealerId: dealer.id,
        dealerName: dealer.dealerName,
        title: 'Complaint Updated',
        message: `Your complaint #${savedComplaint.id} status is now ${savedComplaint.status}.${
  savedComplaint.adminRemarks
    ? ` Response: ${savedComplaint.adminRemarks}`
    : ''
}`,
        notificationType: 'DEALER_COMPLAINT_STATUS',
        createdBy: user?.id || null,
        createdByName: user?.name || user?.email || '',
      });

      await this.dealerNotificationRepository.save(notification);
    }

    return savedComplaint;
  }

    async generateDealerFinalInvoice(orderId: number, user: any) {
    const order = await this.dealerOrderRepository.findOne({
      where: { id: orderId, isHidden: false },
    });

    if (!order) {
      throw new NotFoundException('Dealer order not found');
    }

    const orderItems = await this.dealerOrderItemRepository.find({
      where: { dealerOrderId: order.id },
      order: { createdAt: 'ASC' },
    });

    const acceptedItems = orderItems.filter(
      (item) => Number(item.acceptedQuantity || 0) > 0,
    );

    if (!acceptedItems.length) {
      throw new BadRequestException(
        'No accepted material found for final invoice',
      );
    }

    let subtotalAmount = 0;
    let discountAmount = 0;
    let gstAmount = 0;
    let totalAmount = 0;

    const invoice = new ProjectFinalInvoice();

    invoice.projectId = 0;
    invoice.invoiceType = 'DEALER';
    invoice.dealerId = order.dealerId;
    invoice.dealerName = order.dealerName;
    invoice.dealerPhone = order.dealerPhone;
    invoice.dealerGstNumber = order.dealerGstNumber;
    invoice.dealerAddress = order.dealerAddress;
    invoice.invoiceNumber = `DINV-${order.id}`;
    invoice.status = ProjectFinalInvoiceStatus.GENERATED;
    invoice.invoiceDate = new Date();
    invoice.dueDate = order.creditDueDate || null;
    invoice.remarks = order.remarks || '';
    invoice.createdBy = user?.id || null;
    invoice.createdByName = user?.name || user?.email || '';
    invoice.createdByRole = Array.isArray(user?.roles)
      ? user.roles.join(', ')
      : '';

    const savedInvoice = await this.finalInvoiceRepository.save(invoice);

    for (const item of acceptedItems) {
      const acceptedQuantity = Number(item.acceptedQuantity || 0);
      const finalRate = Number(item.sellingRate || 0);
      const itemDiscount = Number(item.discountAmount || 0);
      const itemSubtotal = acceptedQuantity * finalRate;
      const itemGst =
        ((itemSubtotal - itemDiscount) * Number(item.gstPercent || 0)) / 100;
      const itemTotal = itemSubtotal - itemDiscount + itemGst;

      subtotalAmount += itemSubtotal;
      discountAmount += itemDiscount;
      gstAmount += itemGst;
      totalAmount += itemTotal;

      const invoiceItem = this.finalInvoiceItemRepository.create({
        finalInvoiceId: savedInvoice.id,
        materialId: item.materialId,
        itemName: item.materialName,
        category: item.category,
        brand: item.brand,
        unit: item.unit,
        hsnCode: item.hsnCode,
        quantity: acceptedQuantity,
        finalRate,
        gstPercent: Number(item.gstPercent || 0),
        discountAmount: itemDiscount,
        subtotalAmount: itemSubtotal,
        gstAmount: itemGst,
        totalAmount: itemTotal,
        remarks: item.remarks || '',
      } as any);

      await this.finalInvoiceItemRepository.save(invoiceItem);
    }

    if (
  order.deliveryMode === 'DELIVERY' &&
  Number(order.deliveryCharge || 0) <= 0
) {
  throw new BadRequestException(
    'Please confirm delivery charge before generating final invoice',
  );
}

const deliveryCharge = Number(order.deliveryCharge || 0);

if (deliveryCharge > 0) {
  subtotalAmount += deliveryCharge;
  totalAmount += deliveryCharge;

  const deliveryItem = this.finalInvoiceItemRepository.create({
    finalInvoiceId: savedInvoice.id,
    materialId: 0,
    itemName: `Delivery Charge (${Number(order.deliveryDistanceKm || 0)} KM)`,
    category: 'DELIVERY',
    brand: '',
    unit: 'SERVICE',
    hsnCode: '',
    quantity: 1,
    finalRate: deliveryCharge,
    gstPercent: 0,
    discountAmount: 0,
    subtotalAmount: deliveryCharge,
    gstAmount: 0,
    totalAmount: deliveryCharge,
    remarks: order.deliveryAddress || '',
  } as any);

  await this.finalInvoiceItemRepository.save(deliveryItem);
}

    savedInvoice.subtotalAmount = subtotalAmount;
    savedInvoice.discountAmount = discountAmount;
    savedInvoice.gstAmount = gstAmount;
    savedInvoice.totalAmount = totalAmount;
    savedInvoice.paidAmount = Number(order.paidAmount || 0);
    savedInvoice.pendingAmount = Math.max(
      totalAmount - Number(order.paidAmount || 0),
      0,
    );

    await this.finalInvoiceRepository.save(savedInvoice);

    order.totalAmount = totalAmount;
    order.pendingAmount = Math.max(totalAmount - Number(order.paidAmount || 0), 0);

    await this.dealerOrderRepository.save(order);

    const notification = this.dealerNotificationRepository.create({
      dealerId: order.dealerId,
      dealerName: order.dealerName,
      title: 'Final Invoice Generated',
      message: `Final Invoice ${savedInvoice.invoiceNumber} generated for order ${order.orderNumber}.`,
      notificationType: 'DEALER_FINAL_INVOICE',
      createdBy: user?.id || null,
      createdByName: user?.name || user?.email || '',
    });

    await this.dealerNotificationRepository.save(notification);

    return {
      invoice: savedInvoice,
      message: 'Dealer Final Invoice generated successfully',
    };
  }

    async getDealerOrderProformaInvoice(dealerId: number, orderId: number) {
    const order = await this.dealerOrderRepository.findOne({
      where: { id: orderId, dealerId, isHidden: false },
    });

    if (!order) {
      throw new NotFoundException('Dealer order not found');
    }

    const invoice = await this.proformaInvoiceRepository.findOne({
      where: {
        dealerId,
        invoiceType: 'DEALER',
        invoiceNumber: `DPI-${order.id}`,
      } as any,
    });

    if (!invoice) {
      throw new NotFoundException('Dealer Proforma Invoice not found');
    }

    const items = await this.proformaInvoiceItemRepository.find({
      where: { proformaInvoiceId: invoice.id } as any,
      order: { createdAt: 'ASC' } as any,
    });

    return {
      order,
      invoice,
      items,
    };
  }

  async getDealerOrderFinalInvoice(dealerId: number, orderId: number) {
    const order = await this.dealerOrderRepository.findOne({
      where: { id: orderId, dealerId, isHidden: false },
    });

    if (!order) {
      throw new NotFoundException('Dealer order not found');
    }

    const invoice = await this.finalInvoiceRepository.findOne({
      where: {
        dealerId,
        invoiceType: 'DEALER',
        invoiceNumber: `DINV-${order.id}`,
      } as any,
    });

    if (!invoice) {
      throw new NotFoundException('Dealer Final Invoice not found');
    }

    const items = await this.finalInvoiceItemRepository.find({
      where: { finalInvoiceId: invoice.id } as any,
      order: { createdAt: 'ASC' } as any,
    });

    return {
      order,
      invoice,
      items,
    };
  }

    async getDealerAnalytics(dealerId: number) {
    const dealer = await this.dealerRepository.findOne({
      where: { id: dealerId, isHidden: false },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    const orders = await this.dealerOrderRepository.find({
      where: { dealerId, isHidden: false },
      order: { createdAt: 'DESC' },
    });

    const payments = await this.dealerPaymentRepository.find({
      where: { dealerId },
      order: { createdAt: 'DESC' },
    });

    const monthlyRequirements =
      await this.dealerMonthlyRequirementRepository.find({
        where: { dealerId, isHidden: false },
        order: { createdAt: 'DESC' },
      });

    const totalOrderValue = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    );

    const paidAmount = orders.reduce(
      (sum, order) => sum + Number(order.paidAmount || 0),
      0,
    );

    const pendingAmount = orders.reduce(
      (sum, order) => sum + Number(order.pendingAmount || 0),
      0,
    );

    const creditPendingAmount = orders
      .filter((order) => order.paymentType === ProjectDealerPaymentType.CREDIT)
      .reduce((sum, order) => sum + Number(order.pendingAmount || 0), 0);

    const ordersByStatus = orders.reduce((acc: any, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const paymentsByStatus = payments.reduce((acc: any, payment: any) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {});

    const monthlyRequirementSummary = monthlyRequirements.reduce(
      (acc: any, item: any) => {
        const key = item.requirementMonth || 'UNKNOWN';

        if (!acc[key]) {
          acc[key] = {
            requirementMonth: key,
            totalMaterials: 0,
            totalExpectedQuantity: 0,
          };
        }

        acc[key].totalMaterials += 1;
        acc[key].totalExpectedQuantity += Number(item.expectedQuantity || 0);

        return acc;
      },
      {},
    );

    return {
      dealer,
      totalOrders: orders.length,
      totalOrderValue,
      paidAmount,
      pendingAmount,
      creditPendingAmount,
      totalPayments: payments.length,
      totalMonthlyRequirements: monthlyRequirements.length,
      ordersByStatus,
      paymentsByStatus,
      monthlyRequirementSummary: Object.values(monthlyRequirementSummary),
      recentOrders: orders.slice(0, 10),
      recentPayments: payments.slice(0, 10),
    };
  }

      async generateDealerProformaInvoicePdf(
    dealerId: number,
    invoiceId: number,
    res: any,
  ) {
    const invoiceData: any = await this.projectService.getProformaInvoiceById(
      invoiceId,
    );

    if (!invoiceData?.id) {
      throw new NotFoundException('Proforma invoice not found');
    }

    const invoiceDealerId = Number(
      invoiceData.dealerId ||
        invoiceData.customerId ||
        invoiceData.partyId ||
        0,
    );

    if (invoiceDealerId && invoiceDealerId !== Number(dealerId)) {
      throw new UnauthorizedException('This invoice does not belong to dealer');
    }

    return this.projectService.generateProformaInvoicePdf(invoiceId, res);
  }

  async generateDealerFinalInvoicePdf(
    dealerId: number,
    invoiceId: number,
    res: any,
  ) {
    const invoiceData: any = await this.projectService.getFinalInvoiceById(
      invoiceId,
    );

    if (!invoiceData?.id) {
      throw new NotFoundException('Final invoice not found');
    }

    const invoiceDealerId = Number(
      invoiceData.dealerId ||
        invoiceData.customerId ||
        invoiceData.partyId ||
        0,
    );

    if (invoiceDealerId && invoiceDealerId !== Number(dealerId)) {
      throw new UnauthorizedException('This invoice does not belong to dealer');
    }

    return this.projectService.generateFinalInvoicePdf(invoiceId, res);
  }

        async getDealerOrderInvoicesForPortal(dealerId: number, orderId: number) {
  const order = await this.dealerOrderRepository.findOne({
    where: {
      id: orderId,
      dealerId,
      isHidden: false,
    },
  });

  if (!order) {
    throw new NotFoundException('Dealer order not found');
  }

  const orderText = order.orderNumber || `DO-${order.id}`;
  const searchText = `Generated from dealer order ${orderText}`;

  const proformaInvoices = await this.proformaInvoiceRepository
    .createQueryBuilder('pi')
    .where('pi.dealerId = :dealerId', { dealerId })
    .andWhere('pi.invoiceType = :invoiceType', { invoiceType: 'DEALER' })
    .andWhere('pi.isHidden = false')
    .andWhere(
      '(pi.invoiceNumber = :invoiceNumber OR pi.remarks LIKE :remarks)',
      {
        invoiceNumber: `DPI-${order.id}`,
        remarks: `%${searchText}%`,
      },
    )
    .orderBy('pi.createdAt', 'DESC')
    .getMany();

  const finalInvoices = await this.finalInvoiceRepository
    .createQueryBuilder('invoice')
    .where('invoice.dealerId = :dealerId', { dealerId })
    .andWhere('invoice.invoiceType = :invoiceType', {
      invoiceType: 'DEALER',
    })
    .andWhere('invoice.isHidden = false')
    .andWhere(
      '(invoice.invoiceNumber = :invoiceNumber OR invoice.remarks LIKE :remarks)',
      {
        invoiceNumber: `DINV-${order.id}`,
        remarks: `%${searchText}%`,
      },
    )
    .orderBy('invoice.createdAt', 'DESC')
    .getMany();

  return {
    proformaInvoices,
    finalInvoices,
  };
}

private calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((earthRadiusKm * c).toFixed(2));
}

private extractCoordinatesFromGpsUrl(value: string) {
  const text = String(value || '').trim();

  if (!text) {
    return { latitude: 0, longitude: 0 };
  }

  const qMatch = text.match(/[?&]q=(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);

  if (qMatch) {
    return {
      latitude: Number(qMatch[1]),
      longitude: Number(qMatch[3]),
    };
  }

  const atMatch = text.match(/@(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);

  if (atMatch) {
    return {
      latitude: Number(atMatch[1]),
      longitude: Number(atMatch[3]),
    };
  }

  const plainMatch = text.match(/(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);

  if (plainMatch) {
    return {
      latitude: Number(plainMatch[1]),
      longitude: Number(plainMatch[3]),
    };
  }

  return { latitude: 0, longitude: 0 };
}

private calculateDeliveryChargeFromSetting(
  distanceKm: number,
  setting: any,
) {
  const baseKm = Number(setting?.baseKm || 0);
  const baseCharge = Number(setting?.baseCharge || 0);
  const perKmCharge = Number(setting?.perKmCharge || 0);

  if (distanceKm <= 0) {
    return 0;
  }

  if (distanceKm <= baseKm) {
    return baseCharge;
  }

  const extraKm = distanceKm - baseKm;

  return Math.round(baseCharge + extraKm * perKmCharge);
}
}