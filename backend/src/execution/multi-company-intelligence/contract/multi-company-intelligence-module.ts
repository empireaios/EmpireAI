/**
 * Multi-Company Intelligence module — unlimited companies without auto-merge.
 */

import {
  MultiCompanyIntelligenceEngine,
  defaultMultiCompanyIntelligenceEngine,
  type MultiCompanyInput,
} from "../engines/multi-company-intelligence-engine.js";
import type { MultiCompanyRecord } from "../models/multi-company-record.js";
import {
  generateMultiCompanyIntelligence,
  multiCompanyIntelligenceScoring,
  type MultiCompanyBrandInput,
  type MultiCompanyEntryInput,
} from "../scoring/multi-company-intelligence-scoring.js";
import type {
  MultiCompanyIntelligenceRepository,
  MultiCompanyIntelligenceRepositoryQuery,
} from "../repositories/multi-company-intelligence-repository.js";
import { createInMemoryMultiCompanyIntelligenceRepository } from "../repositories/in-memory-multi-company-intelligence-repository.js";

export const MULTI_COMPANY_INTELLIGENCE_MODULE_ID = "multi-company-intelligence" as const;
export type MultiCompanyIntelligenceModuleId = typeof MULTI_COMPANY_INTELLIGENCE_MODULE_ID;

export const MULTI_COMPANY_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type MultiCompanyIntelligenceCapability =
  | "multi-company-intelligence.analyze"
  | "multi-company-intelligence.score"
  | "multi-company-intelligence.persist"
  | "multi-company-intelligence.list";

export const MULTI_COMPANY_INTELLIGENCE_CAPABILITIES: readonly MultiCompanyIntelligenceCapability[] =
  [
    "multi-company-intelligence.analyze",
    "multi-company-intelligence.score",
    "multi-company-intelligence.persist",
    "multi-company-intelligence.list",
  ] as const;

export type MultiCompanyIntelligenceModuleContract = {
  moduleId: MultiCompanyIntelligenceModuleId;
  version: string;
  capabilities: readonly MultiCompanyIntelligenceCapability[];
};

export const MULTI_COMPANY_INTELLIGENCE_MODULE_CONTRACT: MultiCompanyIntelligenceModuleContract =
  {
    moduleId: MULTI_COMPANY_INTELLIGENCE_MODULE_ID,
    version: MULTI_COMPANY_INTELLIGENCE_MODULE_VERSION,
    capabilities: MULTI_COMPANY_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates multi-company intelligence generation and persistence. */
export class MultiCompanyIntelligenceModule {
  readonly contract = MULTI_COMPANY_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: MultiCompanyIntelligenceEngine;

  constructor(
    private readonly repository: MultiCompanyIntelligenceRepository,
    engine?: MultiCompanyIntelligenceEngine,
  ) {
    this.engine = engine ?? new MultiCompanyIntelligenceEngine(repository);
  }

  generateMultiCompanyIntelligence = generateMultiCompanyIntelligence;
  scoring = multiCompanyIntelligenceScoring;

  generateIntelligence(input: MultiCompanyInput) {
    return this.engine.generateIntelligence(input);
  }

  async persistIntelligence(
    workspaceId: string,
    input: MultiCompanyInput,
  ): Promise<MultiCompanyRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getIntelligenceRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<MultiCompanyRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getIntelligenceByEmpire(
    workspaceId: string,
    empireId: string,
  ): Promise<MultiCompanyRecord | null> {
    return this.repository.getByEmpire(workspaceId, empireId);
  }

  async listIntelligenceRecords(
    workspaceId: string,
    filters: Omit<MultiCompanyIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<MultiCompanyRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a multi-company intelligence module. */
export function createMultiCompanyIntelligenceModule(
  repository: MultiCompanyIntelligenceRepository = createInMemoryMultiCompanyIntelligenceRepository(),
  engine?: MultiCompanyIntelligenceEngine,
): MultiCompanyIntelligenceModule {
  return new MultiCompanyIntelligenceModule(
    repository,
    engine ?? new MultiCompanyIntelligenceEngine(repository),
  );
}

export const multiCompanyIntelligenceModule = createMultiCompanyIntelligenceModule();

export type { MultiCompanyInput, MultiCompanyBrandInput, MultiCompanyEntryInput };

export { defaultMultiCompanyIntelligenceEngine };
