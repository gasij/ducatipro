export const ORDER_PROCESSING_FEE_EUR = 15;

type DeliveryTier = {maxWeightKg: number; priceEur: number};

const DELIVERY_TIERS: DeliveryTier[] = [
  {maxWeightKg: 20, priceEur: 29},
  {maxWeightKg: 40, priceEur: 39},
  {maxWeightKg: 100, priceEur: 59},
  {maxWeightKg: 150, priceEur: 79},
  {maxWeightKg: 200, priceEur: 129},
  {maxWeightKg: 250, priceEur: 159},
  {maxWeightKg: 300, priceEur: 179},
  {maxWeightKg: 400, priceEur: 229},
  {maxWeightKg: 500, priceEur: 249},
  {maxWeightKg: 600, priceEur: 289},
];

const HEAVIEST_TIER = DELIVERY_TIERS[DELIVERY_TIERS.length - 1];

export function calculateDeliveryPriceEur(totalWeightKg: number) {
  const safeWeight = Number.isFinite(totalWeightKg) ? Math.max(0, totalWeightKg) : 0;
  const tier = DELIVERY_TIERS.find((tier) => safeWeight <= tier.maxWeightKg);

  return (tier || HEAVIEST_TIER).priceEur;
}
