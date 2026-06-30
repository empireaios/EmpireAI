/**
 * Empire Audit Intelligence module — complete audit without auto-remediate.
 */

import {
  EmpireAuditIntelligenceEngine,
  defaultEmpireAuditIntelligenceEngine,
  type EmpireAuditInput,
} from "../engines/empire-audit-intelligence-engine.js";
import type { EmpireAuditRecord } from "../models/empire-audit-record.js";
import {
  generateEmpireAudit,
  empireAuditIntelligenceScoring,
} from "../scoring/empire-audit-intelligence-scoring.js";
import type {
  EmpireAuditIntelligenceRepository,
  EmpireAuditIntelligenceRepositoryQuery,
} from "../repositories/empire-audit-intelligence-repository.js";
import { createInMemoryEmpireAuditIntelligenceRepository } from "../repositories/in-memory-empire-audit-intelligence-repository.js";

export const EMPIRE_AUDIT_INTELLIGENCE_MODULE_ID = "empire-audit-intelligence" as const;
export type EmpireAuditIntelligenceModuleId = typeof EMPIRE_AUDIT_INTELLIGENCE_MODULE_ID;

export const EMPIRE_AUDIT_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type EmpireAuditIntelligenceCapability =
  | "empire-audit-intelligence.audit"
  | "empire-audit-intelligence.score"
  | "empire-audit-intelligence.persist"
  | "empire-audit-intelligence.list";

export const EMPIRE_AUDIT_INTELLIGENCE_CAPABILITIES: readonly EmpireAuditIntelligenceCapability[] =
  [
    "empire-audit-intelligence.audit",
    "empire-audit-intelligence.score",
    "empire-audit-intelligence.persist",
    "empire-audit-intelligence.list",
  ] as const;

export type EmpireAuditIntelligenceModuleContract = {
  moduleId: EmpireAuditIntelligenceModuleId;
  version: string;
  capabilities: readonly EmpireAuditIntelligenceCapability[];
};

export const EMPIRE_AUDIT_INTELLIGENCE_MODULE_CONTRACT: EmpireAuditIntelligenceModuleContract = {
  moduleId: EMPIRE_AUDIT_INTELLIGENCE_MODULE_ID,
  version: EMPIRE_AUDIT_INTELLIGENCE_MODULE_VERSION,
  capabilities: EMPIRE_AUDIT_INTELLIGENCE_CAPABILITIES,
};

/** Orchestrates empire audit generation and persistence. */
export class EmpireAuditIntelligenceModule {
  readonly contract = EMPIRE_AUDIT_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: EmpireAuditIntelligenceEngine;

  constructor(
    private readonly repository: EmpireAuditIntelligenceRepository,
    engine?: EmpireAuditIntelligenceEngine,
  ) {
    this.engine = engine ?? new EmpireAuditIntelligenceEngine(repository);
  }

  generateEmpireAudit = generateEmpireAudit;
  scoring = empireAuditIntelligenceScoring;

  generateAudit(input: EmpireAuditInput) {
    return this.engine.generateAudit(input);
  }

  async persistAudit(input: EmpireAuditInput): Promise<EmpireAuditRecord> {
    return this.engine.generateAndSave(input);
  }

  async getAuditRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<EmpireAuditRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getAuditByWorkspace(workspaceId: string): Promise<EmpireAuditRecord | null> {
    return this.repository.getByWorkspace(workspaceId);
  }

  async listAuditRecords(
    filters: EmpireAuditIntelligenceRepositoryQuery,
  ): Promise<EmpireAuditRecord[]> {
    return this.repository.list(filters);
  }
}

/** Factory for an empire audit intelligence module. */
export function createEmpireAuditIntelligenceModule(
  repository: EmpireAuditIntelligenceRepository = createInMemoryEmpireAuditIntelligenceRepository(),
  engine?: EmpireAuditIntelligenceEngine,
): EmpireAuditIntelligenceModule {
  return new EmpireAuditIntelligenceModule(
    repository,
    engine ?? new EmpireAuditIntelligenceEngine(repository),
  );
}

export const empireAuditIntelligenceModule = createEmpireAuditIntelligenceModule();

export type { EmpireAuditInput };

export { defaultEmpireAuditIntelligenceEngine };
