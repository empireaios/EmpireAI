import type { PricingIntelligenceRecord } from "../models/pricing-intelligence-record.js";
import type { PricingIntelligenceRepository } from "../repositories/pricing-intelligence-repository.js";
import {
  generatePricingBlueprint,
  type PricingIntelligenceInput,
} from "../scoring/pricing-intelligence-scoring.js";

/** Generates pricing intelligence from brand and store inputs. */
export class PricingIntelligenceEngine {
  constructor(private readonly repository: PricingIntelligenceRepository) {}

  generateBlueprint(input: PricingIntelligenceInput) {
    return generatePricingBlueprint(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: PricingIntelligenceInput,
  ): Promise<PricingIntelligenceRecord> {
    const breakdown = generatePricingBlueprint(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultPricingIntelligenceEngine = {
  generateBlueprint: generatePricingBlueprint,
};

export type { PricingIntelligenceInput };
