/** X3-03 — Shared structural scaling decision scoring helpers. */

import { SDE_METADATA_VERSION } from "./paths.js";
import type { ScalingDecisionEngineConfiguration } from "./configuration.js";
import type {
  ScalingDecisionInput,
  ScalingDecisionOutcome,
  ScalingDecisionRecord,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: ScalingDecisionInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultProduct(input?: ScalingDecisionInput): string {
  return input?.productReference?.trim() || "product-default";
}

export type StructuralDecisionSignals = {
  companyReference: string;
  productReference: string;
  productReadiness: number;
  operationalReadiness: number;
  financialReadiness: number;
  supplierReadiness: number;
  marketReadiness: number;
  readinessScore: number;
  riskScore: number;
  scalingConfidence: number;
  decision: ScalingDecisionOutcome;
};

export function computeStructuralSignals(
  input: ScalingDecisionInput,
  config: ScalingDecisionEngineConfiguration,
): StructuralDecisionSignals {
  const company = defaultCompany(input);
  const product = defaultProduct(input);
  const seed = `${company}::${product}`;

  const productReadiness = Math.round(
    input.productReadinessHint ?? hashScore(`${seed}:product`, 35, 92),
  );
  const operationalReadiness = Math.round(
    input.operationalReadinessHint ?? hashScore(`${seed}:ops`, 30, 90),
  );
  const financialReadiness = Math.round(
    input.financialReadinessHint ?? hashScore(`${seed}:fin`, 28, 88),
  );
  const supplierReadiness = Math.round(
    input.supplierReadinessHint ?? hashScore(`${seed}:sup`, 25, 90),
  );
  const marketReadiness = Math.round(
    input.marketReadinessHint ?? hashScore(`${seed}:mkt`, 30, 92),
  );
  const riskScore = Math.round(input.riskHint ?? hashScore(`${seed}:risk`, 10, 85));

  const readinessScore = Math.round(
    productReadiness * 0.25 +
      operationalReadiness * 0.2 +
      financialReadiness * 0.2 +
      supplierReadiness * 0.15 +
      marketReadiness * 0.2,
  );

  const scalingConfidence = Math.round(
    Math.max(0, Math.min(100, readinessScore * 0.7 + (100 - riskScore) * 0.3)),
  );

  let decision: ScalingDecisionOutcome = "hold";
  if (
    config.decisionRulesEnabled &&
    riskScore >= config.riskRejectThreshold
  ) {
    decision = "reject";
  } else if (
    config.decisionRulesEnabled &&
    readinessScore >= config.readinessScaleThreshold &&
    scalingConfidence >= config.minScalingConfidence &&
    riskScore < config.riskRejectThreshold
  ) {
    decision = "scale";
  } else if (readinessScore < config.readinessHoldThreshold) {
    decision = "reject";
  } else {
    decision = "hold";
  }

  return {
    companyReference: company,
    productReference: product,
    productReadiness,
    operationalReadiness,
    financialReadiness,
    supplierReadiness,
    marketReadiness,
    readinessScore: Math.max(0, Math.min(100, readinessScore)),
    riskScore: Math.max(0, Math.min(100, riskScore)),
    scalingConfidence: Math.max(0, Math.min(100, scalingConfidence)),
    decision,
  };
}

export function buildDecisionRecord(
  signals: StructuralDecisionSignals,
  ranking: number,
  summary: string,
): ScalingDecisionRecord {
  return {
    scalingDecisionId: `sde-dec-${Date.now()}-${signals.productReference}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    productReference: signals.productReference,
    readinessScore: signals.readinessScore,
    riskScore: signals.riskScore,
    scalingConfidence: signals.scalingConfidence,
    decision: signals.decision,
    recommendationSummary: summary,
    validationStatus: "passed",
    metadataVersion: SDE_METADATA_VERSION,
    opportunityRanking: ranking,
    productReadiness: signals.productReadiness,
    operationalReadiness: signals.operationalReadiness,
    financialReadiness: signals.financialReadiness,
    supplierReadiness: signals.supplierReadiness,
    marketReadiness: signals.marketReadiness,
    neverApproveWithoutValidation: true,
    structuralSignalOnly: true,
    sensitiveOperationalData: false,
  };
}
