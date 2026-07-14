/** T5-04 — Machine-readable productivity intelligence metadata generation. */

import { randomUUID } from "node:crypto";
import { PRODUCTIVITY_METADATA_VERSION } from "./paths.js";
import type {
  ProductivityIntelligenceRecord,
  ProductivityStatus,
  RawProductivityCandidate,
} from "./types.js";

export class ProductivityMetadataGenerator {
  buildRecords(input: {
    sessionId: string;
    sourceAuditId: string | null;
    sourceObservationId: string | null;
    sourceOpportunityId: string | null;
    currentScreenId: string | null;
    currentRouteOrViewId: string | null;
    candidates: RawProductivityCandidate[];
    recordStatus: ProductivityStatus;
  }): ProductivityIntelligenceRecord[] {
    return input.candidates.map((candidate) => ({
      productivityId: `pie-${randomUUID()}`,
      timestamp: new Date().toISOString(),
      sourceObservationId:
        candidate.sourceObservationId ?? input.sourceObservationId,
      sourceAuditId: candidate.sourceAuditId ?? input.sourceAuditId,
      sourceOpportunityId:
        candidate.sourceOpportunityId ?? input.sourceOpportunityId,
      sessionId: input.sessionId,
      currentScreenId: input.currentScreenId,
      currentRouteOrViewId: input.currentRouteOrViewId,
      workflowPatternSummary: candidate.workflowPatternSummary,
      navigationPatternSummary: candidate.navigationPatternSummary,
      taskSequenceSummary: candidate.taskSequenceSummary,
      bottleneckSummary: candidate.bottleneckSummary,
      productivityObservations: candidate.productivityObservations,
      evidenceReferences: candidate.evidenceReferences,
      confidenceScore: candidate.confidenceScore,
      status: input.recordStatus,
      metadataVersion: PRODUCTIVITY_METADATA_VERSION,
      learnOnly: true,
    }));
  }
}
