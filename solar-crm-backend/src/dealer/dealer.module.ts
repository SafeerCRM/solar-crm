import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DealerService } from './dealer.service';
import { DealerController } from './dealer.controller';

import { Dealer } from './dealer.entity';
import { DealerComplaint } from './dealer-complaint.entity';
import { DealerCompanyBankDetail } from './dealer-company-bank-detail.entity';

import { ProjectMaterialMaster } from '../project/project-material-master.entity';
import { ProjectStockItem } from '../project/project-stock-item.entity';
import { ProjectDealerOrder } from '../project/project-dealer-order.entity';
import { ProjectDealerOrderItem } from '../project/project-dealer-order-item.entity';
import { ProjectDealerPayment } from '../project/project-dealer-payment.entity';
import { ProjectDealerComment } from '../project/project-dealer-comment.entity';
import { ProjectDealerNotification } from '../project/project-dealer-notification.entity';
import { ProjectDealerMonthlyRequirement } from '../project/project-dealer-monthly-requirement.entity';
import { User } from '../users/user.entity';
import { DealerAuthController } from './dealer-auth.controller';
import { ProjectProformaInvoice } from '../project/project-proforma-invoice.entity';
import { ProjectProformaInvoiceItem } from '../project/project-proforma-invoice-item.entity';
import { ProjectFinalInvoice } from '../project/project-final-invoice.entity';
import { ProjectFinalInvoiceItem } from '../project/project-final-invoice-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Dealer,
      DealerComplaint,
      DealerCompanyBankDetail,
      ProjectMaterialMaster,
      ProjectStockItem,
      ProjectDealerOrder,
      ProjectDealerOrderItem,
      ProjectDealerPayment,
      ProjectDealerComment,
      ProjectDealerNotification,
      ProjectDealerMonthlyRequirement,
      User,
      ProjectProformaInvoice,
ProjectProformaInvoiceItem,
ProjectFinalInvoice,
ProjectFinalInvoiceItem,
    ]),
  ],
  providers: [DealerService],
  controllers: [DealerController, DealerAuthController],
})
export class DealerModule {}