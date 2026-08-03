/** X2-20 — Executive Recommendation Engine. */

import type { AutonomousPortfolioBoardConfiguration } from "./configuration.js";
import type { ExecutiveBoardRecord, ExecutiveRecommendation } from "./types.js";

export class ExecutiveRecommendationEngine {
  generate(input: {
    portfolioReference: string;
    records: ExecutiveBoardRecord[];
    config: AutonomousPortfolioBoardConfiguration;
  }): ExecutiveRecommendation[] {
    if (!input.config.neverExecuteStrategicDecisionsAutomaticallyBeyondConfiguredApprovalPolicies) {
      return [
        {
          recommendationId: `apb-rec-${Date.now()}-blocked`,
          timestamp: new Date().toISOString(),
          portfolioReference: input.portfolioReference,
          recommendationSummary:
            "Recommendation blocked — automatic strategic execution is forbidden",
          priorityLevel: "critical",
          decisionConfidence: 0,
          expectedEnterpriseImpact: "No automatic execution permitted",
          autoExecutionBlocked: true,
          structuralSignalOnly: true,
        },
      ];
    }

    const source =
      input.records.length > 0
        ? input.records
        : [
            {
              executiveBoardId: "apb-brd-seed",
              timestamp: new Date().toISOString(),
              portfolioReference: input.portfolioReference,
              strategicIssues: ["Insufficient prior board reviews"],
              executivePriorities: ["Complete portfolio board reviews"],
              recommendedDecisions: ["Run full executive board review cycle"],
              expectedEnterpriseImpact: "Restore executive decision readiness",
              decisionConfidence: 55,
              validationStatus: "partial" as const,
              metadataVersion: "APB-001-v1",
              reviewCategory: "composite" as const,
              priorityLevel: "medium" as const,
              autoExecutionBlocked: true as const,
              structuralSignalOnly: true as const,
              sensitiveEnterpriseData: false as const,
            },
          ];

    return source.slice(0, 5).map((record, index) => ({
      recommendationId: `apb-rec-${Date.now()}-${index}`,
      timestamp: new Date().toISOString(),
      portfolioReference: input.portfolioReference,
      recommendationSummary:
        record.recommendedDecisions[0] ??
        record.executivePriorities[0] ??
        "Maintain governance oversight",
      priorityLevel: record.priorityLevel,
      decisionConfidence: record.decisionConfidence,
      expectedEnterpriseImpact: record.expectedEnterpriseImpact,
      autoExecutionBlocked: true,
      structuralSignalOnly: true,
    }));
  }
}
