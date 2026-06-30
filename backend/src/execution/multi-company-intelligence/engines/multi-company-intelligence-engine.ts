import type { MultiCompanyRecord } from "../models/multi-company-record.js";
import type { MultiCompanyIntelligenceRepository } from "../repositories/multi-company-intelligence-repository.js";
import {
  generateMultiCompanyIntelligence,
  type MultiCompanyInput,
} from "../scoring/multi-company-intelligence-scoring.js";

/** Generates multi-company intelligence from empire and company inputs. */
export class MultiCompanyIntelligenceEngine {
  constructor(private readonly repository: MultiCompanyIntelligenceRepository) {}

  generateIntelligence(input: MultiCompanyInput) {
    return generateMultiCompanyIntelligence(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: MultiCompanyInput,
  ): Promise<MultiCompanyRecord> {
    const breakdown = generateMultiCompanyIntelligence(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultMultiCompanyIntelligenceEngine = {
  generateIntelligence: generateMultiCompanyIntelligence,
};

export type { MultiCompanyInput };
