import type { ProductEvidenceSummary } from "../../product-evidence-aggregation/models/product-evidence-summary.js";
import {
  resolveProductTrendDirection,
  type ProductTrendCreateInput,
  type ProductTrendDirection,
} from "../models/product-trend.js";
import type { EvidenceSnapshot, TrendSignal, TrendSignalType } from "../models/trend-signal.js";

export const TREND_SIGNAL_WEIGHTS: Record<TrendSignalType, number> = {
  velocity: 0.25,
  strength: 0.2,
  momentum: 0.2,
  volatility: 0.1,
  confidence: 0.15,
  snapshot_coverage: 0.1,
};

export type ProductTrendAnalysisInput = {
  productId: string;
  current: ProductEvidenceSummary;
  history: ProductEvidenceSummary[];
};

export type ProductTrendScoreBreakdown = ProductTrendCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(signalType: TrendSignalType, score: number, detail: string): TrendSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: TREND_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function toSnapshot(summary: ProductEvidenceSummary): EvidenceSnapshot {
  return {
    capturedAt: summary.updatedAt,
    evidenceScore: summary.evidenceScore,
    averageStrength: summary.averageStrength,
    averageConfidence: summary.averageConfidence,
    sourceDiversity: summary.sourceDiversity,
    totalSignals: summary.totalSignals,
  };
}

function sortSnapshots(snapshots: EvidenceSnapshot[]): EvidenceSnapshot[] {
  return [...snapshots].sort((left, right) => left.capturedAt.localeCompare(right.capturedAt));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function computeVelocity(snapshots: EvidenceSnapshot[]): number {
  if (snapshots.length < 2) return 0;
  const first = snapshots[0]!;
  const last = snapshots[snapshots.length - 1]!;
  return Math.round((last.evidenceScore - first.evidenceScore) / Math.max(snapshots.length - 1, 1));
}

function computeMomentum(snapshots: EvidenceSnapshot[]): number {
  if (snapshots.length < 3) {
    return clampScore(Math.abs(computeVelocity(snapshots)) * 4);
  }

  const deltas: number[] = [];
  for (let index = 1; index < snapshots.length; index += 1) {
    deltas.push(snapshots[index]!.evidenceScore - snapshots[index - 1]!.evidenceScore);
  }

  const recent = deltas.slice(-2);
  const earlier = deltas.slice(0, -2);
  const recentAvg = average(recent);
  const earlierAvg = average(earlier.length > 0 ? earlier : recent);
  return clampScore(50 + (recentAvg - earlierAvg) * 2);
}

function computeVolatility(snapshots: EvidenceSnapshot[]): number {
  if (snapshots.length < 2) return 0;
  const scores = snapshots.map((snapshot) => snapshot.evidenceScore);
  const mean = average(scores);
  const variance =
    scores.reduce((total, score) => total + (score - mean) ** 2, 0) / Math.max(scores.length - 1, 1);
  return clampScore(Math.sqrt(variance));
}

function computeTrendStrength(velocity: number, snapshots: EvidenceSnapshot[]): number {
  const span =
    snapshots.length >= 2
      ? Math.abs(snapshots[snapshots.length - 1]!.evidenceScore - snapshots[0]!.evidenceScore)
      : 0;
  return clampScore(Math.abs(velocity) * 3 + span * 0.4);
}

function computeTrendConfidence(snapshots: EvidenceSnapshot[]): number {
  const coverage = clampScore(30 + snapshots.length * 12);
  const confidenceAvg = clampScore(average(snapshots.map((snapshot) => snapshot.averageConfidence)));
  return clampScore(coverage * 0.45 + confidenceAvg * 0.55);
}

/** Scores product trend direction and movement metrics from evidence history. */
export function scoreProductTrend(input: ProductTrendAnalysisInput): ProductTrendScoreBreakdown {
  const historySnapshots = input.history
    .filter((summary) => summary.productId === input.productId)
    .map(toSnapshot);
  const currentSnapshot = toSnapshot(input.current);
  const snapshots = sortSnapshots([...historySnapshots, currentSnapshot]);

  if (snapshots.length === 0) {
    throw new Error("At least one evidence snapshot is required for trend analysis");
  }

  const trendVelocity = computeVelocity(snapshots);
  const trendDirection: ProductTrendDirection = resolveProductTrendDirection(trendVelocity);
  const trendStrength = computeTrendStrength(trendVelocity, snapshots);
  const trendConfidence = computeTrendConfidence(snapshots);
  const momentumScore = computeMomentum(snapshots);
  const volatilityScore = computeVolatility(snapshots);

  const signals = [
    buildSignal("velocity", clampScore(Math.abs(trendVelocity) * 4), `Trend velocity ${trendVelocity}`),
    buildSignal("strength", trendStrength, `Trend strength ${trendStrength}`),
    buildSignal("momentum", momentumScore, `Momentum score ${momentumScore}`),
    buildSignal(
      "volatility",
      clampScore(100 - volatilityScore),
      `Volatility score ${volatilityScore}`,
    ),
    buildSignal("confidence", trendConfidence, `Trend confidence ${trendConfidence}`),
    buildSignal(
      "snapshot_coverage",
      clampScore(25 + snapshots.length * 15),
      `${snapshots.length} evidence snapshot(s) analyzed`,
    ),
  ];

  return {
    productId: input.productId,
    trendDirection,
    trendVelocity,
    trendStrength,
    trendConfidence,
    momentumScore,
    volatilityScore,
    snapshotCount: snapshots.length,
    signals,
  };
}

export const trendScoring = {
  scoreProductTrend,
  weights: TREND_SIGNAL_WEIGHTS,
};
