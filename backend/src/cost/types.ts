export type CostRiskLevel = "low" | "medium" | "high" | "critical";

export type DependencyCostRecord = {
  id: string;
  dependencyId: string;
  workspaceId: string | null;
  purpose: string;
  oneTimeCostCents: number;
  monthlyCostCents: number;
  usageBased: Record<string, unknown>;
  businessRisk: CostRiskLevel;
  technicalRisk: CostRiskLevel;
  replaceability: "easy" | "moderate" | "hard";
  backupProvider: string | null;
  metadata: Record<string, unknown>;
  updatedAt: string;
};

export type CostCatalogEntry = Omit<DependencyCostRecord, "id" | "workspaceId" | "updatedAt"> & {
  dependencyId: string;
};
