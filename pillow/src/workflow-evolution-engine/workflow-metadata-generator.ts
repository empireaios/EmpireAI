/** T5-05 — Machine-readable workflow evolution metadata generation. */

import { randomUUID } from "node:crypto";
import { WORKFLOW_EVOLUTION_METADATA_VERSION } from "./paths.js";
import type {
  EvolutionStatus,
  RawEvolutionCandidate,
  WorkflowEvolutionRecord,
} from "./types.js";

export class WorkflowMetadataGenerator {
  buildRecords(input: {
    sourceAuditId: string | null;
    sourceObservationId: string | null;
    currentScreenId: string | null;
    currentRouteOrViewId: string | null;
    candidates: Array<RawEvolutionCandidate & { priority: import("./types.js").EvolutionPriority }>;
    recordStatus: EvolutionStatus;
  }): WorkflowEvolutionRecord[] {
    return input.candidates.map((candidate) => ({
      workflowEvolutionId: `wfe-${randomUUID()}`,
      timestamp: new Date().toISOString(),
      sourceProductivityIntelligenceId: candidate.sourceProductivityIntelligenceId ?? null,
      sourceOpportunityId: candidate.sourceOpportunityId ?? null,
      sourceUxAuditId: candidate.sourceUxAuditId ?? input.sourceAuditId,
      sourceObservationId: candidate.sourceObservationId ?? input.sourceObservationId,
      currentScreenId: input.currentScreenId,
      currentRouteOrViewId: input.currentRouteOrViewId,
      workflowFrictionSummary: candidate.workflowFrictionSummary,
      recommendedWorkflowImprovements: candidate.recommendedWorkflowImprovements,
      estimatedProductivityBenefit: candidate.estimatedProductivityBenefit,
      evolutionCategory: candidate.evolutionCategory,
      priority: candidate.priority,
      evidenceReferences: candidate.evidenceReferences,
      confidenceScore: candidate.confidenceScore,
      status: input.recordStatus,
      metadataVersion: WORKFLOW_EVOLUTION_METADATA_VERSION,
      recommendOnly: true,
    }));
  }
}
