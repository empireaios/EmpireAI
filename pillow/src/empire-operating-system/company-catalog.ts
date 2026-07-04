import type { EmpireCompany } from "./types.js";

/** Active Empire portfolio — companies created from Commerce Intelligence winners. */
export const EMPIRE_PORTFOLIO: EmpireCompany[] = [
  {
    id: "CO-FITFORGE-001",
    name: "FitForge",
    brand: "FitForge — Home Fitness Essentials",
    status: "operating",
    businessModel: "DTC dropshipping — fitness accessories via CJ Fitness Tier",
    productCatalog: [
      {
        id: "PROD-007",
        name: "Resistance Bands Set (5-pack)",
        priceUsd: 29.99,
        costUsd: 9,
        marginPercent: 64,
        demandScore: 86,
      },
    ],
    pricingStrategy: "Premium value — 64% margin floor, bundle upsells at checkout",
    storeUrl: null,
    operations: {
      supplierId: "SUP-CJ-005",
      supplierName: "CJ Dropshipping — Fitness Tier",
      shippingDaysAvg: 12,
      customerServiceChannel: "email + automated FAQ",
      fulfillmentModel: "dropship",
    },
    launchPlanId: "LAUNCH-001",
    createdAt: "2026-06-01T00:00:00.000Z",
    marketIds: ["MKT-US", "MKT-UK", "MKT-SG"],
  },
  {
    id: "CO-PETJOY-001",
    name: "PetJoy",
    brand: "PetJoy — Curated Pet Wellness",
    status: "launching",
    businessModel: "DTC dropshipping — pet supplies via CJ Wellness Tier",
    productCatalog: [
      {
        id: "PROD-004",
        name: "Pet Grooming Glove",
        priceUsd: 19.99,
        costUsd: 5,
        marginPercent: 68,
        demandScore: 88,
      },
    ],
    pricingStrategy: "Smart value — competitive pricing with 65%+ margin target",
    storeUrl: null,
    operations: {
      supplierId: "SUP-CJ-001",
      supplierName: "CJ Dropshipping — Wellness Tier",
      shippingDaysAvg: 10,
      customerServiceChannel: "email + chat widget",
      fulfillmentModel: "dropship",
    },
    launchPlanId: "LAUNCH-002",
    createdAt: "2026-06-15T00:00:00.000Z",
    marketIds: ["MKT-US"],
  },
];

export function getPortfolioCompany(id: string): EmpireCompany | undefined {
  return EMPIRE_PORTFOLIO.find((c) => c.id === id);
}
