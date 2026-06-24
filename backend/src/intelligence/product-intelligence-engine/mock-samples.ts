import type { ProductIntelligenceInput } from "./types.js";

/** Mock evaluation catalog — deterministic sample products, no paid APIs. */
export const PIE_MOCK_EVALUATIONS: ProductIntelligenceInput[] = [
  {
    productTitle: "Portable USB Blender",
    category: "Kitchen & Dining",
    supplierData: {
      supplierId: "sup-cj-001",
      name: "CJDropshipping",
      region: "CN",
      reliabilityScore: 82,
      avgShipDays: 10,
      defectRatePct: 2.5,
    },
    purchasePriceCents: 850,
    estimatedSellingPriceCents: 2999,
    shippingCostCents: 450,
    historicalDemand: {
      searchVolumeIndex: 88,
      trendDirection: "rising",
      monthlyOrdersEstimate: 4200,
      seasonalityIndex: 72,
    },
    competitionScore: 62,
  },
  {
    productTitle: "Mystery Gadget Bundle",
    category: "Electronics",
    supplierData: {
      supplierId: "sup-ali-001",
      name: "AliExpress Direct",
      region: "CN",
      reliabilityScore: 48,
      avgShipDays: 22,
      defectRatePct: 12,
    },
    purchasePriceCents: 1200,
    estimatedSellingPriceCents: 1499,
    shippingCostCents: 650,
    historicalDemand: {
      searchVolumeIndex: 22,
      trendDirection: "falling",
      monthlyOrdersEstimate: 180,
      seasonalityIndex: 25,
    },
    competitionScore: 88,
  },
  {
    productTitle: "Posture Corrector Brace",
    category: "Health & Wellness",
    supplierData: {
      supplierId: "sup-spocket-001",
      name: "Spocket US/EU",
      region: "US",
      reliabilityScore: 91,
      avgShipDays: 5,
      defectRatePct: 3,
    },
    purchasePriceCents: 420,
    estimatedSellingPriceCents: 1999,
    shippingCostCents: 280,
    historicalDemand: {
      searchVolumeIndex: 71,
      trendDirection: "stable",
      monthlyOrdersEstimate: 2100,
      seasonalityIndex: 55,
    },
    competitionScore: 55,
  },
  {
    productTitle: "Pet Hair Remover Roller",
    category: "Pet Supplies",
    supplierData: {
      supplierId: "sup-zendrop-001",
      name: "Zendrop Premium",
      region: "US",
      reliabilityScore: 88,
      avgShipDays: 6,
      defectRatePct: 1.8,
    },
    purchasePriceCents: 210,
    estimatedSellingPriceCents: 1499,
    shippingCostCents: 190,
    historicalDemand: {
      searchVolumeIndex: 92,
      trendDirection: "rising",
      monthlyOrdersEstimate: 5800,
      seasonalityIndex: 68,
    },
    competitionScore: 45,
  },
  {
    productTitle: "Generic Phone Case",
    category: "Accessories",
    supplierData: {
      supplierId: "sup-ali-001",
      name: "AliExpress Direct",
      region: "CN",
      reliabilityScore: 71,
      avgShipDays: 16,
      defectRatePct: 5,
    },
    purchasePriceCents: 180,
    estimatedSellingPriceCents: 899,
    shippingCostCents: 120,
    historicalDemand: {
      searchVolumeIndex: 55,
      trendDirection: "stable",
      monthlyOrdersEstimate: 900,
      seasonalityIndex: 48,
    },
    competitionScore: 78,
  },
];

export function buildMockEvaluationInput(
  index = 0,
  workspaceId?: string,
  productId?: string,
): ProductIntelligenceInput {
  const sample = PIE_MOCK_EVALUATIONS[index % PIE_MOCK_EVALUATIONS.length];
  if (!sample) {
    throw new Error("No PIE mock evaluation samples configured");
  }
  return {
    ...sample,
    workspaceId,
    productId,
  };
}

export function listMockEvaluationCatalog(): ReadonlyArray<
  Pick<ProductIntelligenceInput, "productTitle" | "category">
> {
  return PIE_MOCK_EVALUATIONS.map(({ productTitle, category }) => ({
    productTitle,
    category,
  }));
}
