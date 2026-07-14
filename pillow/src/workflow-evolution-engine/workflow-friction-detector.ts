/** T5-05 — Unnecessary workflow friction detection from T5-04 productivity records. */

import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { RawEvolutionCandidate } from "./types.js";
import { appendEvolutionLog } from "./workflow-logging.js";

export class WorkflowFrictionDetector {
  detect(input: {
    productivityRecords: ProductivityIntelligenceRecord[];
    opportunities: OpportunityRecord[];
    audit: UxAuditRecord | null;
  }): RawEvolutionCandidate[] {
    const candidates: RawEvolutionCandidate[] = [];

    for (const record of input.productivityRecords) {
      if (
        record.productivityObservations.includes("workflow_bottleneck") ||
        record.productivityObservations.includes("user_interruption")
      ) {
        candidates.push({
          evolutionCategory: "process_optimization",
          workflowFrictionSummary: record.bottleneckSummary,
          recommendedWorkflowImprovements: [
            "Remove blocking states from critical workflow path",
            "Add progress feedback during bottleneck periods",
          ],
          estimatedProductivityBenefit: "Reduces workflow stalls and improves task throughput",
          evidenceReferences: [...record.evidenceReferences, `productivity:${record.productivityId}`],
          confidenceScore: record.confidenceScore,
          impactScore: 0.8,
          sourceEngine: "PILLOW-PIE-001",
          sourceProductivityIntelligenceId: record.productivityId,
          sourceOpportunityId: record.sourceOpportunityId,
          sourceUxAuditId: record.sourceAuditId,
          sourceObservationId: record.sourceObservationId,
        });
        appendEvolutionLog({
          event: "friction_detection",
          level: "info",
          details: `Bottleneck friction from ${record.productivityId}`,
        });
      }
    }

    for (const opp of input.opportunities.filter(
      (o) => o.opportunityCategory === "workflow_improvement",
    )) {
      candidates.push({
        evolutionCategory: "workflow_simplification",
        workflowFrictionSummary: opp.opportunitySummary,
        recommendedWorkflowImprovements: [
          "Consolidate workflow steps into fewer interactions",
          "Remove redundant approval gates",
        ],
        estimatedProductivityBenefit: opp.expectedUxBenefit,
        evidenceReferences: [...opp.evidenceReferences, `opportunity:${opp.opportunityId}`],
        confidenceScore: opp.confidenceScore,
        impactScore: 0.75,
        sourceEngine: "PILLOW-UOD-001",
        sourceOpportunityId: opp.opportunityId,
        sourceUxAuditId: opp.sourceAuditId,
        sourceObservationId: opp.sourceObservationId,
      });
    }

    const workflowIssues = (input.audit?.detectedUxIssues ?? []).filter(
      (i) => i.category === "workflow_issue",
    );
    for (const issue of workflowIssues) {
      candidates.push({
        evolutionCategory: "operational_efficiency",
        workflowFrictionSummary: issue.description,
        recommendedWorkflowImprovements: [
          "Streamline affected workflow stage",
          "Reduce manual steps in workflow path",
        ],
        estimatedProductivityBenefit: "Improves end-to-end workflow completion rate",
        evidenceReferences: [issue.evidenceReference],
        confidenceScore: issue.detectionConfidence,
        impactScore: 0.7,
        sourceEngine: issue.sourceEngine,
        sourceUxAuditId: input.audit?.auditId ?? null,
        sourceObservationId: input.audit?.sourceObservationId ?? null,
      });
    }

    return candidates;
  }
}
