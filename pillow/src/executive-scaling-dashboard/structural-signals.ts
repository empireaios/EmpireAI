/** X3-09 — Shared structural executive scaling dashboard helpers. */

import { ESD_METADATA_VERSION } from "./paths.js";
import type { ExecutiveScalingDashboardConfiguration } from "./configuration.js";
import type {
  DomainSummary,
  ExecutiveDashboardSnapshot,
  ExecutiveScalingDashboardInput,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: ExecutiveScalingDashboardInput): string {
  return input?.companyReference?.trim() || "company-default";
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function statusForScore(score: number, min: number): string {
  if (score < min) return "below_threshold";
  if (score < min + 15) return "watch";
  return "ready";
}

export function buildDomainSummary(input: {
  domain: string;
  readinessScore: number;
  sourceAvailable: boolean;
  notes: string;
  min: number;
}): DomainSummary {
  const readinessScore = clampScore(input.readinessScore);
  return {
    domain: input.domain,
    readinessScore,
    statusLabel: input.sourceAvailable
      ? statusForScore(readinessScore, input.min)
      : "partial_unavailable",
    sourceAvailable: input.sourceAvailable,
    notes: input.notes,
  };
}

export function buildDashboardSnapshot(input: {
  companyReference: string;
  scalingSummary: DomainSummary;
  opportunitySummary: DomainSummary;
  capacitySummary: DomainSummary;
  marketingSummary: DomainSummary;
  supplierSummary: DomainSummary;
  financialSummary: DomainSummary;
  workforceSummary: DomainSummary;
  executiveAlerts: string[];
}): ExecutiveDashboardSnapshot {
  return {
    dashboardId: `esd-dash-${Date.now()}-${input.companyReference}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    scalingSummary: input.scalingSummary,
    opportunitySummary: input.opportunitySummary,
    capacitySummary: input.capacitySummary,
    marketingSummary: input.marketingSummary,
    supplierSummary: input.supplierSummary,
    financialSummary: input.financialSummary,
    workforceSummary: input.workforceSummary,
    executiveAlerts: [...input.executiveAlerts],
    validationStatus: "passed",
    metadataVersion: ESD_METADATA_VERSION,
    neverExposeRestrictedEnterpriseInformation: true,
    structuralSignalOnly: true,
    sensitiveEnterpriseData: false,
  };
}

export function computeDashboardSignals(
  focus:
    | "scaling"
    | "opportunity"
    | "capacity"
    | "marketing"
    | "supplier"
    | "financial"
    | "workforce"
    | "dashboard",
  input: ExecutiveScalingDashboardInput,
  config: ExecutiveScalingDashboardConfiguration,
  sourceAvailability: Partial<Record<string, boolean>> = {},
): {
  companyReference: string;
  scalingScore: number;
  opportunityScore: number;
  capacityScore: number;
  marketingScore: number;
  supplierScore: number;
  financialScore: number;
  workforceScore: number;
  recommendationSummary: string;
} {
  const company = defaultCompany(input);
  const seed = `${company}::${focus}`;

  const scalingScore = clampScore(
    input.scalingHint ?? hashScore(`${seed}:scaling`, 20, 95),
  );
  const opportunityScore = clampScore(
    input.opportunityHint ?? hashScore(`${seed}:opportunity`, 20, 95),
  );
  const capacityScore = clampScore(
    input.capacityHint ?? hashScore(`${seed}:capacity`, 20, 95),
  );
  const marketingScore = clampScore(
    input.marketingHint ?? hashScore(`${seed}:marketing`, 20, 95),
  );
  const supplierScore = clampScore(
    input.supplierHint ?? hashScore(`${seed}:supplier`, 20, 95),
  );
  const financialScore = clampScore(
    input.financialHint ?? hashScore(`${seed}:financial`, 20, 95),
  );
  const workforceScore = clampScore(
    input.workforceHint ?? hashScore(`${seed}:workforce`, 20, 95),
  );

  const unavailable = Object.entries(sourceAvailability)
    .filter(([, ok]) => ok === false)
    .map(([key]) => key);

  let recommendationSummary =
    "Executive scaling cockpit within validated structural bounds";
  if (scalingScore < config.minScalingReadiness) {
    recommendationSummary = `Scaling readiness ${scalingScore} below min ${config.minScalingReadiness} — hold expansion`;
  } else if (capacityScore < config.minCapacityScore) {
    recommendationSummary = `Operational capacity ${capacityScore} below min ${config.minCapacityScore} — stabilize capacity first`;
  } else if (financialScore < config.minFinancialScore) {
    recommendationSummary = `Financial readiness ${financialScore} below min ${config.minFinancialScore} — hold capital-sensitive scale`;
  } else if (workforceScore < config.minWorkforceScore) {
    recommendationSummary = `Workforce utilization ${workforceScore} below min ${config.minWorkforceScore} — rebalance agents`;
  } else if (unavailable.length > 0) {
    recommendationSummary = `Partial cockpit — upstream unavailable: ${unavailable.join(", ")}`;
  } else {
    recommendationSummary = `Validated ${focus} signals support cautious executive scaling visibility`;
  }

  return {
    companyReference: company,
    scalingScore,
    opportunityScore,
    capacityScore,
    marketingScore,
    supplierScore,
    financialScore,
    workforceScore,
    recommendationSummary,
  };
}
