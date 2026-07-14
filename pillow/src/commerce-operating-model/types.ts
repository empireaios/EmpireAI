/** PILLOW-COM-001 — Commerce Operating Model types (P8-02). */

import type {
  COMMERCE_PIPELINE,
  COMMERCE_PRINCIPLES,
  COMMERCE_CAPABILITIES,
  REVENUE_STREAMS,
  COMMERCE_BUSINESS_LIFECYCLE,
} from "./paths.js";

export type CommerceOperatingModelVersion = "P8-02";

export type CommercePipelinePhase = (typeof COMMERCE_PIPELINE)[number];
export type CommercePrinciple = (typeof COMMERCE_PRINCIPLES)[number];
export type CommerceCapability = (typeof COMMERCE_CAPABILITIES)[number];
export type RevenueStream = (typeof REVENUE_STREAMS)[number];
export type CommerceBusinessLifecycleStage = (typeof COMMERCE_BUSINESS_LIFECYCLE)[number];

export type CommerceBrandRecord = {
  id: string;
  name: string;
  businessId: string;
  positioning: string;
};

export type CommerceStoreRecord = {
  id: string;
  name: string;
  businessId: string;
  status: string;
  url: string | null;
};

export type CommerceProductRecord = {
  id: string;
  name: string;
  businessId: string;
  category: string;
  marginPercent: number;
  supplierId: string | null;
};

export type CommerceOrderRecord = {
  id: string;
  businessId: string;
  status: string;
  revenue: string;
  fulfilment: string;
};

export type CommerceBusinessRecord = {
  id: string;
  name: string;
  lifecycleStage: CommerceBusinessLifecycleStage;
  pipelinePhase: CommercePipelinePhase;
  progressPercent: number;
  commerceHealth: string;
  revenue: string;
  profit: string;
  growthTrend: string;
};

export type CommercePipelineStageView = {
  phase: CommercePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type CommerceRevenueModel = {
  streams: Array<{ id: RevenueStream; label: string; status: string; summary: string }>;
  allocation: string;
  reporting: string;
  totalRevenue: string;
  totalProfit: string;
};

export type CommercePillowAnalysis = {
  opportunities: string[];
  risks: string[];
  performance: string[];
  revenueTrends: string[];
  profitTrends: string[];
  marketingPerformance: string[];
  growthOpportunities: string[];
};

export type CommerceOperatingModel = {
  architectureVersion: CommerceOperatingModelVersion;
  computedAt: string;
  grandKingSummary: string;
  commerceHealth: string;
  activeBusinessCount: number;
  liveBusinessCount: number;
  businesses: CommerceBusinessRecord[];
  brands: CommerceBrandRecord[];
  stores: CommerceStoreRecord[];
  products: CommerceProductRecord[];
  orders: CommerceOrderRecord[];
  revenueSummary: string;
  profitSummary: string;
  marketingSummary: string;
  growthTrends: string[];
  currentOpportunities: string[];
  currentRisks: string[];
  pipeline: CommercePipelineStageView[];
  principles: CommercePrinciple[];
  capabilities: CommerceCapability[];
  lifecycle: CommerceBusinessLifecycleStage[];
  revenueModel: CommerceRevenueModel;
  pillow: CommercePillowAnalysis;
  factoryIntegration: {
    factoryStage: string;
    factoryProgressPercent: number;
    factoryBusinessCount: number;
  };
};
