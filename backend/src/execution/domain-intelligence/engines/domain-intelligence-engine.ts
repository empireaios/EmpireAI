import type { DomainRecommendation } from "../models/domain-recommendation.js";
import type { DomainIntelligenceRepository } from "../repositories/domain-intelligence-repository.js";
import {
  scoreDomainIntelligence,
  type DomainIntelligenceInput,
} from "../scoring/domain-intelligence-scoring.js";

/** Generates domain recommendations from brand inputs. */
export class DomainIntelligenceEngine {
  constructor(private readonly repository: DomainIntelligenceRepository) {}

  generateDomainRecommendation(input: DomainIntelligenceInput) {
    return scoreDomainIntelligence(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: DomainIntelligenceInput,
  ): Promise<DomainRecommendation> {
    const breakdown = scoreDomainIntelligence(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultDomainIntelligenceEngine = {
  generateDomainRecommendation: scoreDomainIntelligence,
};

export type { DomainIntelligenceInput };
