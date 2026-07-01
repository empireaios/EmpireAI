import { apiRequest } from "@/api/client";

export type ExplorationDimension =
  | "country"
  | "marketplace"
  | "supplier"
  | "category"
  | "product";

export interface CommercialExplorerItem {
  itemId: string;
  dimension: ExplorationDimension;
  name: string;
  summary: string;
  revenueUsd: number;
  profitUsd: number;
  readinessScore: number;
  recommendation: string;
  evidence: string;
}

export interface CommercialExplorerDashboard {
  moduleId: string;
  missionId: string;
  workspaceId: string;
  companyId: string;
  dimensions: ExplorationDimension[];
  items: CommercialExplorerItem[];
  topRecommendations: string[];
  reusedModules: string[];
  architectureComplete: boolean;
  computedAt: string;
}

export async function fetchCommercialExplorerDashboard(companyId: string) {
  return apiRequest<{ dashboard: CommercialExplorerDashboard }>("/commercial-explorer/dashboard", {
    params: { companyId },
  });
}
