import type { GrandKingsRevenueCycleRecord } from "../models/grand-kings-revenue-cycle-record.js";
import type { GrandKingsRevenueRepository } from "../repositories/grand-kings-revenue-repository.js";
import { getGrandKingsRevenueRepository } from "../repositories/sqlite-grand-kings-revenue-repository.js";

export const GRAND_KINGS_REVENUE_ENGINE_MODULE_ID = "grand-kings-revenue-engine" as const;

export type GrandKingsRevenueCapability =
  | "grand-kings-revenue-engine.run_cycle"
  | "grand-kings-revenue-engine.lifecycle"
  | "grand-kings-revenue-engine.kpi";

export const GRAND_KINGS_REVENUE_CAPABILITIES: GrandKingsRevenueCapability[] = [
  "grand-kings-revenue-engine.run_cycle",
  "grand-kings-revenue-engine.lifecycle",
  "grand-kings-revenue-engine.kpi",
];

export type GrandKingsRevenueEngineModuleContract = {
  moduleId: typeof GRAND_KINGS_REVENUE_ENGINE_MODULE_ID;
  capabilities: GrandKingsRevenueCapability[];
  repository: GrandKingsRevenueRepository;
  getLatestCycle(
    workspaceId: string,
    companyId?: string,
  ): GrandKingsRevenueCycleRecord | null;
};

export function createGrandKingsRevenueEngineModuleContract(): GrandKingsRevenueEngineModuleContract {
  const repository = getGrandKingsRevenueRepository();
  return {
    moduleId: GRAND_KINGS_REVENUE_ENGINE_MODULE_ID,
    capabilities: GRAND_KINGS_REVENUE_CAPABILITIES,
    repository,
    getLatestCycle: (workspaceId, companyId) =>
      repository.getLatestCycle(workspaceId, companyId),
  };
}
