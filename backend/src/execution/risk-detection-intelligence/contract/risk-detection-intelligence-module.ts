/**
 * Risk Detection Intelligence module — risk detection and alerts without auto-intervention.
 */

import {
  RiskDetectionIntelligenceEngine,
  defaultRiskDetectionIntelligenceEngine,
  type RiskDetectionInput,
} from "../engines/risk-detection-intelligence-engine.js";
import type { RiskDetectionRecord } from "../models/risk-detection-record.js";
import {
  generateRiskDetection,
  riskDetectionIntelligenceScoring,
  type RiskDetectionBrandInput,
  type RiskDetectionMetricsInput,
} from "../scoring/risk-detection-intelligence-scoring.js";
import type {
  RiskDetectionIntelligenceRepository,
  RiskDetectionIntelligenceRepositoryQuery,
} from "../repositories/risk-detection-intelligence-repository.js";
import { createInMemoryRiskDetectionIntelligenceRepository } from "../repositories/in-memory-risk-detection-intelligence-repository.js";

export const RISK_DETECTION_INTELLIGENCE_MODULE_ID = "risk-detection-intelligence" as const;
export type RiskDetectionIntelligenceModuleId = typeof RISK_DETECTION_INTELLIGENCE_MODULE_ID;

export const RISK_DETECTION_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type RiskDetectionIntelligenceCapability =
  | "risk-detection-intelligence.detect"
  | "risk-detection-intelligence.score"
  | "risk-detection-intelligence.persist"
  | "risk-detection-intelligence.list";

export const RISK_DETECTION_INTELLIGENCE_CAPABILITIES: readonly RiskDetectionIntelligenceCapability[] =
  [
    "risk-detection-intelligence.detect",
    "risk-detection-intelligence.score",
    "risk-detection-intelligence.persist",
    "risk-detection-intelligence.list",
  ] as const;

export type RiskDetectionIntelligenceModuleContract = {
  moduleId: RiskDetectionIntelligenceModuleId;
  version: string;
  capabilities: readonly RiskDetectionIntelligenceCapability[];
};

export const RISK_DETECTION_INTELLIGENCE_MODULE_CONTRACT: RiskDetectionIntelligenceModuleContract =
  {
    moduleId: RISK_DETECTION_INTELLIGENCE_MODULE_ID,
    version: RISK_DETECTION_INTELLIGENCE_MODULE_VERSION,
    capabilities: RISK_DETECTION_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates risk detection and persistence. */
export class RiskDetectionIntelligenceModule {
  readonly contract = RISK_DETECTION_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: RiskDetectionIntelligenceEngine;

  constructor(
    private readonly repository: RiskDetectionIntelligenceRepository,
    engine?: RiskDetectionIntelligenceEngine,
  ) {
    this.engine = engine ?? new RiskDetectionIntelligenceEngine(repository);
  }

  generateRiskDetection = generateRiskDetection;
  scoring = riskDetectionIntelligenceScoring;

  generateDetection(input: RiskDetectionInput) {
    return this.engine.generateDetection(input);
  }

  async persistDetection(
    workspaceId: string,
    input: RiskDetectionInput,
  ): Promise<RiskDetectionRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getDetectionRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<RiskDetectionRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getDetectionByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<RiskDetectionRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listDetectionRecords(
    workspaceId: string,
    filters: Omit<RiskDetectionIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<RiskDetectionRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a risk detection intelligence module. */
export function createRiskDetectionIntelligenceModule(
  repository: RiskDetectionIntelligenceRepository = createInMemoryRiskDetectionIntelligenceRepository(),
  engine?: RiskDetectionIntelligenceEngine,
): RiskDetectionIntelligenceModule {
  return new RiskDetectionIntelligenceModule(
    repository,
    engine ?? new RiskDetectionIntelligenceEngine(repository),
  );
}

export const riskDetectionIntelligenceModule = createRiskDetectionIntelligenceModule();

export type { RiskDetectionInput, RiskDetectionBrandInput, RiskDetectionMetricsInput };

export { defaultRiskDetectionIntelligenceEngine };
