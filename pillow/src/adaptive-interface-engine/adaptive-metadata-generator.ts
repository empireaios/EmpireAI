/** T5-06 — Machine-readable adaptive interface metadata generation. */

import { randomUUID } from "node:crypto";
import { ADAPTIVE_METADATA_VERSION } from "./paths.js";
import type {
  AdaptationStatus,
  RawAdaptationCandidate,
  AdaptiveInterfaceRecord,
} from "./types.js";

export class AdaptiveMetadataGenerator {
  buildRecords(input: {
    currentScreenId: string | null;
    currentRouteOrViewId: string | null;
    candidates: Array<RawAdaptationCandidate & { priority: import("./types.js").AdaptationPriority }>;
    recordStatus: AdaptationStatus;
  }): AdaptiveInterfaceRecord[] {
    return input.candidates.map((candidate) => ({
      adaptiveInterfaceId: `aie-${randomUUID()}`,
      timestamp: new Date().toISOString(),
      sourceWorkflowEvolutionId: candidate.sourceWorkflowEvolutionId ?? null,
      sourceProductivityIntelligenceId: candidate.sourceProductivityIntelligenceId ?? null,
      sourceOpportunityId: candidate.sourceOpportunityId ?? null,
      sourceObservationId: candidate.sourceObservationId ?? null,
      currentScreenId: input.currentScreenId,
      currentRouteOrViewId: input.currentRouteOrViewId,
      currentWorkflowContext: candidate.currentWorkflowContext,
      recommendedInterfaceAdaptations: candidate.recommendedInterfaceAdaptations,
      recommendedNavigationAdaptations: candidate.recommendedNavigationAdaptations,
      recommendedWorkspaceAdaptations: candidate.recommendedWorkspaceAdaptations,
      expectedProductivityBenefit: candidate.expectedProductivityBenefit,
      adaptationCategory: candidate.adaptationCategory,
      priority: candidate.priority,
      evidenceReferences: candidate.evidenceReferences,
      confidenceScore: candidate.confidenceScore,
      status: input.recordStatus,
      metadataVersion: ADAPTIVE_METADATA_VERSION,
      recommendOnly: true,
    }));
  }
}
