import type { ContinuousOptimizationRecord } from "../models/continuous-optimization-record.js";
import type { ContinuousOptimizationIntelligenceRepository } from "../repositories/continuous-optimization-intelligence-repository.js";
import {
  generateContinuousOptimization,
  type ContinuousOptimizationInput,
} from "../scoring/continuous-optimization-intelligence-scoring.js";

/** Generates continuous optimization intelligence from brand and metrics inputs. */
export class ContinuousOptimizationIntelligenceEngine {
  constructor(private readonly repository: ContinuousOptimizationIntelligenceRepository) {}

  generateOptimization(input: ContinuousOptimizationInput) {
    return generateContinuousOptimization(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: ContinuousOptimizationInput,
  ): Promise<ContinuousOptimizationRecord> {
    const breakdown = generateContinuousOptimization(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultContinuousOptimizationIntelligenceEngine = {
  generateOptimization: generateContinuousOptimization,
};

export type { ContinuousOptimizationInput };
