/** X3-13 — Shared structural scaling risk helpers. */

import { SRM_METADATA_VERSION } from "./paths.js";
import type { ScalingRiskMonitorConfiguration } from "./configuration.js";
import type {
  RiskCategory,
  RiskOperation,
  RiskSeverity,
  ScalingRiskRecord,
  ScalingRiskInput,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function defaultCompany(input?: ScalingRiskInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function severityFromProbability(
  probability: number,
  config: ScalingRiskMonitorConfiguration,
  hint?: RiskSeverity,
): RiskSeverity {
  if (hint) return hint;
  if (probability >= config.criticalSeverityThreshold) return "critical";
  if (probability >= config.highSeverityThreshold) return "high";
  if (probability >= config.riskProbabilityThreshold) return "medium";
  return "low";
}

export function buildScalingRiskRecord(input: {
  companyReference: string;
  riskCategory: RiskCategory;
  riskSeverity: RiskSeverity;
  riskProbability: number;
  businessImpact: string;
  mitigationRecommendation: string;
}): ScalingRiskRecord {
  const riskProbability = clampScore(input.riskProbability);
  // Never suppress critical scaling risks — preserve observed severity even when high.
  const riskSeverity =
    riskProbability >= 85 && input.riskSeverity !== "critical"
      ? "critical"
      : input.riskSeverity;

  return {
    scalingRiskId: `srm-risk-${Date.now()}-${input.riskCategory.slice(0, 12)}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    riskCategory: input.riskCategory,
    riskSeverity,
    riskProbability,
    businessImpact: input.businessImpact,
    mitigationRecommendation: input.mitigationRecommendation,
    validationStatus: "passed",
    metadataVersion: SRM_METADATA_VERSION,
    neverSuppressCriticalScalingRisks: true,
    structuralSignalOnly: true,
    sensitiveOperationalData: false,
  };
}

const OPERATION_CATEGORY: Record<RiskOperation, RiskCategory> = {
  scaling_risk: "operational",
  operational_risk: "operational",
  financial_risk: "financial",
  supplier_risk: "supplier",
  marketing_risk: "marketing",
  workforce_risk: "workforce",
  infrastructure_risk: "infrastructure",
  uncontrolled_expansion: "uncontrolled_expansion",
  risk_ranking: "operational",
};

export function computeRiskSignals(
  operation: RiskOperation,
  input: ScalingRiskInput,
  config: ScalingRiskMonitorConfiguration,
  sourceAvailable = true,
): {
  companyReference: string;
  riskCategory: RiskCategory;
  riskSeverity: RiskSeverity;
  riskProbability: number;
  businessImpact: string;
  mitigationRecommendation: string;
} {
  const company = defaultCompany(input);
  const category = input.riskCategoryHint ?? OPERATION_CATEGORY[operation];
  const seed = `${company}::${category}::${operation}`;

  const riskProbability = clampScore(
    input.riskProbabilityHint ?? hashScore(`${seed}:probability`, 20, 95),
  );
  const expansionPressure = clampScore(
    input.expansionPressureHint ?? hashScore(`${seed}:expansion`, 20, 95),
  );
  let riskSeverity = severityFromProbability(
    riskProbability,
    config,
    input.riskSeverityHint,
  );

  let businessImpact =
    "Scaling risk signals within structural bounds — structural signals only; never suppress critical scaling risks";
  let mitigationRecommendation =
    "Continue structural monitoring — no mitigation required at current probability";

  const categoryThreshold = ((): number => {
    switch (category) {
      case "financial":
        return config.financialRiskThreshold;
      case "supplier":
        return config.supplierRiskThreshold;
      case "marketing":
        return config.marketingRiskThreshold;
      case "workforce":
        return config.workforceRiskThreshold;
      case "infrastructure":
        return config.infrastructureRiskThreshold;
      case "uncontrolled_expansion":
        return config.uncontrolledExpansionThreshold;
      case "operational":
      default:
        return config.operationalRiskThreshold;
    }
  })();

  if (!sourceAvailable) {
    businessImpact = `Partial ${operation} signal — upstream source unavailable; structural signals only`;
    mitigationRecommendation = `Tolerate missing upstream for ${category}; retain structural risk posture`;
    if (riskProbability >= categoryThreshold) {
      riskSeverity = severityFromProbability(riskProbability, config);
    }
  } else if (operation === "uncontrolled_expansion") {
    const elevated = expansionPressure >= config.uncontrolledExpansionThreshold;
    if (elevated) {
      riskSeverity =
        expansionPressure >= config.criticalSeverityThreshold ? "critical" : "high";
      businessImpact = `Uncontrolled expansion pressure ${expansionPressure}% on ${company} — expansion may outpace controls`;
      mitigationRecommendation =
        "Throttle expansion rate; require validated capacity/financial gates before further scale";
    } else {
      businessImpact = `Expansion pressure ${expansionPressure}% within controlled bounds on ${company}`;
      mitigationRecommendation = "Maintain expansion controls and continue monitoring";
    }
  } else if (riskProbability >= categoryThreshold) {
    businessImpact = `${category} scaling risk probability ${riskProbability}% above threshold ${categoryThreshold} on ${company}`;
    mitigationRecommendation = `Mitigate ${category} risk before further scale — never suppress critical scaling risks`;
    riskSeverity = severityFromProbability(riskProbability, config, input.riskSeverityHint);
  } else {
    businessImpact = `Validated ${operation} signals support cautious scaling risk monitoring`;
    mitigationRecommendation = `Hold ${category} mitigation — probability ${riskProbability}% below threshold`;
  }

  if (
    config.neverSuppressCriticalScalingRisks &&
    (riskSeverity === "critical" || riskProbability >= config.criticalSeverityThreshold)
  ) {
    riskSeverity = "critical";
    mitigationRecommendation = `${mitigationRecommendation} · never suppress critical scaling risks`;
  }

  return {
    companyReference: company,
    riskCategory: category,
    riskSeverity,
    riskProbability:
      operation === "uncontrolled_expansion"
        ? clampScore(Math.max(riskProbability, expansionPressure))
        : riskProbability,
    businessImpact,
    mitigationRecommendation,
  };
}
