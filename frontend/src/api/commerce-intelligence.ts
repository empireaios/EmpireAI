import { apiRequest } from "@/api/client";

export type CommerceRoute = "marketplace" | "shopify";

export type QueueEntry = {
  candidateId: string;
  title: string;
  category: string;
  status: string;
  confidenceScore: number;
  commercialScore: number;
  netMarginPercent: number;
  route: CommerceRoute;
  rejectionReason?: string;
  deferReason?: string;
  missionId?: string;
  updatedAt: string;
};

export type ProductLaunchMission = {
  missionId: string;
  status: string;
  proposalReadiness: "READY" | "NOT_READY";
  commercialScore: number;
  route: CommerceRoute;
  confidenceScore: number;
  expectedMarginPercent: number;
  expectedNetProfitRangeUsd: { min: number; max: number };
  launchBudgetUsd: number;
  keyRisks: string[];
  whyThisProduct: string;
  whyThisMarket: string;
  whyNow: string;
  recommendation: string;
  whyEvidence: string[];
  kingApproved: boolean;
  supplierIntelligence?: {
    viabilityScore: number;
    supplyRisk: string;
    fulfilmentReadiness: boolean;
  };
  creative: {
    title: string;
    bulletPoints: string[];
    productDescription: string;
    amazonListingCopy: string;
    shopifyBrandCopy: string;
    adHooks: string[];
    metaAdCopy: string;
    tiktokScript: string;
    positioningAngle: string;
    mediaReadiness: string;
    creativePackageStatus: string;
  };
  ceoLens: {
    overallScore: number;
    passes: boolean;
    summary: string;
    evidence: string[];
  };
  ctoLens: {
    overallScore: number;
    passes: boolean;
    monitoringReady: boolean;
    summary: string;
    evidence: string[];
  };
  product: {
    title: string;
    category: string;
    supplierCostUsd: number;
    images: string[];
  };
  arbitrage: {
    expectedSellingPriceUsd: number;
    estimatedNetMarginPercent: number;
    arbitrageScore: number;
  };
  productFit: {
    route: CommerceRoute;
    routeRationale: string;
    buyerPersona: string;
    productFitScore: number;
    seasonality: string;
  };
};

export type FollowUpMission = {
  followUpId: string;
  missionId: string;
  type: string;
  title: string;
  rationale: string;
  status: string;
  approvalRequired: true;
};

export type PerformanceSnapshot = {
  snapshotId: string;
  sales: number;
  revenueUsd: number;
  roas: number;
  netProfitUsd: number;
  reviewScore: number;
  computedAt: string;
};

export type LaunchStatusEntry = {
  missionId: string;
  title: string;
  route: CommerceRoute;
  status: string;
  gkrProductId?: string;
  lastEvent: string;
  updatedAt: string;
};

export type CommerceIntelligenceDashboard = {
  summary: string;
  queue: {
    total: number;
    shortlisted: number;
    rejected: number;
    deferred: number;
    missionReady: number;
  };
  missions: {
    pendingReview: number;
    approved: number;
    live: number;
    blocked: number;
    monitoring: number;
  };
  followUpMissions: {
    pendingApproval: number;
    total: number;
  };
  lastPullAt: string | null;
};

export async function fetchCommerceIntelligenceDashboard(companyId = "co-grand-king") {
  return apiRequest<{ dashboard: CommerceIntelligenceDashboard }>(
    "/commerce-intelligence-core/dashboard",
    { params: { companyId } },
  );
}

export async function fetchProductIntelligenceQueue() {
  return apiRequest<{ queue: QueueEntry[]; total: number }>("/commerce-intelligence-core/queue");
}

export async function pullSupplierProducts(companyId = "co-grand-king", keyword?: string) {
  return apiRequest<{ result: { pulled: number; missionsCreated: number; rejected: number; deferred: number; queue: QueueEntry[] } }>(
    "/commerce-intelligence-core/pull",
    { method: "POST", body: { companyId, keyword } },
  );
}

export async function fetchLaunchMissions() {
  return apiRequest<{ missions: ProductLaunchMission[]; total: number }>(
    "/commerce-intelligence-core/missions",
  );
}

export async function fetchLaunchMission(missionId: string) {
  return apiRequest<{ mission: ProductLaunchMission }>(
    `/commerce-intelligence-core/missions/${missionId}`,
  );
}

export async function decideLaunchMission(
  missionId: string,
  decision: "approve" | "reject" | "defer" | "why",
  note?: string,
) {
  return apiRequest<{ mission?: ProductLaunchMission; whyEvidence?: string[] }>(
    `/commerce-intelligence-core/missions/${missionId}/decide`,
    { method: "POST", body: { decision, note } },
  );
}

export async function executeApprovedLaunch(missionId: string) {
  return apiRequest<{ mission: ProductLaunchMission }>(
    `/commerce-intelligence-core/missions/${missionId}/execute-launch`,
    { method: "POST", body: {} },
  );
}

export async function fetchLaunchStatusEntries() {
  return apiRequest<{ entries: LaunchStatusEntry[]; total: number }>(
    "/commerce-intelligence-core/launch-status",
  );
}

export async function fetchMissionPerformance(missionId: string) {
  return apiRequest<{ snapshots: PerformanceSnapshot[]; followUps: FollowUpMission[] }>(
    `/commerce-intelligence-core/missions/${missionId}/performance`,
  );
}

export async function fetchFollowUpMissions() {
  return apiRequest<{ followUps: FollowUpMission[]; total: number }>(
    "/commerce-intelligence-core/follow-up-missions",
  );
}

export async function fetchCommercePillowContext(missionId?: string) {
  return apiRequest<{ context: Record<string, unknown> }>(
    "/commerce-intelligence-core/pillow-context",
    { params: { missionId } },
  );
}
