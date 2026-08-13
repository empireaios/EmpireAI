/**
 * Shared executive truth types (no runtime side effects).
 */

export type TruthClass = "CURRENT_VERIFIED" | "HISTORICAL" | "ESTIMATED" | "UNKNOWN";

export type ExecutiveTruthSnapshot = {
  computedAt: string;
  workspaceId: string;
  provenance: "live_sqlite_commissioning_kpi_birth";
  product: {
    commissioningId: string | null;
    asin: string | null;
    productName: string | null;
    supplier: string | null;
    marketplace: string | null;
    selectionAuthority: string | null;
    cursorSelected: boolean | null;
    stage: string | null;
    pillowRecommendation: string | null;
    truthClass: TruthClass;
  };
  financial: {
    orders: number;
    realisedRevenueUsd: number;
    buyableListings: number;
    publishedListings: number;
    expectedProfitDisplay: string | null;
    expectedProfitTruthClass: TruthClass;
    realisedTruthClass: TruthClass;
  };
  birth: {
    status: string;
    technicallyReady: boolean;
    birthTimestamp: string | null;
    gatesPassedCount: number;
    gatesTotal: number;
    truthClass: TruthClass;
  };
  deploy: {
    gitCommitSha: string | null;
    serviceOnlineHint: "assume_online_if_answering";
    truthClass: TruthClass;
  };
  authority: {
    pillowMayPublish: false;
    pillowMaySupplierSpend: false;
    pillowMayAuthoriseBirth: false;
    pillowMayExecuteProductionDeploy: false;
    chatHasToolCallingLoop: false;
    executableNow: string[];
    requiresGrandKing: string[];
    truthClass: TruthClass;
  };
  demandEvidence: string;
  notes: string[];
};

export type GroundingEnforcementResult = {
  message: string;
  adjusted: boolean;
  violations: string[];
};
