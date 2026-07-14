/** T2-09 — Executive preference alignment recommendations. */

import type { ImprovementOpportunity } from "./improvement-opportunity-detector.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";

export class ExecutivePreferenceAlignmentGenerator {
  detectGaps(
    executiveStyle: ExecutiveStyleModel | null,
    layoutEvaluation: LayoutEvaluationModel | null,
  ): ImprovementOpportunity[] {
    const opportunities: ImprovementOpportunity[] = [];
    const now = Date.now();

    for (const dev of layoutEvaluation?.executivePreferenceDeviations ?? []) {
      opportunities.push({
        opportunityId: `opp-exec-${dev.deviationId}`,
        source: "T2-03",
        sourceId: dev.deviationId,
        category: dev.category,
        description: dev.description,
        severity: dev.severity,
        affectedComponentId: null,
        affectedLayoutRegionId: null,
        affectedNavigationNodeId: null,
        confidence: 0.7,
        scoreImpact: 10,
      });
    }

    if (executiveStyle && executiveStyle.preferredConsistencyRules.length > 0) {
      opportunities.push({
        opportunityId: `opp-exec-rules-${now}`,
        source: "T2-03",
        sourceId: executiveStyle.executiveStyleId,
        category: "consistency",
        description: `Apply ${executiveStyle.preferredConsistencyRules.length} executive consistency preferences`,
        severity: "info",
        affectedComponentId: null,
        affectedLayoutRegionId: null,
        affectedNavigationNodeId: null,
        confidence: executiveStyle.confidenceScore / 100,
        scoreImpact: 5,
      });
    }

    return opportunities;
  }
}
