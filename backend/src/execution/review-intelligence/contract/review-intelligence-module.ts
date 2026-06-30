/**
 * Review Intelligence module — review analysis without deployment.
 */

import {
  ReviewIntelligenceEngine,
  defaultReviewIntelligenceEngine,
  type ReviewIntelligenceInput,
} from "../engines/review-intelligence-engine.js";
import type { ReviewIntelligenceRecord } from "../models/review-intelligence-record.js";
import {
  generateReviewIntelligenceReport,
  reviewIntelligenceScoring,
  type ReviewIntelligenceBrandInput,
  type ReviewIntelligenceOfferInput,
} from "../scoring/review-intelligence-scoring.js";
import type {
  ReviewIntelligenceRepository,
  ReviewIntelligenceRepositoryQuery,
} from "../repositories/review-intelligence-repository.js";
import { createInMemoryReviewIntelligenceRepository } from "../repositories/in-memory-review-intelligence-repository.js";

export const REVIEW_INTELLIGENCE_MODULE_ID = "review-intelligence" as const;
export type ReviewIntelligenceModuleId = typeof REVIEW_INTELLIGENCE_MODULE_ID;

export const REVIEW_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type ReviewIntelligenceCapability =
  | "review-intelligence.analyze"
  | "review-intelligence.score"
  | "review-intelligence.persist"
  | "review-intelligence.list";

export const REVIEW_INTELLIGENCE_CAPABILITIES: readonly ReviewIntelligenceCapability[] = [
  "review-intelligence.analyze",
  "review-intelligence.score",
  "review-intelligence.persist",
  "review-intelligence.list",
] as const;

export type ReviewIntelligenceModuleContract = {
  moduleId: ReviewIntelligenceModuleId;
  version: string;
  capabilities: readonly ReviewIntelligenceCapability[];
};

export const REVIEW_INTELLIGENCE_MODULE_CONTRACT: ReviewIntelligenceModuleContract = {
  moduleId: REVIEW_INTELLIGENCE_MODULE_ID,
  version: REVIEW_INTELLIGENCE_MODULE_VERSION,
  capabilities: REVIEW_INTELLIGENCE_CAPABILITIES,
};

/** Orchestrates review analysis generation and persistence. */
export class ReviewIntelligenceModule {
  readonly contract = REVIEW_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: ReviewIntelligenceEngine;

  constructor(
    private readonly repository: ReviewIntelligenceRepository,
    engine?: ReviewIntelligenceEngine,
  ) {
    this.engine = engine ?? new ReviewIntelligenceEngine(repository);
  }

  generateReviewIntelligenceReport = generateReviewIntelligenceReport;
  scoring = reviewIntelligenceScoring;

  generateReport(input: ReviewIntelligenceInput) {
    return this.engine.generateReport(input);
  }

  async persistReport(
    workspaceId: string,
    input: ReviewIntelligenceInput,
  ): Promise<ReviewIntelligenceRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getReportRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<ReviewIntelligenceRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getReportByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<ReviewIntelligenceRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listReportRecords(
    workspaceId: string,
    filters: Omit<ReviewIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<ReviewIntelligenceRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a review intelligence module. */
export function createReviewIntelligenceModule(
  repository: ReviewIntelligenceRepository = createInMemoryReviewIntelligenceRepository(),
  engine?: ReviewIntelligenceEngine,
): ReviewIntelligenceModule {
  return new ReviewIntelligenceModule(
    repository,
    engine ?? new ReviewIntelligenceEngine(repository),
  );
}

export const reviewIntelligenceModule = createReviewIntelligenceModule();

export type {
  ReviewIntelligenceInput,
  ReviewIntelligenceBrandInput,
  ReviewIntelligenceOfferInput,
};

export { defaultReviewIntelligenceEngine };
