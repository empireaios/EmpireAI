export type SupplierRecord = {
  id: string;
  name: string;
  region: string;
  connectorId: string;
  productCount: number;
  avgUnitCostCents: number;
  avgShipDays: number;
  reliabilityScore: number;
  status: "active" | "paused" | "deprecated";
};

export type SupplierCostProfile = {
  supplierId: string;
  unitCostCents: number;
  shippingPerOrderCents: number;
  estimatedMonthlyCostCents: number;
  marginImpactPct: number;
  currency: string;
};

export type SupplierRecommendation = "preferred" | "approved" | "conditional" | "avoid";

export type SupplierIntelligenceScore = {
  supplierId: string;
  supplierName: string;
  workspaceId: string;
  reliabilityScore: number;
  costEfficiencyScore: number;
  shippingSpeedScore: number;
  catalogDepthScore: number;
  compositeScore: number;
  costProfile: SupplierCostProfile;
  recommendation: SupplierRecommendation;
  why: string[];
  scoredAt: string;
};
