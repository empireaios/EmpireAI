import type { CroIntelligenceRecord } from "../models/cro-intelligence-record.js";
import type { CroIntelligenceRepository } from "../repositories/cro-intelligence-repository.js";
import {
  generateCroReport,
  type CroIntelligenceInput,
} from "../scoring/cro-intelligence-scoring.js";

/** Generates CRO intelligence from brand and store inputs. */
export class CroIntelligenceEngine {
  constructor(private readonly repository: CroIntelligenceRepository) {}

  generateReport(input: CroIntelligenceInput) {
    return generateCroReport(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: CroIntelligenceInput,
  ): Promise<CroIntelligenceRecord> {
    const breakdown = generateCroReport(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultCroIntelligenceEngine = {
  generateReport: generateCroReport,
};

export type { CroIntelligenceInput };
