/** T5-07 — Machine-readable UX evolution metadata generation. */

import { randomUUID } from "node:crypto";
import { UX_EVOLUTION_METADATA_VERSION } from "./paths.js";
import type {
  EvolutionStatus,
  ImprovementPriority,
  RawEvolutionCandidate,
  UxEvolutionRecord,
} from "./types.js";

export class EvolutionMetadataGenerator {
  buildRecords(input: {
    currentScreenId: string | null;
    currentRouteOrViewId: string | null;
    candidates: Array<RawEvolutionCandidate & { improvementPriority: ImprovementPriority }>;
    recordStatus: EvolutionStatus;
  }): UxEvolutionRecord[] {
    return input.candidates.map((candidate) => ({
      uxEvolutionId: `cue-${randomUUID()}`,
      timestamp: new Date().toISOString(),
      sourceAdaptiveInterfaceId: candidate.sourceAdaptiveInterfaceId ?? null,
      sourceWorkflowEvolutionId: candidate.sourceWorkflowEvolutionId ?? null,
      sourceProductivityIntelligenceId: candidate.sourceProductivityIntelligenceId ?? null,
      sourceOpportunityId: candidate.sourceOpportunityId ?? null,
      currentScreenId: input.currentScreenId,
      currentRouteOrViewId: input.currentRouteOrViewId,
      recommendedUxImprovements: candidate.recommendedUxImprovements,
      expectedUxBenefit: candidate.expectedUxBenefit,
      evolutionCategory: candidate.evolutionCategory,
      improvementPriority: candidate.improvementPriority,
      evidenceReferences: candidate.evidenceReferences,
      confidenceScore: candidate.confidenceScore,
      status: input.recordStatus,
      metadataVersion: UX_EVOLUTION_METADATA_VERSION,
      recommendOnly: true,
    }));
  }
}
