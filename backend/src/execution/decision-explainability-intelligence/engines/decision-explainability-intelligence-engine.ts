import type { DecisionExplainabilityRecord } from "../models/decision-explainability-record.js";
import type { DecisionExplainabilityIntelligenceRepository } from "../repositories/decision-explainability-intelligence-repository.js";
import {
  generateDecisionExplainability,
  type DecisionExplainabilityInput,
} from "../scoring/decision-explainability-intelligence-scoring.js";

/** Generates decision explainability intelligence from brand and decision inputs. */
export class DecisionExplainabilityIntelligenceEngine {
  constructor(private readonly repository: DecisionExplainabilityIntelligenceRepository) {}

  generateExplainability(input: DecisionExplainabilityInput) {
    return generateDecisionExplainability(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: DecisionExplainabilityInput,
  ): Promise<DecisionExplainabilityRecord> {
    const breakdown = generateDecisionExplainability(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultDecisionExplainabilityIntelligenceEngine = {
  generateExplainability: generateDecisionExplainability,
};

export type { DecisionExplainabilityInput };
