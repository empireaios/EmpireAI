import type { SupplierEvaluationScores, SupplierGuardFlag, SupplierGuardVerdict } from "./types.js";

export const SUPPLIER_GUARD_THRESHOLDS = {
  fakeSupplierRiskReject: 65,
  lowTrustReject: 38,
  lowTrustFlag: 55,
  poorReliabilityFlag: 50,
  unverifiedFakeRisk: 40,
} as const;

/** Guardian checks for supplier evaluations — fake supplier and low trust thresholds. */
export class SupplierIntelligenceGuard {
  assess(scores: SupplierEvaluationScores, verified: boolean): SupplierGuardVerdict {
    const flags: SupplierGuardFlag[] = [];
    const reasons: string[] = [];

    if (scores.fakeSupplierRisk >= SUPPLIER_GUARD_THRESHOLDS.fakeSupplierRiskReject) {
      flags.push("fake_supplier_risk");
      reasons.push(
        `Fake supplier risk ${scores.fakeSupplierRisk}/100 exceeds reject threshold (${SUPPLIER_GUARD_THRESHOLDS.fakeSupplierRiskReject})`,
      );
    }

    if (scores.trustScore <= SUPPLIER_GUARD_THRESHOLDS.lowTrustReject) {
      flags.push("low_trust_score");
      reasons.push(
        `Trust score ${scores.trustScore}/100 below reject threshold (${SUPPLIER_GUARD_THRESHOLDS.lowTrustReject})`,
      );
    } else if (scores.trustScore < SUPPLIER_GUARD_THRESHOLDS.lowTrustFlag) {
      flags.push("low_trust_score");
      reasons.push(
        `Trust score ${scores.trustScore}/100 below review threshold (${SUPPLIER_GUARD_THRESHOLDS.lowTrustFlag})`,
      );
    }

    if (scores.reliabilityScore < SUPPLIER_GUARD_THRESHOLDS.poorReliabilityFlag) {
      flags.push("poor_reliability");
      reasons.push(
        `Reliability ${scores.reliabilityScore}/100 below ${SUPPLIER_GUARD_THRESHOLDS.poorReliabilityFlag}`,
      );
    }

    if (!verified && scores.fakeSupplierRisk >= SUPPLIER_GUARD_THRESHOLDS.unverifiedFakeRisk) {
      flags.push("unverified_supplier");
      reasons.push("Unverified supplier with elevated fake risk signals");
    }

    const hardReject =
      flags.includes("fake_supplier_risk") ||
      (flags.includes("low_trust_score") &&
        scores.trustScore <= SUPPLIER_GUARD_THRESHOLDS.lowTrustReject);

    const recommendation = hardReject
      ? "REJECT"
      : flags.length > 0
        ? "REVIEW"
        : "SELL";

    const allowed = recommendation !== "REJECT";

    if (allowed && flags.length > 0) {
      reasons.push(`Guardian flagged ${flags.length} risk signal(s) — routed to ${recommendation}`);
    } else if (allowed) {
      reasons.push(`Guardian approved — trust score ${scores.trustScore}/100`);
    }

    return {
      allowed,
      recommendation,
      flags,
      reasons,
      auditedAt: new Date().toISOString(),
    };
  }
}

export const supplierIntelligenceGuard = new SupplierIntelligenceGuard();
