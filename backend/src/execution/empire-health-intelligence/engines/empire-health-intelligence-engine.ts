import type { EmpireHealthRecord } from "../models/empire-health-record.js";
import type { EmpireHealthIntelligenceRepository } from "../repositories/empire-health-intelligence-repository.js";
import {
  generateEmpireHealthReport,
  type EmpireHealthInput,
} from "../scoring/empire-health-intelligence-scoring.js";

/** Generates empire health intelligence from brand and metrics inputs. */
export class EmpireHealthIntelligenceEngine {
  constructor(private readonly repository: EmpireHealthIntelligenceRepository) {}

  generateHealthReport(input: EmpireHealthInput) {
    return generateEmpireHealthReport(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: EmpireHealthInput,
  ): Promise<EmpireHealthRecord> {
    const breakdown = generateEmpireHealthReport(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultEmpireHealthIntelligenceEngine = {
  generateHealthReport: generateEmpireHealthReport,
};

export type { EmpireHealthInput };
