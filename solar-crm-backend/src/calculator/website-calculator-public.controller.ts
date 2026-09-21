import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { CalculatorService } from './calculator.service';

@Controller('public/calculator')
export class WebsiteCalculatorPublicController {
  constructor(
    private readonly calculatorService: CalculatorService,
  ) {}

  /*
   * Public configuration needed when the website first loads.
   *
   * IMPORTANT:
   * Never return the complete WebsiteCalculatorSetting entity
   * or internal CRM calculator settings from this endpoint.
   */
  @Get('config')
  async getPublicConfig() {
    const settings =
      await this.calculatorService.getWebsiteCalculatorSettings();

    const enabled = Boolean(settings.isEnabled);

return {
  calculatorEnabled: enabled,

  allowElectricityRateEdit: enabled
    ? Boolean(settings.allowElectricityRateEdit)
    : false,

  defaultElectricityRate: enabled
    ? Number(settings.defaultElectricityRate || 0)
    : 0,

  disclaimer: enabled
    ? String(settings.disclaimer || '')
    : '',
};
  }

  /*
   * Public solar estimate.
   *
   * Response is already sanitized inside CalculatorService.
   */
  @Post('calculate')
  async calculate(@Body() body: any) {
    return this.calculatorService.calculateWebsiteSolarEstimate(
      body,
    );
  }
}