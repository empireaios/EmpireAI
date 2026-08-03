/** X2-04 — Knowledge recommendation engine. */

import { appendCbkLog } from "./cbk-logging.js";
import type { EnterpriseKnowledgeRepository } from "./enterprise-knowledge-repository.js";
import type { KnowledgeRecommendation, KnowledgeRecord } from "./types.js";

export class KnowledgeRecommendationEngine {
  constructor(private readonly repository: EnterpriseKnowledgeRepository) {}

  recommend(input: {
    targetCompany?: string;
    knowledgeRecordId?: string;
  }): KnowledgeRecommendation[] {
    const records = input.knowledgeRecordId
      ? [this.repository.get(input.knowledgeRecordId)].filter(Boolean)
      : this.repository.list();

    const recommendations: KnowledgeRecommendation[] = [];

    for (const record of records as KnowledgeRecord[]) {
      if (record.distributionStatus === "local" && record.reusabilityScore >= 55) {
        recommendations.push(
          this.make(record.knowledgeRecordId, input.targetCompany ?? null, "share", "high", "High-reusability knowledge pending share"),
        );
      }
      if (record.knowledgeCategory === "general") {
        recommendations.push(
          this.make(record.knowledgeRecordId, null, "classify", "medium", "Refine classification for better portfolio reuse"),
        );
      }
      if (record.knowledgeCategory === "successful_practice") {
        recommendations.push(
          this.make(record.knowledgeRecordId, input.targetCompany ?? null, "reuse", "high", "Successful practice ready for cross-company reuse"),
        );
      }
      if (record.knowledgeCategory === "failed_practice") {
        recommendations.push(
          this.make(record.knowledgeRecordId, input.targetCompany ?? null, "reuse", "medium", "Failed practice should inform portfolio avoidance patterns"),
        );
      }
    }

    const duplicates = this.repository.findDuplicates(input.knowledgeRecordId);
    if (duplicates.length > 0) {
      recommendations.push(
        this.make(
          duplicates[0]?.knowledgeRecordId ?? null,
          null,
          "resolve_duplicate",
          "high",
          `Detected ${duplicates.length} duplicate learning signal(s)`,
        ),
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        this.make(null, input.targetCompany ?? null, "collect", "low", "Continue collecting structural enterprise knowledge"),
      );
    }

    appendCbkLog({
      event: "recommendation_generation",
      level: "info",
      details: `Generated ${recommendations.length} knowledge recommendation(s)`,
    });

    return recommendations;
  }

  private make(
    knowledgeRecordId: string | null,
    targetCompany: string | null,
    recommendationType: KnowledgeRecommendation["recommendationType"],
    priority: KnowledgeRecommendation["priority"],
    rationale: string,
  ): KnowledgeRecommendation {
    return {
      recommendationId: `cbk-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      knowledgeRecordId,
      targetCompany,
      recommendationType,
      rationale,
      priority,
      structuralSignalOnly: true,
    };
  }
}
