/** X2-20 — Executive Prioritization Engine. */

import { APB_METADATA_VERSION } from "./paths.js";
import type { AutonomousPortfolioBoardConfiguration } from "./configuration.js";
import type { ExecutiveBoardRecord } from "./types.js";
import { ExecutiveDecisionEngine } from "./executive-decision-engine.js";

export class ExecutivePrioritizationEngine {
  private readonly decisions = new ExecutiveDecisionEngine();

  prioritize(input: {
    portfolioReference: string;
    records: ExecutiveBoardRecord[];
    config: AutonomousPortfolioBoardConfiguration;
  }): ExecutiveBoardRecord {
    void input.config;
    const ranked = this.decisions.rankRecords(input.records);
    const priorities = ranked.flatMap((r) => r.executivePriorities).slice(0, 6);
    const recommended = this.decisions.synthesizeDecisions(ranked).slice(0, 6);
    const confidence =
      ranked.length === 0
        ? 50
        : Math.round(
            ranked.reduce((sum, r) => sum + r.decisionConfidence, 0) / ranked.length,
          );

    return {
      executiveBoardId: `apb-brd-${Date.now()}-priority`,
      timestamp: new Date().toISOString(),
      portfolioReference: input.portfolioReference,
      strategicIssues: ranked.flatMap((r) => r.strategicIssues).slice(0, 6),
      executivePriorities: priorities.length
        ? priorities
        : ["Establish baseline executive priorities"],
      recommendedDecisions: recommended.length
        ? recommended
        : ["Collect additional board inputs before prioritization"],
      expectedEnterpriseImpact: this.decisions.expectedImpact(ranked),
      decisionConfidence: confidence,
      validationStatus: "passed",
      metadataVersion: APB_METADATA_VERSION,
      reviewCategory: "composite",
      priorityLevel: ranked[0]?.priorityLevel ?? "medium",
      autoExecutionBlocked: true,
      structuralSignalOnly: true,
      sensitiveEnterpriseData: false,
    };
  }
}
