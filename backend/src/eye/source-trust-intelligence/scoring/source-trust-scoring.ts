import type { EyeConnector } from "../../connector-registry/models/eye-connector.js";
import type { GlobalProductSignal } from "../../global-product-signals/models/product-signal.js";
import {
  SIGNAL_SOURCE_RELIABILITY,
  type SignalSource,
} from "../../global-product-signals/models/signal-source.js";
import type { ProductEvidenceSummaryCreateInput } from "../../product-evidence-aggregation/models/product-evidence-summary.js";
import {
  resolveTrustTier,
  type SourceTrustProfileCreateInput,
  type TrustTier,
} from "../models/source-trust-profile.js";
import type { SourceTrustSignal, SourceTrustSignalType } from "../models/source-trust-signal.js";

export const SOURCE_TRUST_WEIGHTS: Record<SourceTrustSignalType, number> = {
  historical_accuracy: 0.25,
  signal_consistency: 0.2,
  noise_level: 0.15,
  manipulation_risk: 0.2,
  connector_health: 0.1,
  evidence_alignment: 0.1,
};

export type SourceTrustAnalysisInput = {
  source: SignalSource;
  connectorId?: string | null;
  connector?: EyeConnector | null;
  signals: GlobalProductSignal[];
  evidenceSummary?: ProductEvidenceSummaryCreateInput | null;
};

export type SourceTrustScoreBreakdown = SourceTrustProfileCreateInput;

const CONNECTOR_ID_BY_SOURCE: Partial<Record<SignalSource, string>> = {
  AMAZON: "amazon",
  GOOGLE_TRENDS: "google-trends",
  TIKTOK: "tiktok",
  PINTEREST: "pinterest",
  REDDIT: "reddit",
  SUPPLIER: "cj-dropshipping",
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function maxStrengthDelta(signals: GlobalProductSignal[]): number {
  if (signals.length < 2) return 0;
  const sorted = [...signals].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  let maxDelta = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    maxDelta = Math.max(
      maxDelta,
      Math.abs(sorted[index]!.strength - sorted[index - 1]!.strength),
    );
  }
  return maxDelta;
}

function buildSignal(
  signalType: SourceTrustSignalType,
  score: number,
  detail: string,
): SourceTrustSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: SOURCE_TRUST_WEIGHTS[signalType],
    detail,
  };
}

function computeHistoricalAccuracy(
  source: SignalSource,
  signals: GlobalProductSignal[],
  connector: EyeConnector | null | undefined,
): number {
  const baseline = SIGNAL_SOURCE_RELIABILITY[source];
  const averageConfidence = average(signals.map((signal) => signal.confidence));
  let score = averageConfidence * 0.55 + baseline * 0.45;

  if (connector?.status === "ACTIVE") {
    score += 4;
  }
  if (connector?.health.healthState === "HEALTHY") {
    score += 6;
  }
  if (connector?.health.healthState === "DEGRADED") {
    score -= 8;
  }

  return clampScore(score);
}

function computeSignalConsistency(signals: GlobalProductSignal[]): number {
  if (signals.length === 0) return 0;
  if (signals.length === 1) return 55;

  const strengthStdev = standardDeviation(signals.map((signal) => signal.strength));
  const confidenceStdev = standardDeviation(signals.map((signal) => signal.confidence));
  return clampScore(100 - strengthStdev * 1.2 - confidenceStdev * 0.8);
}

/** Higher values indicate noisier source behavior. */
function computeNoiseLevel(signals: GlobalProductSignal[]): number {
  if (signals.length === 0) return 100;

  const weakSignals = signals.filter((signal) => signal.strength < 45).length;
  const strengthStdev = standardDeviation(signals.map((signal) => signal.strength));
  const lowConfidence = signals.filter((signal) => signal.confidence < 50).length;

  return clampScore(strengthStdev * 1.1 + weakSignals * 12 + lowConfidence * 8);
}

/** Higher values indicate greater manipulation risk. */
function computeManipulationRisk(
  source: SignalSource,
  signals: GlobalProductSignal[],
  connector: EyeConnector | null | undefined,
  evidenceSummary: ProductEvidenceSummaryCreateInput | null | undefined,
): number {
  let risk = 0;

  if (source === "MANUAL") {
    risk += 28;
  }
  if (signals.length === 1) {
    risk += 18;
  }
  if (connector?.health.healthState === "UNHEALTHY") {
    risk += 22;
  }
  if (connector?.status === "DEGRADED" || connector?.status === "PAUSED") {
    risk += 12;
  }
  if (maxStrengthDelta(signals) >= 35) {
    risk += 16;
  }
  if (evidenceSummary?.riskFlags.includes("single_source_evidence")) {
    risk += 10;
  }
  if (evidenceSummary?.riskFlags.includes("manual_only_evidence")) {
    risk += 14;
  }

  return clampScore(risk);
}

function computeConnectorHealthScore(connector: EyeConnector | null | undefined): number {
  if (!connector) return 50;

  const healthStateScore: Record<EyeConnector["health"]["healthState"], number> = {
    HEALTHY: 92,
    DEGRADED: 62,
    UNHEALTHY: 28,
    UNKNOWN: 45,
  };

  let score = healthStateScore[connector.health.healthState];
  if (connector.status === "ACTIVE") {
    score += 5;
  }
  if (connector.status === "PAUSED" || connector.status === "DISABLED") {
    score -= 20;
  }

  return clampScore(score);
}

function computeEvidenceAlignment(
  source: SignalSource,
  signals: GlobalProductSignal[],
  evidenceSummary: ProductEvidenceSummaryCreateInput | null | undefined,
): number {
  if (!evidenceSummary) {
    return clampScore(average(signals.map((signal) => signal.confidence)));
  }

  const sourceEntry = evidenceSummary.sourceBreakdown.find((entry) => entry.source === source);
  if (!sourceEntry) {
    return 40;
  }

  const alignment =
    sourceEntry.averageConfidence * 0.45 +
    sourceEntry.averageStrength * 0.35 +
    Math.min(100, sourceEntry.signalCount * 12) * 0.2;

  if (evidenceSummary.strongestSource === source) {
    return clampScore(alignment + 8);
  }
  if (evidenceSummary.weakestSource === source) {
    return clampScore(alignment - 10);
  }

  return clampScore(alignment);
}

function computeReliabilityScore(
  historicalAccuracy: number,
  signalConsistency: number,
  noiseLevel: number,
  manipulationRisk: number,
  connectorHealthScore: number,
): number {
  return clampScore(
    historicalAccuracy * 0.28 +
      signalConsistency * 0.22 +
      (100 - noiseLevel) * 0.18 +
      (100 - manipulationRisk) * 0.17 +
      connectorHealthScore * 0.15,
  );
}

function computeTrustScore(
  reliabilityScore: number,
  manipulationRisk: number,
  trustSignals: SourceTrustSignal[],
): number {
  const weightedSignals = trustSignals.reduce(
    (total, signal) => total + signal.score * signal.weight,
    0,
  );
  const penalty = manipulationRisk * 0.15;
  return clampScore(reliabilityScore * 0.65 + weightedSignals * 0.35 - penalty);
}

/** Evaluates source trust from connector, signal, and evidence inputs. */
export function scoreSourceTrust(input: SourceTrustAnalysisInput): SourceTrustScoreBreakdown {
  const { source, signals, evidenceSummary } = input;
  if (signals.length === 0) {
    throw new Error("At least one GlobalProductSignal is required for source trust scoring");
  }

  const filtered = signals.filter((signal) => signal.source === source);
  if (filtered.length === 0) {
    throw new Error(`No GlobalProductSignal records found for source ${source}`);
  }

  const connectorId =
    input.connectorId ?? CONNECTOR_ID_BY_SOURCE[source] ?? null;
  const connector = input.connector ?? null;

  const historicalAccuracy = computeHistoricalAccuracy(source, filtered, connector);
  const signalConsistency = computeSignalConsistency(filtered);
  const noiseLevel = computeNoiseLevel(filtered);
  const manipulationRisk = computeManipulationRisk(
    source,
    filtered,
    connector,
    evidenceSummary,
  );
  const connectorHealthScore = computeConnectorHealthScore(connector);
  const evidenceAlignment = computeEvidenceAlignment(source, filtered, evidenceSummary);

  const trustSignals = [
    buildSignal(
      "historical_accuracy",
      historicalAccuracy,
      `Historical accuracy ${historicalAccuracy}`,
    ),
    buildSignal(
      "signal_consistency",
      signalConsistency,
      `Signal consistency ${signalConsistency}`,
    ),
    buildSignal("noise_level", noiseLevel, `Noise level ${noiseLevel}`),
    buildSignal(
      "manipulation_risk",
      manipulationRisk,
      `Manipulation risk ${manipulationRisk}`,
    ),
    buildSignal(
      "connector_health",
      connectorHealthScore,
      connector
        ? `Connector health ${connector.health.healthState}`
        : "No connector profile available",
    ),
    buildSignal(
      "evidence_alignment",
      evidenceAlignment,
      `Evidence alignment ${evidenceAlignment}`,
    ),
  ];

  const reliabilityScore = computeReliabilityScore(
    historicalAccuracy,
    signalConsistency,
    noiseLevel,
    manipulationRisk,
    connectorHealthScore,
  );
  const trustScore = computeTrustScore(reliabilityScore, manipulationRisk, trustSignals);
  const trustTier = resolveTrustTier(trustScore);

  return {
    source,
    connectorId,
    historicalAccuracy,
    signalConsistency,
    noiseLevel,
    manipulationRisk,
    reliabilityScore,
    trustScore,
    trustTier,
    signals: trustSignals,
  };
}

export const sourceTrustScoring = {
  scoreSourceTrust,
  resolveTrustTier,
  weights: SOURCE_TRUST_WEIGHTS,
  connectorIdBySource: CONNECTOR_ID_BY_SOURCE,
};

export type { TrustTier };
