import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../../execution/brand-genesis/models/brand-profile.js";
import type { DeploymentStatus } from "../../../execution/store-deployment-pipeline/models/deployment-status.js";
import type { StoreBlueprint } from "../../../execution/store-blueprint/models/store-blueprint.js";
import type { CampaignGenesisRecord } from "../../../execution/marketing-campaign-genesis/models/campaign-genesis-record.js";
import type { PortfolioEntry } from "../../opportunity-portfolio/models/portfolio-entry.js";
import type { CapitalAllocation } from "../../capital-allocation-intelligence/models/capital-allocation.js";
import type { SupplierConnectorRecord } from "../../../suppliers/supplier-connector-framework/models/supplier-connector-record.js";
import type { DashboardBrandSection } from "../models/dashboard-brand.js";
import type { DashboardCampaignSection } from "../models/dashboard-campaign.js";
import type { DashboardCapitalSection } from "../models/dashboard-capital.js";
import type { DashboardDeploymentSection } from "../models/dashboard-deployment.js";
import type { DashboardOpportunitySection } from "../models/dashboard-opportunity.js";
import type { DashboardRevenueSection } from "../models/dashboard-revenue.js";
import type { DashboardStoreSection } from "../models/dashboard-store.js";
import type { DashboardSupplierSection } from "../models/dashboard-supplier.js";
import type { FounderCommandCenterCreateInput } from "../models/founder-command-center.js";
import type {
  FounderCommandSignal,
  FounderCommandSignalType,
} from "../models/founder-command-signal.js";

export const FOUNDER_COMMAND_SIGNAL_WEIGHTS: Record<FounderCommandSignalType, number> = {
  opportunity_coverage: 0.14,
  brand_readiness: 0.12,
  store_pipeline: 0.12,
  supplier_health: 0.1,
  campaign_momentum: 0.1,
  capital_efficiency: 0.14,
  revenue_trajectory: 0.14,
  deployment_readiness: 0.1,
  dashboard_composite: 0.04,
};

export type FounderCommandOpportunityInput = Pick<
  PortfolioEntry,
  | "entryId"
  | "productId"
  | "opportunityType"
  | "state"
  | "portfolioScore"
  | "capitalPriority"
  | "riskLevel"
>;

export type FounderCommandBrandInput = Pick<
  BrandProfile,
  "brandId" | "brandName" | "niche" | "confidence" | "opportunityId" | "productId"
>;

export type FounderCommandStoreInput = Pick<
  StoreBlueprint,
  "storeId" | "brandId" | "confidence"
> & {
  pageCount?: number;
  status?: "BLUEPRINT" | "ASSEMBLED" | "DEPLOYED";
};

export type FounderCommandSupplierInput = Pick<
  SupplierConnectorRecord,
  "recordId" | "supplierConnector" | "supplierHealth" | "confidence"
>;

export type FounderCommandCampaignInput = Pick<
  CampaignGenesisRecord,
  "campaignId" | "campaignName" | "brandId" | "confidence" | "adAngles" | "platformRecommendations"
>;

export type FounderCommandCapitalInput = Pick<
  CapitalAllocation,
  | "allocationId"
  | "productId"
  | "portfolioState"
  | "allocationAmount"
  | "allocationPercentage"
  | "confidence"
  | "totalCapital"
>;

export type FounderCommandRevenueInput = {
  totalRevenue?: number;
  netProfit?: number;
  cashAvailable?: number;
  pendingAdvertising?: number;
  currency?: string;
};

export type FounderCommandDeploymentInput = {
  recordId: string;
  storeId: string;
  deploymentStatus: DeploymentStatus;
  hostingTarget: string;
  confidence: number;
};

export type FounderCommandCenterInput = {
  opportunities?: FounderCommandOpportunityInput[];
  brands?: FounderCommandBrandInput[];
  stores?: FounderCommandStoreInput[];
  suppliers?: FounderCommandSupplierInput[];
  campaigns?: FounderCommandCampaignInput[];
  capitalAllocations?: FounderCommandCapitalInput[];
  revenue?: FounderCommandRevenueInput;
  deployments?: FounderCommandDeploymentInput[];
};

export type FounderCommandCenterBreakdown = FounderCommandCenterCreateInput & {
  companyCount: number;
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildSignal(
  signalType: FounderCommandSignalType,
  score: number,
  detail: string,
): FounderCommandSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: FOUNDER_COMMAND_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function buildOpportunitySection(
  opportunities: FounderCommandOpportunityInput[],
): DashboardOpportunitySection {
  const items = opportunities.map((entry) => ({
    entryId: entry.entryId,
    productId: entry.productId,
    opportunityType: entry.opportunityType,
    state: entry.state,
    portfolioScore: entry.portfolioScore,
    capitalPriority: entry.capitalPriority,
    riskLevel: entry.riskLevel,
  }));

  const activeCount = items.filter(
    (item) => item.state === "ACTIVE" || item.state === "SCALING",
  ).length;
  const scalingCount = items.filter((item) => item.state === "SCALING").length;
  const avgScore = average(items.map((item) => item.portfolioScore));
  const healthScore = clampScore(
    items.length === 0 ? 0 : avgScore * 0.6 + (activeCount / Math.max(items.length, 1)) * 40,
  );

  const summary =
    items.length === 0
      ? "No portfolio opportunities tracked yet"
      : `${items.length} opportunities — ${scalingCount} scaling, ${activeCount} active`;

  return {
    totalCount: items.length,
    activeCount,
    scalingCount,
    healthScore,
    summary,
    items,
  };
}

function buildBrandSection(brands: FounderCommandBrandInput[]): DashboardBrandSection {
  const items = brands.map((brand) => ({
    brandId: brand.brandId,
    brandName: brand.brandName,
    niche: brand.niche,
    confidence: brand.confidence,
    opportunityId: brand.opportunityId,
    productId: brand.productId,
  }));

  const averageConfidence = clampScore(average(items.map((item) => item.confidence)));
  const healthScore = clampScore(
    items.length === 0 ? 0 : averageConfidence * 0.7 + Math.min(items.length * 8, 30),
  );

  const summary =
    items.length === 0
      ? "No brands launched yet"
      : `${items.length} brands averaging ${averageConfidence}% confidence`;

  return {
    totalCount: items.length,
    averageConfidence,
    healthScore,
    summary,
    items,
  };
}

function buildStoreSection(stores: FounderCommandStoreInput[]): DashboardStoreSection {
  const items = stores.map((store) => ({
    storeId: store.storeId,
    brandId: store.brandId,
    pageCount: store.pageCount ?? 6,
    confidence: store.confidence,
    status: store.status ?? "BLUEPRINT",
  }));

  const deployedCount = items.filter((item) => item.status === "DEPLOYED").length;
  const avgConfidence = average(items.map((item) => item.confidence));
  const healthScore = clampScore(
    items.length === 0
      ? 0
      : avgConfidence * 0.5 + (deployedCount / Math.max(items.length, 1)) * 50,
  );

  const summary =
    items.length === 0
      ? "No stores in the pipeline"
      : `${items.length} stores — ${deployedCount} deployed`;

  return {
    totalCount: items.length,
    deployedCount,
    healthScore,
    summary,
    items,
  };
}

function buildSupplierSection(
  suppliers: FounderCommandSupplierInput[],
): DashboardSupplierSection {
  const items = suppliers.map((record) => ({
    connectorId: record.recordId,
    platform: record.supplierConnector.platform,
    healthState: record.supplierHealth.healthState,
    credentialsConfigured: record.supplierHealth.credentialsConfigured,
    confidence: record.confidence,
  }));

  const readyCount = items.filter((item) => item.healthState === "READY").length;
  const avgConfidence = average(items.map((item) => item.confidence));
  const healthScore = clampScore(
    items.length === 0
      ? 0
      : avgConfidence * 0.4 + (readyCount / Math.max(items.length, 1)) * 60,
  );

  const summary =
    items.length === 0
      ? "No supplier connectors configured"
      : `${items.length} suppliers — ${readyCount} ready`;

  return {
    totalCount: items.length,
    readyCount,
    healthScore,
    summary,
    items,
  };
}

function buildCampaignSection(
  campaigns: FounderCommandCampaignInput[],
): DashboardCampaignSection {
  const items = campaigns.map((campaign) => ({
    campaignId: campaign.campaignId,
    campaignName: campaign.campaignName,
    brandId: campaign.brandId,
    platformCount: campaign.platformRecommendations.length,
    adAngleCount: campaign.adAngles.length,
    confidence: campaign.confidence,
  }));

  const averageConfidence = clampScore(average(items.map((item) => item.confidence)));
  const healthScore = clampScore(
    items.length === 0 ? 0 : averageConfidence * 0.65 + Math.min(items.length * 10, 35),
  );

  const summary =
    items.length === 0
      ? "No marketing campaigns launched"
      : `${items.length} campaigns averaging ${averageConfidence}% confidence`;

  return {
    totalCount: items.length,
    averageConfidence,
    healthScore,
    summary,
    items,
  };
}

function buildCapitalSection(
  allocations: FounderCommandCapitalInput[],
): DashboardCapitalSection {
  const items = allocations.map((allocation) => ({
    allocationId: allocation.allocationId,
    productId: allocation.productId,
    portfolioState: allocation.portfolioState,
    allocationAmount: allocation.allocationAmount,
    allocationPercentage: allocation.allocationPercentage,
    confidence: allocation.confidence,
  }));

  const totalCapital = allocations[0]?.totalCapital ?? 0;
  const allocatedCapital = roundCurrency(
    items.reduce((sum, item) => sum + item.allocationAmount, 0),
  );
  const utilization =
    totalCapital > 0 ? (allocatedCapital / totalCapital) * 100 : items.length > 0 ? 100 : 0;
  const avgConfidence = average(items.map((item) => item.confidence));
  const healthScore = clampScore(
    items.length === 0 ? 0 : avgConfidence * 0.5 + Math.min(utilization, 100) * 0.5,
  );

  const summary =
    items.length === 0
      ? "No capital allocated yet"
      : `$${allocatedCapital.toLocaleString()} allocated across ${items.length} opportunities`;

  return {
    totalCapital,
    allocatedCapital,
    allocationCount: items.length,
    healthScore,
    summary,
    items,
  };
}

function buildRevenueSection(
  revenue: FounderCommandRevenueInput | undefined,
  capitalSection: DashboardCapitalSection,
): DashboardRevenueSection {
  const totalRevenue = revenue?.totalRevenue ?? capitalSection.allocatedCapital * 1.2;
  const netProfit = revenue?.netProfit ?? totalRevenue * 0.25;
  const cashAvailable = revenue?.cashAvailable ?? netProfit * 0.6;
  const pendingAdvertising = revenue?.pendingAdvertising ?? totalRevenue * 0.08;
  const currency = revenue?.currency ?? "USD";

  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const cashRatio = netProfit > 0 ? (cashAvailable / netProfit) * 100 : 0;
  const healthScore = clampScore(profitMargin * 0.5 + cashRatio * 0.3 + (totalRevenue > 0 ? 20 : 0));

  const summary =
    totalRevenue <= 0
      ? "Revenue tracking awaiting first sales"
      : `$${roundCurrency(totalRevenue).toLocaleString()} revenue, $${roundCurrency(netProfit).toLocaleString()} net profit`;

  return {
    totalRevenue: roundCurrency(totalRevenue),
    netProfit: roundCurrency(netProfit),
    cashAvailable: roundCurrency(cashAvailable),
    pendingAdvertising: roundCurrency(pendingAdvertising),
    currency,
    healthScore,
    summary,
  };
}

function buildDeploymentSection(
  deployments: FounderCommandDeploymentInput[],
): DashboardDeploymentSection {
  const items = deployments.map((deployment) => ({
    recordId: deployment.recordId,
    storeId: deployment.storeId,
    deploymentStatus: deployment.deploymentStatus,
    hostingTarget: deployment.hostingTarget,
    confidence: deployment.confidence,
  }));

  const validatedCount = items.filter(
    (item) => item.deploymentStatus === "PACKAGE_VALIDATED",
  ).length;
  const failedCount = items.filter(
    (item) => item.deploymentStatus === "PACKAGE_FAILED",
  ).length;
  const avgConfidence = average(items.map((item) => item.confidence));
  const successRate =
    items.length > 0 ? ((items.length - failedCount) / items.length) * 100 : 0;
  const healthScore = clampScore(
    items.length === 0 ? 0 : avgConfidence * 0.4 + successRate * 0.6,
  );

  const summary =
    items.length === 0
      ? "No deployment packages prepared"
      : `${items.length} packages — ${validatedCount} validated, ${failedCount} failed`;

  return {
    totalCount: items.length,
    validatedCount,
    failedCount,
    healthScore,
    summary,
    items,
  };
}

function computeCompanyCount(input: FounderCommandCenterInput): number {
  const brandIds = new Set(input.brands?.map((brand) => brand.brandId) ?? []);
  const storeBrandIds = new Set(input.stores?.map((store) => store.brandId) ?? []);
  for (const brandId of storeBrandIds) {
    brandIds.add(brandId);
  }
  return Math.max(brandIds.size, input.brands?.length ?? 0, input.stores?.length ?? 0, 1);
}

/** Synthesizes the Grand King founder command center dashboard from upstream module data. */
export function generateFounderCommandCenter(
  input: FounderCommandCenterInput,
): FounderCommandCenterBreakdown {
  const opportunities = buildOpportunitySection(input.opportunities ?? []);
  const brands = buildBrandSection(input.brands ?? []);
  const stores = buildStoreSection(input.stores ?? []);
  const suppliers = buildSupplierSection(input.suppliers ?? []);
  const campaigns = buildCampaignSection(input.campaigns ?? []);
  const capitalAllocation = buildCapitalSection(input.capitalAllocations ?? []);
  const revenueTracking = buildRevenueSection(input.revenue, capitalAllocation);
  const deploymentStatus = buildDeploymentSection(input.deployments ?? []);

  const sectionScores = [
    opportunities.healthScore,
    brands.healthScore,
    stores.healthScore,
    suppliers.healthScore,
    campaigns.healthScore,
    capitalAllocation.healthScore,
    revenueTracking.healthScore,
    deploymentStatus.healthScore,
  ];

  const signals: FounderCommandSignal[] = [
    buildSignal(
      "opportunity_coverage",
      opportunities.healthScore,
      opportunities.summary,
    ),
    buildSignal("brand_readiness", brands.healthScore, brands.summary),
    buildSignal("store_pipeline", stores.healthScore, stores.summary),
    buildSignal("supplier_health", suppliers.healthScore, suppliers.summary),
    buildSignal("campaign_momentum", campaigns.healthScore, campaigns.summary),
    buildSignal(
      "capital_efficiency",
      capitalAllocation.healthScore,
      capitalAllocation.summary,
    ),
    buildSignal(
      "revenue_trajectory",
      revenueTracking.healthScore,
      revenueTracking.summary,
    ),
    buildSignal(
      "deployment_readiness",
      deploymentStatus.healthScore,
      deploymentStatus.summary,
    ),
  ];

  const weightedScore = signals.reduce(
    (sum, signal) => sum + signal.score * signal.weight,
    0,
  );
  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
  const confidence = clampScore(totalWeight > 0 ? weightedScore / totalWeight : 0);

  signals.push(
    buildSignal(
      "dashboard_composite",
      confidence,
      `Founder dashboard composite across ${sectionScores.filter((score) => score > 0).length} active sections`,
    ),
  );

  return {
    opportunities,
    brands,
    stores,
    suppliers,
    campaigns,
    capitalAllocation,
    revenueTracking,
    deploymentStatus,
    confidence,
    signals,
    companyCount: computeCompanyCount(input),
  };
}

export const founderCommandCenterScoring = {
  generateFounderCommandCenter,
  signalWeights: FOUNDER_COMMAND_SIGNAL_WEIGHTS,
};
