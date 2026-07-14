/** T5-04 — Workflow pattern learning from T5-03 opportunities and T2 workflow optimization. */

import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { ProductivityIntelligenceEngineBundle, RawProductivityCandidate } from "./types.js";

export class WorkflowPatternAnalyzer {
  analyze(input: {
    engines: ProductivityIntelligenceEngineBundle;
    opportunities: OpportunityRecord[];
    audit: UxAuditRecord | null;
    observation: ObservationRecord | null;
  }): RawProductivityCandidate[] {
    const candidates: RawProductivityCandidate[] = [];

    for (const opp of input.opportunities.filter(
      (o) => o.opportunityCategory === "workflow_improvement",
    )) {
      candidates.push({
        productivityObservations: ["workflow_pattern", "operational_efficiency"],
        workflowPatternSummary: `Workflow friction detected: ${opp.opportunitySummary}`,
        navigationPatternSummary: "Navigation stable during workflow friction",
        taskSequenceSummary: "Task sequence interrupted by workflow inefficiency",
        bottleneckSummary: "Workflow step requires optimization",
        evidenceReferences: [...opp.evidenceReferences, `opportunity:${opp.opportunityId}`],
        confidenceScore: opp.confidenceScore,
        impactScore: 0.75,
        sourceEngine: "PILLOW-UOD-001",
        sourceOpportunityId: opp.opportunityId,
        sourceAuditId: opp.sourceAuditId,
        sourceObservationId: opp.sourceObservationId,
      });
    }

    try {
      const wfo = input.engines.workflowOptimization?.getState();
      const record = wfo?.latestReport?.record;
      if (record?.currentWorkflowName) {
        const frictionCount = record.detectedFrictionPoints.length;
        candidates.push({
          productivityObservations: ["workflow_pattern", "task_completion_flow"],
          workflowPatternSummary: `Active workflow: ${record.currentWorkflowName} (stage: ${record.currentWorkflowStage ?? "unknown"})`,
          navigationPatternSummary: `Workflow spans ${record.affectedNavigationNodes.length} navigation nodes`,
          taskSequenceSummary: `Workflow driven by ${record.sourceInteractionEventIds.length} interaction events`,
          bottleneckSummary:
            frictionCount > 0
              ? `${frictionCount} friction points detected in current workflow`
              : "No major workflow bottlenecks detected",
          evidenceReferences: record.evidenceReferences,
          confidenceScore: record.confidenceScore,
          impactScore: frictionCount > 0 ? 0.8 : 0.55,
          sourceEngine: "PILLOW-WFO-001",
          sourceAuditId: input.audit?.auditId ?? null,
          sourceObservationId: input.observation?.observationId ?? null,
        });
      }
    } catch {
      /* workflow optimization unavailable */
    }

    return candidates;
  }
}
