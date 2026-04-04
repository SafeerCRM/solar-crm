import { Injectable } from '@nestjs/common';

@Injectable()
export class CalculatorService {
  calculateProjectCost(data: any) {
    const ratePerWatt = Number(data?.panel?.ratePerWatt || 0);
    const numberOfPanels = Number(data?.panel?.numberOfPanels || 0);
    const wattPerPanel = Number(data?.panel?.wattPerPanel || 0);

    const inverterCost = Number(data?.inverter?.cost || 0);
    const structureCost = Number(data?.structure?.cost || 0);
    const electricalCost = Number(data?.electrical?.cost || 0);
    const marginAmount = Number(data?.marginAmount || 0);

    const distanceKm = Number(data?.transportation?.distanceKm || 0);
    const transportationCost = distanceKm * 50;

    const electricityDepartmentCost = Number(
      data?.electricityDepartmentCost || 0,
    );

    // Panel formula:
    // (rate/watt) * 1.05(GST) * no. of panel * watts of single panel
    const panelCost =
      ratePerWatt * 1.05 * numberOfPanels * wattPerPanel;

    const totalProjectCost =
      panelCost +
      inverterCost +
      structureCost +
      electricalCost +
      marginAmount +
      transportationCost +
      electricityDepartmentCost;

    return {
      input: data,
      breakdown: {
        panelCost,
        inverterCost,
        structureCost,
        electricalCost,
        marginAmount,
        transportationCost,
        electricityDepartmentCost,
      },
      totalProjectCost,
    };
  }
}