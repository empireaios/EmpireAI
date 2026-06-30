import type { CompetitorIntelligenceRecord } from "../models/competitor-intelligence-record.js";
import type { CompetitorIntelligenceRepository } from "../repositories/competitor-intelligence-repository.js";
import {
  generateCompetitorIntelligence,
  runCompetitorWatchCycle,
  type CompetitorIntelligenceInput,
} from "../scoring/competitor-intelligence-scoring.js";

/** Generates competitor intelligence from Eye watch cycles. */
export class CompetitorIntelligenceEngine {
  constructor(private readonly repository: CompetitorIntelligenceRepository) {}

  generateIntelligence(workspaceId: string, input: CompetitorIntelligenceInput) {
    return generateCompetitorIntelligence(workspaceId, input);
  }

  runWatchCycle(workspaceId: string, input: CompetitorIntelligenceInput) {
    return runCompetitorWatchCycle(workspaceId, input);
  }

  async generateAndSave(
    workspaceId: string,
    input: CompetitorIntelligenceInput,
  ): Promise<CompetitorIntelligenceRecord> {
    const breakdown = await generateCompetitorIntelligence(workspaceId, input);
    return this.repository.save(workspaceId, breakdown);
  }

  async runWatchCycleAndSave(
    workspaceId: string,
    input: CompetitorIntelligenceInput,
  ): Promise<CompetitorIntelligenceRecord> {
    const previousSnapshots = await this.repository.getLatestSnapshots(
      workspaceId,
      input.storeId,
    );
    const breakdown = await runCompetitorWatchCycle(workspaceId, {
      ...input,
      previousSnapshots,
      watchCycle: previousSnapshots.length > 0 ? 2 : 1,
    });
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultCompetitorIntelligenceEngine = {
  generateIntelligence: generateCompetitorIntelligence,
  runWatchCycle: runCompetitorWatchCycle,
};

export type { CompetitorIntelligenceInput };
