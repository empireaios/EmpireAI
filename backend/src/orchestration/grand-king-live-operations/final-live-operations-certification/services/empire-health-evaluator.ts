/**
 * G7-10 — Empire health evaluator for live launch certification.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { ValidatedLiveDomainResult } from "../contracts/final-live-operations-certification-types.js";

export async function evaluateEmpireHealthForLaunch(input: {
  validatedDomains: ValidatedLiveDomainResult[];
  context?: RegistryLoaderContext;
}): Promise<number> {
  if (input.validatedDomains.length === 0) return 0;

  let intelligenceScore: number | undefined;
  try {
    const { computeEmpireHealthScore } = await import("../../../grand-king-operational-intelligence-executive-insights/services/executive-kpi-intelligence.js");
    intelligenceScore = computeEmpireHealthScore(input.context ?? {}).score;
  } catch {
    intelligenceScore = undefined;
  }

  const domainScore = Math.round(
    input.validatedDomains.reduce((sum, d) => sum + d.score, 0) / input.validatedDomains.length,
  );

  if (intelligenceScore !== undefined) {
    return Math.round((domainScore + intelligenceScore) / 2);
  }
  return domainScore;
}
