import type { EmpireAuditRecord } from "../models/empire-audit-record.js";
import type { EmpireAuditIntelligenceRepository } from "../repositories/empire-audit-intelligence-repository.js";
import {
  generateEmpireAudit,
  type EmpireAuditInput,
} from "../scoring/empire-audit-intelligence-scoring.js";

/** Generates empire audit intelligence from workspace inputs. */
export class EmpireAuditIntelligenceEngine {
  constructor(private readonly repository: EmpireAuditIntelligenceRepository) {}

  generateAudit(input: EmpireAuditInput) {
    return generateEmpireAudit(input);
  }

  async generateAndSave(input: EmpireAuditInput): Promise<EmpireAuditRecord> {
    const breakdown = generateEmpireAudit(input);
    return this.repository.save(breakdown);
  }
}

export const defaultEmpireAuditIntelligenceEngine = {
  generateAudit: generateEmpireAudit,
};

export type { EmpireAuditInput };
