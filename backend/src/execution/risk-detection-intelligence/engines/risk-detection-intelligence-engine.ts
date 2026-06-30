import type { RiskDetectionRecord } from "../models/risk-detection-record.js";
import type { RiskDetectionIntelligenceRepository } from "../repositories/risk-detection-intelligence-repository.js";
import {
  generateRiskDetection,
  type RiskDetectionInput,
} from "../scoring/risk-detection-intelligence-scoring.js";

/** Generates risk detection intelligence from brand and metrics inputs. */
export class RiskDetectionIntelligenceEngine {
  constructor(private readonly repository: RiskDetectionIntelligenceRepository) {}

  generateDetection(input: RiskDetectionInput) {
    return generateRiskDetection(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: RiskDetectionInput,
  ): Promise<RiskDetectionRecord> {
    const breakdown = generateRiskDetection(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultRiskDetectionIntelligenceEngine = {
  generateDetection: generateRiskDetection,
};

export type { RiskDetectionInput };
