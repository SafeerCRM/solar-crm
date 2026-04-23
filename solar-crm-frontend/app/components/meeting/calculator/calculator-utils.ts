export const toNumber = (value: string | number | null | undefined) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const calculatePanelCost = (
  ratePerWatt: number,
  numberOfPanels: number,
  wattPerPanel: number
) => {
  if (!ratePerWatt || !numberOfPanels || !wattPerPanel) return 0;
  return ratePerWatt * 1.05 * numberOfPanels * wattPerPanel;
};

export const calculateSimpleLineTotal = (
  quantity: number,
  rate: number
) => {
  if (!quantity || !rate) return 0;
  return quantity * rate;
};

export const calculateTransportationCost = (distanceKm: number) => {
  if (!distanceKm) return 0;
  return distanceKm * 50;
};

export const formatCurrency = (value: number) => {
  return value.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
};