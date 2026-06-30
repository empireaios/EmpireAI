import type { SeoIntelligenceRecord } from "../models/seo-intelligence-record.js";
import type { SeoIntelligenceRepository } from "../repositories/seo-intelligence-repository.js";
import {
  generateSeoIntelligence,
  type SeoIntelligenceInput,
} from "../scoring/seo-intelligence-scoring.js";

/** Generates SEO intelligence profiles from brand and store inputs. */
export class SeoIntelligenceEngine {
  constructor(private readonly repository: SeoIntelligenceRepository) {}

  generateProfile(input: SeoIntelligenceInput) {
    return generateSeoIntelligence(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: SeoIntelligenceInput,
  ): Promise<SeoIntelligenceRecord> {
    const breakdown = generateSeoIntelligence(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultSeoIntelligenceEngine = {
  generateProfile: generateSeoIntelligence,
};

export type { SeoIntelligenceInput };
