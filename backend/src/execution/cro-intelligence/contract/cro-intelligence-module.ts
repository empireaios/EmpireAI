/**
 * CRO Intelligence module — conversion optimization recommendations without deployment.
 */

import {
  CroIntelligenceEngine,
  defaultCroIntelligenceEngine,
  type CroIntelligenceInput,
} from "../engines/cro-intelligence-engine.js";
import type { CroIntelligenceRecord } from "../models/cro-intelligence-record.js";
import {
  generateCroReport,
  croIntelligenceScoring,
  type CroIntelligenceBrandInput,
  type CroIntelligenceOfferInput,
} from "../scoring/cro-intelligence-scoring.js";
import type {
  CroIntelligenceRepository,
  CroIntelligenceRepositoryQuery,
} from "../repositories/cro-intelligence-repository.js";
import { createInMemoryCroIntelligenceRepository } from "../repositories/in-memory-cro-intelligence-repository.js";

export const CRO_INTELLIGENCE_MODULE_ID = "cro-intelligence" as const;
export type CroIntelligenceModuleId = typeof CRO_INTELLIGENCE_MODULE_ID;

export const CRO_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type CroIntelligenceCapability =
  | "cro-intelligence.generate"
  | "cro-intelligence.score"
  | "cro-intelligence.persist"
  | "cro-intelligence.list";

export const CRO_INTELLIGENCE_CAPABILITIES: readonly CroIntelligenceCapability[] = [
  "cro-intelligence.generate",
  "cro-intelligence.score",
  "cro-intelligence.persist",
  "cro-intelligence.list",
] as const;

export type CroIntelligenceModuleContract = {
  moduleId: CroIntelligenceModuleId;
  version: string;
  capabilities: readonly CroIntelligenceCapability[];
};

export const CRO_INTELLIGENCE_MODULE_CONTRACT: CroIntelligenceModuleContract = {
  moduleId: CRO_INTELLIGENCE_MODULE_ID,
  version: CRO_INTELLIGENCE_MODULE_VERSION,
  capabilities: CRO_INTELLIGENCE_CAPABILITIES,
};

/** Orchestrates CRO report generation and persistence. */
export class CroIntelligenceModule {
  readonly contract = CRO_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: CroIntelligenceEngine;

  constructor(
    private readonly repository: CroIntelligenceRepository,
    engine?: CroIntelligenceEngine,
  ) {
    this.engine = engine ?? new CroIntelligenceEngine(repository);
  }

  generateCroReport = generateCroReport;
  scoring = croIntelligenceScoring;

  generateReport(input: CroIntelligenceInput) {
    return this.engine.generateReport(input);
  }

  async persistReport(
    workspaceId: string,
    input: CroIntelligenceInput,
  ): Promise<CroIntelligenceRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getReportRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<CroIntelligenceRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getReportByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<CroIntelligenceRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listReportRecords(
    workspaceId: string,
    filters: Omit<CroIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<CroIntelligenceRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a CRO intelligence module. */
export function createCroIntelligenceModule(
  repository: CroIntelligenceRepository = createInMemoryCroIntelligenceRepository(),
  engine?: CroIntelligenceEngine,
): CroIntelligenceModule {
  return new CroIntelligenceModule(
    repository,
    engine ?? new CroIntelligenceEngine(repository),
  );
}

export const croIntelligenceModule = createCroIntelligenceModule();

export type {
  CroIntelligenceInput,
  CroIntelligenceBrandInput,
  CroIntelligenceOfferInput,
};

export { defaultCroIntelligenceEngine };
