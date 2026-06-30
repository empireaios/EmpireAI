/**
 * Empire Health Intelligence module — health monitoring without auto-intervention.
 */

import {
  EmpireHealthIntelligenceEngine,
  defaultEmpireHealthIntelligenceEngine,
  type EmpireHealthInput,
} from "../engines/empire-health-intelligence-engine.js";
import type { EmpireHealthRecord } from "../models/empire-health-record.js";
import {
  generateEmpireHealthReport,
  empireHealthIntelligenceScoring,
  type EmpireHealthBrandInput,
  type EmpireHealthMetricsInput,
} from "../scoring/empire-health-intelligence-scoring.js";
import type {
  EmpireHealthIntelligenceRepository,
  EmpireHealthIntelligenceRepositoryQuery,
} from "../repositories/empire-health-intelligence-repository.js";
import { createInMemoryEmpireHealthIntelligenceRepository } from "../repositories/in-memory-empire-health-intelligence-repository.js";

export const EMPIRE_HEALTH_INTELLIGENCE_MODULE_ID = "empire-health-intelligence" as const;
export type EmpireHealthIntelligenceModuleId = typeof EMPIRE_HEALTH_INTELLIGENCE_MODULE_ID;

export const EMPIRE_HEALTH_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type EmpireHealthIntelligenceCapability =
  | "empire-health-intelligence.monitor"
  | "empire-health-intelligence.score"
  | "empire-health-intelligence.persist"
  | "empire-health-intelligence.list";

export const EMPIRE_HEALTH_INTELLIGENCE_CAPABILITIES: readonly EmpireHealthIntelligenceCapability[] =
  [
    "empire-health-intelligence.monitor",
    "empire-health-intelligence.score",
    "empire-health-intelligence.persist",
    "empire-health-intelligence.list",
  ] as const;

export type EmpireHealthIntelligenceModuleContract = {
  moduleId: EmpireHealthIntelligenceModuleId;
  version: string;
  capabilities: readonly EmpireHealthIntelligenceCapability[];
};

export const EMPIRE_HEALTH_INTELLIGENCE_MODULE_CONTRACT: EmpireHealthIntelligenceModuleContract = {
  moduleId: EMPIRE_HEALTH_INTELLIGENCE_MODULE_ID,
  version: EMPIRE_HEALTH_INTELLIGENCE_MODULE_VERSION,
  capabilities: EMPIRE_HEALTH_INTELLIGENCE_CAPABILITIES,
};

/** Orchestrates empire health monitoring and persistence. */
export class EmpireHealthIntelligenceModule {
  readonly contract = EMPIRE_HEALTH_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: EmpireHealthIntelligenceEngine;

  constructor(
    private readonly repository: EmpireHealthIntelligenceRepository,
    engine?: EmpireHealthIntelligenceEngine,
  ) {
    this.engine = engine ?? new EmpireHealthIntelligenceEngine(repository);
  }

  generateEmpireHealthReport = generateEmpireHealthReport;
  scoring = empireHealthIntelligenceScoring;

  generateHealthReport(input: EmpireHealthInput) {
    return this.engine.generateHealthReport(input);
  }

  async persistHealthReport(
    workspaceId: string,
    input: EmpireHealthInput,
  ): Promise<EmpireHealthRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getHealthRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<EmpireHealthRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getHealthByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<EmpireHealthRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listHealthRecords(
    workspaceId: string,
    filters: Omit<EmpireHealthIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<EmpireHealthRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for an empire health intelligence module. */
export function createEmpireHealthIntelligenceModule(
  repository: EmpireHealthIntelligenceRepository = createInMemoryEmpireHealthIntelligenceRepository(),
  engine?: EmpireHealthIntelligenceEngine,
): EmpireHealthIntelligenceModule {
  return new EmpireHealthIntelligenceModule(
    repository,
    engine ?? new EmpireHealthIntelligenceEngine(repository),
  );
}

export const empireHealthIntelligenceModule = createEmpireHealthIntelligenceModule();

export type { EmpireHealthInput, EmpireHealthBrandInput, EmpireHealthMetricsInput };

export { defaultEmpireHealthIntelligenceEngine };
