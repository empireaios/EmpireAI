/**
 * Executive Dashboard Intelligence module — widget models without auto-refresh.
 */

import {
  ExecutiveDashboardIntelligenceEngine,
  defaultExecutiveDashboardIntelligenceEngine,
  type ExecutiveDashboardInput,
} from "../engines/executive-dashboard-intelligence-engine.js";
import type { ExecutiveDashboardRecord } from "../models/executive-dashboard-record.js";
import {
  generateExecutiveDashboard,
  executiveDashboardIntelligenceScoring,
  type ExecutiveDashboardBrandInput,
  type ExecutiveDashboardMetricsInput,
} from "../scoring/executive-dashboard-intelligence-scoring.js";
import type {
  ExecutiveDashboardIntelligenceRepository,
  ExecutiveDashboardIntelligenceRepositoryQuery,
} from "../repositories/executive-dashboard-intelligence-repository.js";
import { createInMemoryExecutiveDashboardIntelligenceRepository } from "../repositories/in-memory-executive-dashboard-intelligence-repository.js";

export const EXECUTIVE_DASHBOARD_INTELLIGENCE_MODULE_ID = "executive-dashboard-intelligence" as const;
export type ExecutiveDashboardIntelligenceModuleId =
  typeof EXECUTIVE_DASHBOARD_INTELLIGENCE_MODULE_ID;

export const EXECUTIVE_DASHBOARD_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type ExecutiveDashboardIntelligenceCapability =
  | "executive-dashboard-intelligence.generate"
  | "executive-dashboard-intelligence.score"
  | "executive-dashboard-intelligence.persist"
  | "executive-dashboard-intelligence.list";

export const EXECUTIVE_DASHBOARD_INTELLIGENCE_CAPABILITIES: readonly ExecutiveDashboardIntelligenceCapability[] =
  [
    "executive-dashboard-intelligence.generate",
    "executive-dashboard-intelligence.score",
    "executive-dashboard-intelligence.persist",
    "executive-dashboard-intelligence.list",
  ] as const;

export type ExecutiveDashboardIntelligenceModuleContract = {
  moduleId: ExecutiveDashboardIntelligenceModuleId;
  version: string;
  capabilities: readonly ExecutiveDashboardIntelligenceCapability[];
};

export const EXECUTIVE_DASHBOARD_INTELLIGENCE_MODULE_CONTRACT: ExecutiveDashboardIntelligenceModuleContract =
  {
    moduleId: EXECUTIVE_DASHBOARD_INTELLIGENCE_MODULE_ID,
    version: EXECUTIVE_DASHBOARD_INTELLIGENCE_MODULE_VERSION,
    capabilities: EXECUTIVE_DASHBOARD_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates executive dashboard generation and persistence. */
export class ExecutiveDashboardIntelligenceModule {
  readonly contract = EXECUTIVE_DASHBOARD_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: ExecutiveDashboardIntelligenceEngine;

  constructor(
    private readonly repository: ExecutiveDashboardIntelligenceRepository,
    engine?: ExecutiveDashboardIntelligenceEngine,
  ) {
    this.engine = engine ?? new ExecutiveDashboardIntelligenceEngine(repository);
  }

  generateExecutiveDashboard = generateExecutiveDashboard;
  scoring = executiveDashboardIntelligenceScoring;

  generateDashboard(input: ExecutiveDashboardInput) {
    return this.engine.generateDashboard(input);
  }

  async persistDashboard(
    workspaceId: string,
    input: ExecutiveDashboardInput,
  ): Promise<ExecutiveDashboardRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getDashboardRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<ExecutiveDashboardRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getDashboardByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<ExecutiveDashboardRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listDashboardRecords(
    workspaceId: string,
    filters: Omit<ExecutiveDashboardIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<ExecutiveDashboardRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for an executive dashboard intelligence module. */
export function createExecutiveDashboardIntelligenceModule(
  repository: ExecutiveDashboardIntelligenceRepository = createInMemoryExecutiveDashboardIntelligenceRepository(),
  engine?: ExecutiveDashboardIntelligenceEngine,
): ExecutiveDashboardIntelligenceModule {
  return new ExecutiveDashboardIntelligenceModule(
    repository,
    engine ?? new ExecutiveDashboardIntelligenceEngine(repository),
  );
}

export const executiveDashboardIntelligenceModule = createExecutiveDashboardIntelligenceModule();

export type { ExecutiveDashboardInput, ExecutiveDashboardBrandInput, ExecutiveDashboardMetricsInput };

export { defaultExecutiveDashboardIntelligenceEngine };
