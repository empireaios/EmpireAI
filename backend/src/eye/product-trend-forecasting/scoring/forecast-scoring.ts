import type { ProductTrend } from "../../product-trend-intelligence/models/product-trend.js";
import {
  resolveForecastDirection,
  resolveRecommendedAction,
  type ProductTrendForecastCreateInput,
} from "../models/product-trend-forecast.js";
import type { ForecastSignal, ForecastSignalType, TrendSnapshot } from "../models/forecast-signal.js";

export const FORECAST_SIGNAL_WEIGHTS: Record<ForecastSignalType, number> = {
  momentum_projection: 0.25,
  risk_projection: 0.2,
  opportunity_projection: 0.25,
  velocity_projection: 0.15,
  confidence: 0.1,
  snapshot_coverage: 0.05,
};

export type ProductTrendForecastInput = {
  current: ProductTrend;
  history: ProductTrend[];
};

export type ProductTrendForecastBreakdown = ProductTrendForecastCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(signalType: ForecastSignalType, score: number, detail: string): ForecastSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: FORECAST_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function toSnapshot(trend: ProductTrend): TrendSnapshot {
  return {
    capturedAt: trend.updatedAt,
    trendVelocity: trend.trendVelocity,
    trendStrength: trend.trendStrength,
    momentumScore: trend.momentumScore,
    volatilityScore: trend.volatilityScore,
    trendConfidence: trend.trendConfidence,
  };
}

function sortSnapshots(snapshots: TrendSnapshot[]): TrendSnapshot[] {
  return [...snapshots].sort((left, right) => left.capturedAt.localeCompare(right.capturedAt));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function projectVelocity(current: ProductTrend, snapshots: TrendSnapshot[]): number {
  if (snapshots.length < 2) {
    return current.trendVelocity + Math.round(current.momentumScore / 20);
  }

  const velocities = snapshots.map((snapshot) => snapshot.trendVelocity);
  const recentDelta = velocities[velocities.length - 1]! - velocities[0]!;
  return Math.round(current.trendVelocity + recentDelta * 0.35 + current.momentumScore / 25);
}

function projectMomentum(current: ProductTrend, snapshots: TrendSnapshot[]): number {
  const momentumValues = snapshots.map((snapshot) => snapshot.momentumScore);
  const trend = momentumValues.length >= 2 ? momentumValues[momentumValues.length - 1]! - momentumValues[0]! : 0;
  return clampScore(current.momentumScore + trend * 0.4);
}

function projectRisk(current: ProductTrend, snapshots: TrendSnapshot[]): number {
  const volatility = average(snapshots.map((snapshot) => snapshot.volatilityScore));
  const decliningPenalty = current.trendDirection === "DECLINING" ? 15 : 0;
  return clampScore(volatility * 0.7 + decliningPenalty);
}

function projectOpportunity(
  projectedVelocity: number,
  momentumProjection: number,
  riskProjection: number,
): number {
  return clampScore(
    Math.max(0, projectedVelocity) * 2 + momentumProjection * 0.45 + (100 - riskProjection) * 0.25,
  );
}

function computeForecastConfidence(current: ProductTrend, snapshots: TrendSnapshot[]): number {
  const coverage = clampScore(30 + snapshots.length * 10);
  return clampScore(current.trendConfidence * 0.55 + coverage * 0.25 + current.trendStrength * 0.2);
}

/** Forecasts future product trend movement from current and historical trend snapshots. */
export function scoreProductTrendForecast(input: ProductTrendForecastInput): ProductTrendForecastBreakdown {
  const historySnapshots = input.history
    .filter((trend) => trend.productId === input.current.productId)
    .map(toSnapshot);
  const currentSnapshot = toSnapshot(input.current);
  const snapshots = sortSnapshots([...historySnapshots, currentSnapshot]);

  const projectedVelocity = projectVelocity(input.current, snapshots);
  const forecastDirection = resolveForecastDirection(projectedVelocity);
  const momentumProjection = projectMomentum(input.current, snapshots);
  const riskProjection = projectRisk(input.current, snapshots);
  const opportunityProjection = projectOpportunity(
    projectedVelocity,
    momentumProjection,
    riskProjection,
  );
  const forecastConfidence = computeForecastConfidence(input.current, snapshots);
  const recommendedAction = resolveRecommendedAction(
    forecastDirection,
    opportunityProjection,
    riskProjection,
  );

  const signals = [
    buildSignal(
      "velocity_projection",
      clampScore(Math.abs(projectedVelocity) * 4),
      `Projected velocity ${projectedVelocity}`,
    ),
    buildSignal(
      "momentum_projection",
      momentumProjection,
      `Momentum projection ${momentumProjection}`,
    ),
    buildSignal("risk_projection", riskProjection, `Risk projection ${riskProjection}`),
    buildSignal(
      "opportunity_projection",
      opportunityProjection,
      `Opportunity projection ${opportunityProjection}`,
    ),
    buildSignal("confidence", forecastConfidence, `Forecast confidence ${forecastConfidence}`),
    buildSignal(
      "snapshot_coverage",
      clampScore(25 + snapshots.length * 12),
      `${snapshots.length} trend snapshot(s) analyzed`,
    ),
  ];

  return {
    productId: input.current.productId,
    trendId: input.current.id,
    forecastDirection,
    forecastConfidence,
    momentumProjection,
    riskProjection,
    opportunityProjection,
    recommendedAction,
    signals,
    snapshotCount: snapshots.length,
  };
}

export const forecastScoring = {
  scoreProductTrendForecast,
  weights: FORECAST_SIGNAL_WEIGHTS,
};
