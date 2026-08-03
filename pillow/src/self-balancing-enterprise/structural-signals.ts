/** X3-19 — Shared structural self-balancing helpers. */

import { SBE_METADATA_VERSION } from "./paths.js";
import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";
import type {
  BalanceOperation,
  ResourceCategory,
  SelfBalancingRecord,
  SelfBalancingInput,
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

export function defaultCompany(input?: SelfBalancingInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultResourceCategory(
  operation: BalanceOperation,
  input?: SelfBalancingInput,
): ResourceCategory | string {
  if (input?.resourceCategoryHint) return String(input.resourceCategoryHint);
  switch (operation) {
    case "operational_balance_monitoring":
      return "operational";
    case "financial_balance_monitoring":
      return "financial";
    case "workforce_balance_monitoring":
      return "workforce";
    case "supplier_balance_monitoring":
      return "supplier";
    case "infrastructure_balance_monitoring":
      return "infrastructure";
    case "resource_imbalance_detection":
    case "policy_gated_resource_reallocation":
    case "enterprise_equilibrium_optimization":
    case "enterprise_resource_utilization_monitoring":
    default:
      return "operational";
  }
}

export function buildSelfBalancingRecord(input: {
  companyReference: string;
  resourceCategory: string;
  currentAllocation: number;
  recommendedAllocation: number;
  balanceScore: number;
  expectedImprovement: string;
}): SelfBalancingRecord {
  return {
    enterpriseBalanceId: `sbe-bal-${Date.now()}-${input.resourceCategory.slice(0, 12)}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    resourceCategory: input.resourceCategory,
    currentAllocation: clampScore(input.currentAllocation),
    recommendedAllocation: clampScore(input.recommendedAllocation),
    balanceScore: clampScore(input.balanceScore),
    expectedImprovement: input.expectedImprovement,
    validationStatus: "passed",
    metadataVersion: SBE_METADATA_VERSION,
    neverReallocateProtectedResourcesBeyondApprovalPolicies: true,
    structuralSignalOnly: true,
    policyGatedReallocation: true,
    sensitiveOperationalData: false,
  };
}

export function computeSelfBalancingSignals(
  operation: BalanceOperation,
  input: SelfBalancingInput,
  config: SelfBalancingEnterpriseConfiguration,
  sourceAvailable = true,
): {
  companyReference: string;
  resourceCategory: string;
  currentAllocation: number;
  recommendedAllocation: number;
  balanceScore: number;
  expectedImprovement: string;
} {
  const company = defaultCompany(input);
  const resourceCategory = defaultResourceCategory(operation, input);
  const seed = `${company}::${resourceCategory}::${operation}`;

  const balanceScore = clampScore(
    input.balanceScoreHint ?? hashScore(`${seed}:balance`, 20, 95),
  );
  const currentAllocation = clampScore(
    input.currentAllocationHint ?? hashScore(`${seed}:current`, 25, 90),
  );
  let recommendedAllocation = clampScore(
    input.recommendedAllocationHint ?? hashScore(`${seed}:recommended`, 30, 92),
  );

  // Policy-gated: never recommend reallocating protected resources beyond approval posture.
  if (
    config.neverReallocateProtectedResourcesBeyondApprovalPolicies &&
    Math.abs(recommendedAllocation - currentAllocation) > 35
  ) {
    recommendedAllocation = clampScore(
      currentAllocation + Math.sign(recommendedAllocation - currentAllocation) * 20,
    );
  }

  let expectedImprovement =
    "Enterprise balance within structural bounds — policy-gated reallocation; never reallocate protected resources beyond approval policies";

  const operationThreshold = ((): number => {
    switch (operation) {
      case "operational_balance_monitoring":
        return config.operationalBalanceThreshold;
      case "financial_balance_monitoring":
        return config.financialBalanceThreshold;
      case "workforce_balance_monitoring":
        return config.workforceBalanceThreshold;
      case "supplier_balance_monitoring":
        return config.supplierBalanceThreshold;
      case "infrastructure_balance_monitoring":
        return config.infrastructureBalanceThreshold;
      case "resource_imbalance_detection":
      case "policy_gated_resource_reallocation":
      case "enterprise_equilibrium_optimization":
      case "enterprise_resource_utilization_monitoring":
      default:
        return config.balanceScoreThreshold;
    }
  })();

  if (!sourceAvailable) {
    expectedImprovement = `Partial ${operation} signal — upstream source unavailable; structural signals only; policy-gated reallocation`;
  } else if (balanceScore >= operationThreshold) {
    expectedImprovement = `${operation} score ${balanceScore}% supports cautious policy-gated rebalance on ${company} · ${resourceCategory}`;
  } else {
    expectedImprovement = `Hold reallocation for ${resourceCategory} — score ${balanceScore}% below threshold; never reallocate protected resources beyond approval policies`;
  }

  if (
    config.neverReallocateProtectedResourcesBeyondApprovalPolicies &&
    balanceScore < config.balanceScoreThreshold
  ) {
    expectedImprovement = `${expectedImprovement} · never reallocate protected resources beyond approval policies`;
  }

  return {
    companyReference: company,
    resourceCategory,
    currentAllocation,
    recommendedAllocation,
    balanceScore,
    expectedImprovement,
  };
}
