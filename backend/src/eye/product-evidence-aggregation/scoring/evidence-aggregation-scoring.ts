import type { GlobalProductSignal } from "../../global-product-signals/models/product-signal.js";
import {
  SIGNAL_SOURCES,
  type SignalSource,
} from "../../global-product-signals/models/signal-source.js";
import type {
  EvidenceAggregationSignal,
  EvidenceAggregationSignalType,
  SourceStrengthSummary,
} from "../models/evidence-aggregation-signal.js";
import type {
  EvidenceTrendDirection,
  ProductEvidenceSummaryCreateInput,
} from "../models/product-evidence-summary.js";

export const EVIDENCE_AGGREGATION_WEIGHTS: Record<EvidenceAggregationSignalType, number> = {
  source_coverage: 0.2,
  strength_average: 0.25,
  confidence_average: 0.2,
  diversity: 0.15,
  trend: 0.1,
  risk: 0.1,
};

export type EvidenceAggregationScoreBreakdown = ProductEvidenceSummaryCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignal(
  signalType: EvidenceAggregationSignalType,
  score: number,
  detail: string,
): EvidenceAggregationSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: EVIDENCE_AGGREGATION_WEIGHTS[signalType],
    detail,
  };
}

function buildSourceBreakdown(signals: GlobalProductSignal[]): SourceStrengthSummary[] {
  const grouped = new Map<SignalSource, GlobalProductSignal[]>();

  for (const signal of signals) {
    const bucket = grouped.get(signal.source) ?? [];
    bucket.push(signal);
    grouped.set(signal.source, bucket);
  }

  return [...grouped.entries()]
    .map(([source, entries]) => ({
      source,
      averageStrength: clampScore(average(entries.map((entry) => entry.strength))),
      averageConfidence: clampScore(average(entries.map((entry) => entry.confidence))),
      signalCount: entries.length,
    }))
    .sort((left, right) => right.averageStrength - left.averageStrength);
}

function resolveStrongestAndWeakest(breakdown: SourceStrengthSummary[]): {
  strongestSource: SignalSource;
  weakestSource: SignalSource;
} {
  if (breakdown.length === 0) {
    return { strongestSource: "MANUAL", weakestSource: "MANUAL" };
  }

  const sorted = [...breakdown].sort((left, right) => right.averageStrength - left.averageStrength);
  return {
    strongestSource: sorted[0]!.source,
    weakestSource: sorted[sorted.length - 1]!.source,
  };
}

function computeSourceDiversity(uniqueSourceCount: number): number {
  return clampScore((uniqueSourceCount / SIGNAL_SOURCES.length) * 100);
}

function resolveTrendDirection(signals: GlobalProductSignal[]): EvidenceTrendDirection {
  if (signals.length < 2) return "stable";

  const sorted = [...signals].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  const midpoint = Math.floor(sorted.length / 2);
  const earlier = sorted.slice(0, midpoint);
  const later = sorted.slice(midpoint);
  const earlierAvg = average(earlier.map((signal) => signal.strength));
  const laterAvg = average(later.map((signal) => signal.strength));
  const delta = laterAvg - earlierAvg;

  if (delta >= 8) return "rising";
  if (delta <= -8) return "falling";
  return "stable";
}

function buildRiskFlags(
  signals: GlobalProductSignal[],
  sourceDiversity: number,
  averageConfidence: number,
): string[] {
  const flags: string[] = [];

  if (signals.length === 1) {
    flags.push("single_source_evidence");
  }
  if (sourceDiversity < 30) {
    flags.push("low_source_diversity");
  }
  if (averageConfidence < 55) {
    flags.push("low_average_confidence");
  }
  if (signals.some((signal) => signal.strength < 40)) {
    flags.push("weak_signal_present");
  }
  if (signals.every((signal) => signal.source === "MANUAL")) {
    flags.push("manual_only_evidence");
  }

  return flags;
}

function computeRiskScore(riskFlags: string[]): number {
  return clampScore(100 - riskFlags.length * 18);
}

/** Aggregates M031 global product signals into a product evidence summary. */
export function aggregateProductEvidence(
  productId: string,
  signals: GlobalProductSignal[],
): EvidenceAggregationScoreBreakdown {
  if (signals.length === 0) {
    throw new Error("At least one GlobalProductSignal is required for aggregation");
  }

  const filtered = signals.filter((signal) => signal.productId === productId);
  if (filtered.length === 0) {
    throw new Error(`No GlobalProductSignal records found for productId ${productId}`);
  }

  const sourceBreakdown = buildSourceBreakdown(filtered);
  const { strongestSource, weakestSource } = resolveStrongestAndWeakest(sourceBreakdown);
  const totalSignals = filtered.length;
  const uniqueSources = new Set(filtered.map((signal) => signal.source)).size;
  const sourceDiversity = computeSourceDiversity(uniqueSources);
  const averageStrength = clampScore(average(filtered.map((signal) => signal.strength)));
  const averageConfidence = clampScore(average(filtered.map((signal) => signal.confidence)));
  const trendDirection = resolveTrendDirection(filtered);
  const riskFlags = buildRiskFlags(filtered, sourceDiversity, averageConfidence);

  const aggregationSignals = [
    buildSignal(
      "source_coverage",
      clampScore((uniqueSources / Math.max(totalSignals, 1)) * 100),
      `${uniqueSources} unique source(s) across ${totalSignals} signal(s)`,
    ),
    buildSignal("strength_average", averageStrength, `Average strength ${averageStrength}`),
    buildSignal(
      "confidence_average",
      averageConfidence,
      `Average confidence ${averageConfidence}`,
    ),
    buildSignal("diversity", sourceDiversity, `Source diversity ${sourceDiversity}`),
    buildSignal(
      "trend",
      trendDirection === "rising" ? 85 : trendDirection === "falling" ? 35 : 60,
      `Trend direction ${trendDirection}`,
    ),
    buildSignal("risk", computeRiskScore(riskFlags), `${riskFlags.length} risk flag(s) detected`),
  ];

  const evidenceScore = clampScore(
    aggregationSignals.reduce((total, signal) => total + signal.score * signal.weight, 0),
  );

  return {
    productId,
    totalSignals,
    sourceDiversity,
    averageStrength,
    averageConfidence,
    strongestSource,
    weakestSource,
    evidenceScore,
    trendDirection,
    riskFlags,
    sourceBreakdown,
    signals: aggregationSignals,
  };
}

export const evidenceAggregationScoring = {
  aggregateProductEvidence,
  weights: EVIDENCE_AGGREGATION_WEIGHTS,
};
