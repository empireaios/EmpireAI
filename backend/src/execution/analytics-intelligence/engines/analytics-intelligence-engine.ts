import type { AnalyticsIntelligenceRecord } from "../models/analytics-intelligence-record.js";
import type { AnalyticsIntelligenceRepository } from "../repositories/analytics-intelligence-repository.js";
import {
  generateAnalyticsBlueprint,
  type AnalyticsIntelligenceInput,
} from "../scoring/analytics-intelligence-scoring.js";

/** Generates analytics blueprints from brand and store inputs. */
export class AnalyticsIntelligenceEngine {
  constructor(private readonly repository: AnalyticsIntelligenceRepository) {}

  generateBlueprint(input: AnalyticsIntelligenceInput) {
    return generateAnalyticsBlueprint(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: AnalyticsIntelligenceInput,
  ): Promise<AnalyticsIntelligenceRecord> {
    const breakdown = generateAnalyticsBlueprint(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultAnalyticsIntelligenceEngine = {
  generateBlueprint: generateAnalyticsBlueprint,
};

export type { AnalyticsIntelligenceInput };
