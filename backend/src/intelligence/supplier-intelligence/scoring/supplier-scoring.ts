import {
  evaluateSupplierCapability,
  type SupplierCapability,
} from "../models/supplier-capability.js";
import {
  resolveSupplierRiskLevel,
  type SupplierRiskProfile,
} from "../models/supplier-risk-profile.js";
import type { SupplierProfileCreateInput } from "../models/supplier-profile.js";

export const SUPPLIER_SCORE_WEIGHTS = {
  fulfillment: 0.3,
  reliability: 0.25,
  communication: 0.2,
  quality: 0.25,
} as const;

const COUNTRY_FRAUD_RISK: Record<string, number> = {
  cn: 35,
  china: 35,
  us: 10,
  "united states": 10,
  uk: 12,
  "united kingdom": 12,
  de: 12,
  germany: 12,
  default: 20,
};

export type SupplierScoreBreakdown = {
  trustScore: number;
  riskProfile: SupplierRiskProfile;
  capabilityScore: number;
  capabilityStrengths: string[];
  capabilityGaps: string[];
  sourceable: boolean;
  reasoning: string;
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function inverseRisk(score: number): number {
  return clampScore(100 - score);
}

function countryFraudRisk(country: string): number {
  const key = country.trim().toLowerCase();
  return COUNTRY_FRAUD_RISK[key] ?? COUNTRY_FRAUD_RISK.default ?? 20;
}

function buildReasoning(
  input: SupplierProfileCreateInput,
  trustScore: number,
  riskProfile: SupplierRiskProfile,
  sourceable: boolean,
): string {
  const verdict = sourceable ? "reliably sourceable" : "not reliably sourceable";
  return `${input.supplierName} (${input.country}) is ${verdict} with trust score ${trustScore} and ${riskProfile.riskLevel} risk.`;
}

/** Scores supplier trust, risk, and sourcing readiness from profile inputs. */
export function scoreSupplierProfile(input: SupplierProfileCreateInput): SupplierScoreBreakdown {
  const trustScore = clampScore(
    input.fulfillmentScore * SUPPLIER_SCORE_WEIGHTS.fulfillment +
      input.reliabilityScore * SUPPLIER_SCORE_WEIGHTS.reliability +
      input.communicationScore * SUPPLIER_SCORE_WEIGHTS.communication +
      input.qualityScore * SUPPLIER_SCORE_WEIGHTS.quality,
  );

  const disputeRisk = clampScore(
    inverseRisk(input.communicationScore) * 0.55 + inverseRisk(input.reliabilityScore) * 0.45,
  );
  const shippingRisk = clampScore(inverseRisk(input.fulfillmentScore));
  const qualityRisk = clampScore(inverseRisk(input.qualityScore));
  const fraudRisk = clampScore(
    countryFraudRisk(input.country) * 0.6 + inverseRisk(trustScore) * 0.4,
  );

  const averageRisk = (disputeRisk + shippingRisk + qualityRisk + fraudRisk) / 4;
  const riskProfile: SupplierRiskProfile = {
    riskLevel: resolveSupplierRiskLevel(averageRisk),
    disputeRisk,
    shippingRisk,
    qualityRisk,
    fraudRisk,
  };

  const capabilityEvaluation = evaluateSupplierCapability(input.capability);
  const sourceable =
    trustScore >= 65 &&
    capabilityEvaluation.score >= 50 &&
    riskProfile.riskLevel !== "critical" &&
    riskProfile.riskLevel !== "high";

  return {
    trustScore,
    riskProfile,
    capabilityScore: capabilityEvaluation.score,
    capabilityStrengths: capabilityEvaluation.strengths,
    capabilityGaps: capabilityEvaluation.gaps,
    sourceable,
    reasoning: buildReasoning(input, trustScore, riskProfile, sourceable),
  };
}

/** Evaluates whether supplier capabilities support a sourcing requirement set. */
export function evaluateRequiredCapabilities(
  capability: SupplierCapability,
  requirements: Partial<SupplierCapability>,
): { met: boolean; missing: string[]; score: number } {
  const checks = [
    { key: "supportsDropshipping", label: "dropshipping" },
    { key: "supportsBranding", label: "branding" },
    { key: "supportsCustomPackaging", label: "custom packaging" },
    { key: "supportsBulkOrders", label: "bulk orders" },
  ] as const;

  const missing: string[] = [];
  let requiredCount = 0;
  let metCount = 0;

  for (const check of checks) {
    if (requirements[check.key] === true) {
      requiredCount += 1;
      if (capability[check.key]) {
        metCount += 1;
      } else {
        missing.push(check.label);
      }
    }
  }

  const score = requiredCount === 0 ? 100 : clampScore((metCount / requiredCount) * 100);
  return { met: missing.length === 0, missing, score };
}

export const supplierScoring = {
  scoreSupplierProfile,
  evaluateRequiredCapabilities,
  weights: SUPPLIER_SCORE_WEIGHTS,
};
