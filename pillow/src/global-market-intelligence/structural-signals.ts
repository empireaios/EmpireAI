/** X4-09 — Shared structural market scoring helpers (no live market feed APIs). */

import { GMI_METADATA_VERSION } from "./paths.js";
import type { GlobalMarketIntelligenceConfiguration } from "./configuration.js";
import type {
  MarketAnalysisInput,
  MarketCategory,
  MarketIntelligenceRecord,
  MarketSignal,
  RiskLevel,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCountry(input?: MarketAnalysisInput): string {
  return (input?.country?.trim() || "SG").toUpperCase();
}

export function defaultRegion(input?: MarketAnalysisInput): string {
  return (input?.region?.trim() || "APAC").toUpperCase();
}

export function defaultCategory(input?: MarketAnalysisInput): MarketCategory {
  return input?.marketCategory ?? "international_market";
}

export function riskLevelFromCompetition(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  return "informational";
}

export function resolveMarketSignal(
  opportunityScore: number,
  emergingDetected: boolean,
  decliningDetected: boolean,
  validated: boolean,
): MarketSignal {
  if (!validated) return "unknown";
  if (decliningDetected) return "declining";
  if (emergingDetected) return "emerging";
  if (opportunityScore >= 40 && opportunityScore <= 70) return "stable";
  return "volatile";
}

export function computeStructuralMarketSignals(
  input: MarketAnalysisInput,
  _config: GlobalMarketIntelligenceConfiguration,
): {
  country: string;
  region: string;
  marketCategory: MarketCategory;
  demandScore: number;
  competitionScore: number;
  opportunityScore: number;
  recommendationSummary: string;
  marketSignal: MarketSignal;
  riskLevel: RiskLevel;
  emergingDetected: boolean;
  decliningDetected: boolean;
  marketTraceId: string;
} {
  const country = defaultCountry(input);
  const region = defaultRegion(input);
  const marketCategory = defaultCategory(input);
  const validated = input.validated === true;
  const seed = `${country}::${region}::${marketCategory}`;

  const demandScore = Math.round(input.demandHint ?? hashScore(`${seed}:demand`, 20, 95));
  const competitionScore = Math.round(
    input.competitionHint ?? hashScore(`${seed}:comp`, 15, 90),
  );
  const opportunityScore = Math.round(
    input.opportunityHint ??
      Math.max(0, Math.min(100, demandScore - Math.round(competitionScore * 0.45) + 20)),
  );
  const emergingDetected =
    input.emergingHint === true || (validated && opportunityScore >= 70 && demandScore >= 65);
  const decliningDetected =
    input.decliningHint === true || (validated && opportunityScore <= 30 && demandScore <= 40);

  const marketSignal = resolveMarketSignal(
    opportunityScore,
    emergingDetected,
    decliningDetected,
    validated,
  );
  const riskLevel = riskLevelFromCompetition(competitionScore);
  const marketTraceId = `gmi-trace-${hashScore(seed, 100000, 999999)}`;

  const recommendationSummary = !validated
    ? `Unvalidated market signal for ${country}/${region} — recommendations blocked`
    : emergingDetected
      ? `Emerging opportunity in ${country}/${region} (opp=${opportunityScore})`
      : decliningDetected
        ? `Declining market signal in ${country}/${region} (opp=${opportunityScore})`
        : `Monitor ${marketCategory} in ${country}/${region} (demand=${demandScore}, competition=${competitionScore})`;

  return {
    country,
    region,
    marketCategory,
    demandScore: Math.max(0, Math.min(100, demandScore)),
    competitionScore: Math.max(0, Math.min(100, competitionScore)),
    opportunityScore: Math.max(0, Math.min(100, opportunityScore)),
    recommendationSummary,
    marketSignal,
    riskLevel,
    emergingDetected,
    decliningDetected,
    marketTraceId,
  };
}

export function buildMarketIntelligenceRecord(
  signals: ReturnType<typeof computeStructuralMarketSignals>,
  validationStatus: MarketIntelligenceRecord["validationStatus"] = "passed",
  rankingPosition: number | null = null,
): MarketIntelligenceRecord {
  return {
    marketIntelligenceId: `gmi-${Date.now()}-${signals.country}-${signals.marketCategory}`,
    timestamp: new Date().toISOString(),
    country: signals.country,
    region: signals.region,
    marketCategory: signals.marketCategory,
    demandScore: signals.demandScore,
    competitionScore: signals.competitionScore,
    opportunityScore: signals.opportunityScore,
    recommendationSummary: signals.recommendationSummary,
    validationStatus,
    metadataVersion: GMI_METADATA_VERSION,
    marketSignal: signals.marketSignal,
    riskLevel: signals.riskLevel,
    rankingPosition,
    emergingDetected: signals.emergingDetected,
    decliningDetected: signals.decliningDetected,
    marketTraceId: signals.marketTraceId,
    structuralSignalOnly: true,
    neverRecommendWithUnvalidatedIntelligence: true,
    unvalidatedRecommendationClaim: "none",
  };
}
