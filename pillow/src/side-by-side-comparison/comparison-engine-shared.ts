/** T4-05 — Shared comparison helpers for category engines. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { VisualDifferenceMarker } from "./types.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";

export type CategoryComparisonResult = {
  differenceSummary: string;
  markers: VisualDifferenceMarker[];
  confidence: number;
};

export function compareProposalTexts(
  baseline: string,
  compared: string,
  region: string,
  metadata: ComparisonMetadataGenerator,
): VisualDifferenceMarker[] {
  if (baseline === compared) return [];
  return [
    {
      markerId: metadata.buildMarkerId(),
      region,
      differenceType: "content_change",
      description: `Change in ${region}: "${compared.slice(0, 80)}"`,
      severity: compared.length > baseline.length ? "medium" : "low",
    },
  ];
}

export function proposalsForCategory(
  proposals: RedesignProposalRecord[],
  categories: string[],
): RedesignProposalRecord[] {
  return proposals.filter((p) => categories.includes(p.proposalCategory));
}
