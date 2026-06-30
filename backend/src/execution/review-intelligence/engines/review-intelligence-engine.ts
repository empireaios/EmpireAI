import type { ReviewIntelligenceRecord } from "../models/review-intelligence-record.js";
import type { ReviewIntelligenceRepository } from "../repositories/review-intelligence-repository.js";
import {
  generateReviewIntelligenceReport,
  type ReviewIntelligenceInput,
} from "../scoring/review-intelligence-scoring.js";

/** Generates review intelligence from brand and store inputs. */
export class ReviewIntelligenceEngine {
  constructor(private readonly repository: ReviewIntelligenceRepository) {}

  generateReport(input: ReviewIntelligenceInput) {
    return generateReviewIntelligenceReport(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: ReviewIntelligenceInput,
  ): Promise<ReviewIntelligenceRecord> {
    const breakdown = generateReviewIntelligenceReport(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultReviewIntelligenceEngine = {
  generateReport: generateReviewIntelligenceReport,
};

export type { ReviewIntelligenceInput };
