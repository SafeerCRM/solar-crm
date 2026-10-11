import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappMessage } from './whatsapp-message.entity';
import { WhatsappAutomation } from './whatsapp-automation.entity';
import { ProjectCustomerConfirmation } from '../project/project-customer-confirmation.entity';
import { ProjectCustomerConfirmationHistory } from '../project/project-customer-confirmation-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
  WhatsappMessage,
  WhatsappAutomation,
  ProjectCustomerConfirmation,
  ProjectCustomerConfirmationHistory,
]),
  ],

  controllers: [WhatsappController],

  providers: [WhatsappService],

  exports: [WhatsappService],
})
export class WhatsappModule {}