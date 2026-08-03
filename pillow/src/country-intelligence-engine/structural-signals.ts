/** X4-02 — Shared structural country scoring helpers (no live external APIs). */

import { CIE_METADATA_VERSION } from "./paths.js";
import type { CountryIntelligenceEngineConfiguration } from "./configuration.js";
import type {
  CountryEvaluationInput,
  CountryIntelligenceRecord,
  ExpansionPriority,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCountry(input?: CountryEvaluationInput): string {
  return input?.country?.trim() || "country-default";
}

export function compositeScore(record: {
  marketSizeScore: number;
  economicScore: number;
  commerceReadinessScore: number;
  operationalFeasibilityScore: number;
}): number {
  return Math.round(
    record.marketSizeScore * 0.25 +
      record.economicScore * 0.25 +
      record.commerceReadinessScore * 0.25 +
      record.operationalFeasibilityScore * 0.25,
  );
}

export function priorityFromScore(
  score: number,
  readinessThreshold: number,
): ExpansionPriority {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= readinessThreshold) return "medium";
  if (score >= 40) return "low";
  return "deferred";
}

export function computeStructuralSignals(
  input: CountryEvaluationInput,
  config: CountryIntelligenceEngineConfiguration,
): Omit<
  CountryIntelligenceRecord,
  | "countryIntelligenceId"
  | "timestamp"
  | "recommendationSummary"
  | "validationStatus"
  | "metadataVersion"
  | "structuralSignalOnly"
> {
  const country = defaultCountry(input);
  const seed = `cie::${country}`;

  const marketSizeScore = Math.round(
    input.marketSizeHint ?? hashScore(`${seed}:market`, 35, 95),
  );
  const economicScore = Math.round(
    input.economicHint ?? hashScore(`${seed}:econ`, 30, 92),
  );
  const purchasingPower = Math.round(
    input.purchasingPowerHint ?? hashScore(`${seed}:ppp`, 28, 90),
  );
  const competitiveLandscape = Math.round(
    input.competitiveLandscapeHint ?? hashScore(`${seed}:comp`, 25, 88),
  );
  const easeOfDoingBusiness = Math.round(
    input.easeOfDoingBusinessHint ?? hashScore(`${seed}:eodb`, 30, 90),
  );
  const commerceReadinessScore = Math.round(
    input.commerceReadinessHint ??
      (purchasingPower * 0.35 +
        competitiveLandscape * 0.25 +
        hashScore(`${seed}:digital`, 40, 92) * 0.4),
  );
  const operationalFeasibilityScore = Math.round(
    input.operationalFeasibilityHint ??
      (easeOfDoingBusiness * 0.55 + hashScore(`${seed}:ops`, 35, 90) * 0.45),
  );

  const blendedEconomic = Math.round(
    economicScore * 0.7 + purchasingPower * 0.3,
  );
  const score = compositeScore({
    marketSizeScore: Math.max(0, Math.min(100, marketSizeScore)),
    economicScore: Math.max(0, Math.min(100, blendedEconomic)),
    commerceReadinessScore: Math.max(0, Math.min(100, commerceReadinessScore)),
    operationalFeasibilityScore: Math.max(
      0,
      Math.min(100, operationalFeasibilityScore),
    ),
  });

  return {
    country,
    marketSizeScore: Math.max(0, Math.min(100, marketSizeScore)),
    economicScore: Math.max(0, Math.min(100, blendedEconomic)),
    commerceReadinessScore: Math.max(0, Math.min(100, commerceReadinessScore)),
    operationalFeasibilityScore: Math.max(
      0,
      Math.min(100, operationalFeasibilityScore),
    ),
    expansionPriority: priorityFromScore(score, config.readinessThreshold),
  };
}

export function buildCountryRecord(
  signals: ReturnType<typeof computeStructuralSignals>,
  summary: string,
  validationStatus: CountryIntelligenceRecord["validationStatus"] = "passed",
): CountryIntelligenceRecord {
  return {
    countryIntelligenceId: `cie-${Date.now()}-${signals.country.replace(/\s+/g, "-").toLowerCase()}`,
    timestamp: new Date().toISOString(),
    country: signals.country,
    marketSizeScore: signals.marketSizeScore,
    economicScore: signals.economicScore,
    commerceReadinessScore: signals.commerceReadinessScore,
    operationalFeasibilityScore: signals.operationalFeasibilityScore,
    expansionPriority: signals.expansionPriority,
    recommendationSummary: summary,
    validationStatus,
    metadataVersion: CIE_METADATA_VERSION,
    structuralSignalOnly: true,
  };
}
