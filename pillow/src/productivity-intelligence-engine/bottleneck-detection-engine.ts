/** T5-04 — Workflow bottleneck detection from T2 workflow optimization and T5-02 audits. */

import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { ProductivityIntelligenceEngineBundle, RawProductivityCandidate } from "./types.js";

export class BottleneckDetectionEngine {
  analyze(input: {
    engines: ProductivityIntelligenceEngineBundle;
    opportunities: OpportunityRecord[];
    audit: UxAuditRecord | null;
  }): RawProductivityCandidate[] {
    const candidates: RawProductivityCandidate[] = [];

    try {
      const wfo = input.engines.workflowOptimization?.getState();
      const friction = wfo?.latestReport?.record?.detectedFrictionPoints ?? [];
      for (const point of friction) {
        candidates.push({
          productivityObservations: ["workflow_bottleneck", "operational_efficiency"],
          workflowPatternSummary: `Friction in workflow: ${point.description}`,
          navigationPatternSummary: `Affects ${point.affectedNavigationNodes.length} navigation node(s)`,
          taskSequenceSummary: `Components impacted: ${point.affectedComponents.length}`,
          bottleneckSummary: `Bottleneck (${point.category}): ${point.description}`,
          evidenceReferences: [point.evidenceRef],
          confidenceScore: point.confidence,
          impactScore: point.severity === "error" ? 0.9 : point.severity === "warning" ? 0.8 : 0.6,
          sourceEngine: "PILLOW-WFO-001",
          sourceAuditId: input.audit?.auditId ?? null,
        });
      }
    } catch {
      /* workflow optimization unavailable */
    }

    const loadingIssues = (input.audit?.detectedUxIssues ?? []).filter(
      (i) => i.category === "loading_state_issue",
    );
    for (const issue of loadingIssues) {
      candidates.push({
        productivityObservations: ["workflow_bottleneck", "time_utilization"],
        workflowPatternSummary: "Loading state impacts workflow throughput",
        navigationPatternSummary: "User waiting during screen transition or data fetch",
        taskSequenceSummary: "Task execution paused by loading state",
        bottleneckSummary: issue.description,
        evidenceReferences: [issue.evidenceReference],
        confidenceScore: issue.detectionConfidence,
        impactScore: 0.7,
        sourceEngine: issue.sourceEngine,
        sourceAuditId: input.audit?.auditId ?? null,
        sourceObservationId: input.audit?.sourceObservationId ?? null,
      });
    }

    for (const opp of input.opportunities.filter(
      (o) => o.opportunityCategory === "performance_related_ux_improvement",
    )) {
      candidates.push({
        productivityObservations: ["workflow_bottleneck", "time_utilization"],
        workflowPatternSummary: "Performance-related UX friction reduces productivity",
        navigationPatternSummary: "Performance bottleneck affects navigation responsiveness",
        taskSequenceSummary: "Task completion delayed by performance friction",
        bottleneckSummary: opp.opportunitySummary,
        evidenceReferences: [...opp.evidenceReferences, `opportunity:${opp.opportunityId}`],
        confidenceScore: opp.confidenceScore,
        impactScore: 0.72,
        sourceEngine: "PILLOW-UOD-001",
        sourceOpportunityId: opp.opportunityId,
        sourceAuditId: opp.sourceAuditId,
        sourceObservationId: opp.sourceObservationId,
      });
    }

    return candidates;
  }
}
