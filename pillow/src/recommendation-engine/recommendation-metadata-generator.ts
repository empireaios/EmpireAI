/** T2-09 — Recommendation metadata generation. */

import { RECOMMENDATION_METADATA_VERSION } from "./paths.js";
import type { RedesignProposal, RecommendationRecord } from "./types.js";

export class RecommendationMetadataGenerator {
  buildRecordId(): string {
    return `rec-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildProposalId(category: string): string {
    return `rec-${category}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichProposal(proposal: RedesignProposal): RedesignProposal {
    return { ...proposal, metadataVersion: RECOMMENDATION_METADATA_VERSION };
  }

  enrichRecord(record: RecommendationRecord): RecommendationRecord {
    return { ...record, metadataVersion: RECOMMENDATION_METADATA_VERSION };
  }
}
