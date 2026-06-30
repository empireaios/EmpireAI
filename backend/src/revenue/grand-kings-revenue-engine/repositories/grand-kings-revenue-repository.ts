import type { GrandKingsRevenueCycleRecord } from "../models/grand-kings-revenue-cycle-record.js";

export interface GrandKingsRevenueRepository {
  saveCycle(record: GrandKingsRevenueCycleRecord): GrandKingsRevenueCycleRecord;
  getCycleById(cycleId: string): GrandKingsRevenueCycleRecord | null;
  listCycles(workspaceId: string, companyId?: string): GrandKingsRevenueCycleRecord[];
  getLatestCycle(workspaceId: string, companyId?: string): GrandKingsRevenueCycleRecord | null;
}
