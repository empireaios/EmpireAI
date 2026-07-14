/** P8-02 — Commerce Operating Model frontend types (mirrors Pillow PILLOW-COM-001). */

export type CommerceOperatingModel = {
  architectureVersion: "P8-02";
  computedAt: string;
  grandKingSummary: string;
  commerceHealth: string;
  activeBusinessCount: number;
  liveBusinessCount: number;
  businesses: Array<{
    id: string;
    name: string;
    lifecycleStage: string;
    pipelinePhase: string;
    progressPercent: number;
    commerceHealth: string;
    revenue: string;
    profit: string;
    growthTrend: string;
  }>;
  brands: Array<{ id: string; name: string; businessId: string; positioning: string }>;
  stores: Array<{ id: string; name: string; businessId: string; status: string; url: string | null }>;
  products: Array<{
    id: string;
    name: string;
    businessId: string;
    category: string;
    marginPercent: number;
    supplierId: string | null;
  }>;
  orders: Array<{ id: string; businessId: string; status: string; revenue: string; fulfilment: string }>;
  revenueSummary: string;
  profitSummary: string;
  marketingSummary: string;
  growthTrends: string[];
  currentOpportunities: string[];
  currentRisks: string[];
  pipeline: Array<{ phase: string; label: string; order: number; status: string }>;
  principles: string[];
  capabilities: string[];
  lifecycle: string[];
  revenueModel: {
    streams: Array<{ id: string; label: string; status: string; summary: string }>;
    allocation: string;
    reporting: string;
    totalRevenue: string;
    totalProfit: string;
  };
  pillow: {
    opportunities: string[];
    risks: string[];
    performance: string[];
    revenueTrends: string[];
    profitTrends: string[];
    marketingPerformance: string[];
    growthOpportunities: string[];
  };
  factoryIntegration: {
    factoryStage: string;
    factoryProgressPercent: number;
    factoryBusinessCount: number;
  };
};
