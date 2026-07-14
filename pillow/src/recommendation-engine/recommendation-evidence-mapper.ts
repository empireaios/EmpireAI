/** T2-09 — Recommendation evidence mapping. */

import type { RedesignProposal } from "./types.js";
import type { ImprovementOpportunity } from "./improvement-opportunity-detector.js";

export class RecommendationEvidenceMapper {
  mapProposalEvidence(
    proposal: RedesignProposal,
    opportunity: ImprovementOpportunity,
  ): RedesignProposal {
    return {
      ...proposal,
      sourceFindingIds: [...new Set([...proposal.sourceFindingIds, opportunity.sourceId])],
      evidenceReferences: [
        ...new Set([
          ...proposal.evidenceReferences,
          opportunity.sourceId,
          `source:${opportunity.source}`,
        ]),
      ],
    };
  }

  collectRecordEvidence(proposals: RedesignProposal[]): string[] {
    return [
      ...new Set(
        proposals.flatMap((p) => [
          ...p.evidenceReferences,
          ...p.sourceFindingIds,
          ...(p.sourceUxScoreId ? [p.sourceUxScoreId] : []),
        ]),
      ),
    ];
  }
}
