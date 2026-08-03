/** X3-07 — Shared structural financial scaling helpers. */

import { FSE_METADATA_VERSION } from "./paths.js";
import type { FinancialScaleEngineConfiguration } from "./configuration.js";
import type { FinancialScaleInput, FinancialScalingRecord } from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: FinancialScaleInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultInitiative(input?: FinancialScaleInput): string {
  return input?.scalingInitiativeReference?.trim() || "initiative-default";
}

export function buildFinancialScalingRecord(input: {
  companyReference: string;
  scalingInitiativeReference: string;
  capitalRequirement: number;
  cashFlowReadiness: number;
  profitabilityScore: number;
  investmentEfficiencyScore: number;
  recommendationSummary: string;
  config: FinancialScaleEngineConfiguration;
}): FinancialScalingRecord {
  let efficiency = Math.max(
    0,
    Math.min(100, Math.round(input.investmentEfficiencyScore)),
  );
  if (input.config.neverRecommendScalingWithoutValidatedFinancialReadiness) {
    if (
      input.capitalRequirement < input.config.minCapitalRequirement ||
      input.profitabilityScore < input.config.minProfitabilityScore ||
      input.cashFlowReadiness < input.config.minCashFlowReadiness
    ) {
      efficiency = Math.min(efficiency, input.config.minInvestmentEfficiencyScore - 1);
    }
  }

  return {
    financialScalingId: `fse-fin-${Date.now()}-${input.scalingInitiativeReference}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    scalingInitiativeReference: input.scalingInitiativeReference,
    capitalRequirement: Math.max(0, Math.min(100, Math.round(input.capitalRequirement))),
    cashFlowReadiness: Math.max(0, Math.min(100, Math.round(input.cashFlowReadiness))),
    profitabilityScore: Math.max(0, Math.min(100, Math.round(input.profitabilityScore))),
    investmentEfficiencyScore: efficiency,
    recommendationSummary: input.recommendationSummary,
    validationStatus: "passed",
    metadataVersion: FSE_METADATA_VERSION,
    neverRecommendScalingWithoutValidatedFinancialReadiness: true,
    structuralSignalOnly: true,
    sensitiveFinancialData: false,
  };
}

export function computeFinancialSignals(
  focus:
    | "capital"
    | "cash_flow"
    | "working_capital"
    | "operating_expense"
    | "investment_efficiency"
    | "profitability"
    | "financial",
  input: FinancialScaleInput,
  config: FinancialScaleEngineConfiguration,
): {
  companyReference: string;
  scalingInitiativeReference: string;
  capitalRequirement: number;
  cashFlowReadiness: number;
  profitabilityScore: number;
  investmentEfficiencyScore: number;
  recommendationSummary: string;
} {
  const company = defaultCompany(input);
  const initiative = defaultInitiative(input);
  const seed = `${company}::${initiative}::${focus}`;

  const capitalRequirement = Math.round(
    input.capitalHint ?? hashScore(`${seed}:capital`, 20, 95),
  );
  const cashFlowReadiness = Math.round(
    input.cashFlowHint ?? hashScore(`${seed}:cash_flow`, 20, 95),
  );
  const profitabilityScore = Math.round(
    input.profitabilityHint ?? hashScore(`${seed}:profitability`, 20, 95),
  );

  const workingCapitalScore = Math.round(
    input.workingCapitalHint ?? hashScore(`${seed}:working_capital`, 20, 95),
  );
  const operatingExpenseScore = Math.round(
    input.operatingExpenseHint ?? hashScore(`${seed}:opex`, 20, 95),
  );

  let investmentEfficiencyScore = Math.round(
    input.investmentEfficiencyHint ??
      (capitalRequirement * 0.3 +
        cashFlowReadiness * 0.25 +
        profitabilityScore * 0.25 +
        workingCapitalScore * 0.1 +
        operatingExpenseScore * 0.1),
  );

  let recommendationSummary = "Financial readiness within validated structural bounds";
  if (capitalRequirement < config.minCapitalRequirement) {
    recommendationSummary = `Capital bottleneck at ${capitalRequirement} (min ${config.minCapitalRequirement}) — do not scale`;
  } else if (profitabilityScore < config.minProfitabilityScore) {
    recommendationSummary = `Profitability bottleneck at ${profitabilityScore} (min ${config.minProfitabilityScore}) — do not scale`;
  } else if (cashFlowReadiness < config.minCashFlowReadiness) {
    recommendationSummary = `Cash-flow bottleneck at ${cashFlowReadiness} (min ${config.minCashFlowReadiness}) — do not scale`;
  } else if (investmentEfficiencyScore < config.minInvestmentEfficiencyScore) {
    recommendationSummary = `Investment efficiency ${investmentEfficiencyScore} below min ${config.minInvestmentEfficiencyScore} — hold scale`;
  } else {
    recommendationSummary = `Validated ${focus} signals support cautious financial scale`;
  }

  if (config.neverRecommendScalingWithoutValidatedFinancialReadiness) {
    if (
      capitalRequirement < config.minCapitalRequirement ||
      profitabilityScore < config.minProfitabilityScore ||
      cashFlowReadiness < config.minCashFlowReadiness
    ) {
      investmentEfficiencyScore = Math.min(
        investmentEfficiencyScore,
        config.minInvestmentEfficiencyScore - 1,
      );
    }
  }

  return {
    companyReference: company,
    scalingInitiativeReference: initiative,
    capitalRequirement,
    cashFlowReadiness,
    profitabilityScore,
    investmentEfficiencyScore,
    recommendationSummary,
  };
}
