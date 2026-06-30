import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { BreakevenAnalysis } from "../models/breakeven-analysis.js";
import type { CashFlowForecast } from "../models/cash-flow-forecast.js";
import type { FinancialForecastReportCreateInput } from "../models/financial-forecast-report.js";
import type {
  FinancialForecastSignal,
  FinancialForecastSignalType,
} from "../models/financial-forecast-signal.js";
import type { GrowthScenario, ScenarioType } from "../models/growth-scenario.js";
import type { ProfitForecast } from "../models/profit-forecast.js";
import type { RevenueForecast } from "../models/revenue-forecast.js";
import type { RiskScenario } from "../models/risk-scenario.js";
import type { RoasForecast } from "../models/roas-forecast.js";

export const FINANCIAL_FORECAST_SIGNAL_WEIGHTS: Record<FinancialForecastSignalType, number> = {
  revenue_projection: 0.18,
  profit_health: 0.16,
  roas_efficiency: 0.14,
  cash_flow_stability: 0.16,
  breakeven_proximity: 0.12,
  growth_potential: 0.12,
  risk_exposure: 0.1,
  forecast_composite: 0.02,
};

export type FinancialForecastBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type FinancialForecastOfferInput = {
  offerName: string;
  price: number;
  currency?: string;
  monthlyOrders?: number;
  adSpendMonthly?: number;
  grossMarginPercent?: number;
  fixedCostsMonthly?: number;
};

export type FinancialForecastInput = {
  brand: FinancialForecastBrandInput;
  offer: FinancialForecastOfferInput;
  storeId: string;
  revenueIndex?: number;
};

export type FinancialForecastBreakdown = FinancialForecastReportCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: FinancialForecastSignalType,
  score: number,
  detail: string,
): FinancialForecastSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: FINANCIAL_FORECAST_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: FinancialForecastInput): number {
  const revenueBoost = input.revenueIndex ? Math.min(12, input.revenueIndex / 8) : 6;
  return clampScore(input.brand.confidence * 0.45 + revenueBoost + 22);
}

function resolveCurrency(input: FinancialForecastInput): string {
  return input.offer.currency ?? "USD";
}

function resolveMonthlyOrders(input: FinancialForecastInput): number {
  if (input.offer.monthlyOrders !== undefined) return input.offer.monthlyOrders;
  const index = input.revenueIndex ?? input.brand.confidence;
  return clampScore(index / 2);
}

function buildRevenueForecast(input: FinancialForecastInput): RevenueForecast {
  const monthlyOrders = resolveMonthlyOrders(input);
  const monthlyRevenue = monthlyOrders * input.offer.price;
  const growthRate =
    input.revenueIndex !== undefined
      ? input.revenueIndex >= 80
        ? 12.5
        : input.revenueIndex >= 65
          ? 6.8
          : 2.1
      : input.brand.confidence >= 80
        ? 10.2
        : 4.5;

  return {
    forecastId: randomUUID(),
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    quarterlyRevenue: Math.round(monthlyRevenue * 3 * 100) / 100,
    annualRevenue: Math.round(monthlyRevenue * 12 * 100) / 100,
    growthRatePercent: growthRate,
    currency: resolveCurrency(input),
    score: clampScore(baseScore(input) + (growthRate >= 8 ? 4 : 0)),
  };
}

function buildProfitForecast(input: FinancialForecastInput, revenue: RevenueForecast): ProfitForecast {
  const grossMargin = input.offer.grossMarginPercent ?? 55;
  const netMargin = grossMargin * 0.42;
  const monthlyProfit = revenue.monthlyRevenue * (netMargin / 100);

  return {
    forecastId: randomUUID(),
    monthlyProfit: Math.round(monthlyProfit * 100) / 100,
    quarterlyProfit: Math.round(monthlyProfit * 3 * 100) / 100,
    annualProfit: Math.round(monthlyProfit * 12 * 100) / 100,
    grossMarginPercent: grossMargin,
    netMarginPercent: Math.round(netMargin * 10) / 10,
    currency: revenue.currency,
    score: clampScore(baseScore(input) + (netMargin >= 20 ? 5 : -3)),
  };
}

function buildRoasForecast(input: FinancialForecastInput, revenue: RevenueForecast): RoasForecast {
  const adSpend = input.offer.adSpendMonthly ?? Math.round(revenue.monthlyRevenue * 0.25);
  const grossMargin = input.offer.grossMarginPercent ?? 55;
  const breakEvenRoas = grossMargin > 0 ? Math.round((100 / grossMargin) * 100) / 100 : 2;
  const revenueFromAds = Math.round(revenue.monthlyRevenue * 0.65 * 100) / 100;
  const currentRoas = adSpend > 0 ? Math.round((revenueFromAds / adSpend) * 100) / 100 : 0;
  const projectedRoas = Math.round(currentRoas * (1 + revenue.growthRatePercent / 200) * 100) / 100;

  return {
    forecastId: randomUUID(),
    currentRoas,
    projectedRoas,
    adSpendMonthly: adSpend,
    revenueFromAds,
    breakEvenRoas,
    score: clampScore(baseScore(input) + (currentRoas >= breakEvenRoas ? 6 : -8)),
  };
}

function buildCashFlowForecast(
  input: FinancialForecastInput,
  revenue: RevenueForecast,
  profit: ProfitForecast,
): CashFlowForecast {
  const monthlyInflow = revenue.monthlyRevenue;
  const fixedCosts = input.offer.fixedCostsMonthly ?? Math.round(revenue.monthlyRevenue * 0.35);
  const monthlyOutflow = fixedCosts + (revenue.monthlyRevenue - profit.monthlyProfit);
  const netCashFlow = monthlyInflow - monthlyOutflow;
  const runwayMonths = netCashFlow >= 0 ? 24 : clampScore(12 + netCashFlow / 1000);

  return {
    forecastId: randomUUID(),
    monthlyInflow: Math.round(monthlyInflow * 100) / 100,
    monthlyOutflow: Math.round(monthlyOutflow * 100) / 100,
    netCashFlow: Math.round(netCashFlow * 100) / 100,
    runwayMonths: Math.max(0, runwayMonths),
    currency: revenue.currency,
    score: clampScore(baseScore(input) + (netCashFlow >= 0 ? 8 : -6)),
  };
}

function buildBreakevenAnalysis(input: FinancialForecastInput, revenue: RevenueForecast): BreakevenAnalysis {
  const fixedCosts = input.offer.fixedCostsMonthly ?? Math.round(revenue.monthlyRevenue * 0.35);
  const grossMargin = input.offer.grossMarginPercent ?? 55;
  const contributionMargin = input.offer.price * (grossMargin / 100);
  const breakevenUnits =
    contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;
  const breakevenRevenue = breakevenUnits * input.offer.price;
  const monthlyOrders = resolveMonthlyOrders(input);
  const monthsToBreakeven =
    monthlyOrders >= breakevenUnits
      ? 0
      : breakevenUnits > 0
        ? Math.ceil(breakevenUnits / Math.max(1, monthlyOrders))
        : 12;

  return {
    analysisId: randomUUID(),
    breakevenRevenue: Math.round(breakevenRevenue * 100) / 100,
    breakevenUnits,
    fixedCostsMonthly: fixedCosts,
    variableCostPerUnit: Math.round((input.offer.price * (1 - grossMargin / 100)) * 100) / 100,
    averageOrderValue: input.offer.price,
    monthsToBreakeven,
    currency: revenue.currency,
    score: clampScore(baseScore(input) + (monthsToBreakeven <= 3 ? 8 : monthsToBreakeven <= 6 ? 2 : -5)),
  };
}

function buildGrowthScenario(
  input: FinancialForecastInput,
  revenue: RevenueForecast,
  profit: ProfitForecast,
  scenarioType: ScenarioType,
): GrowthScenario {
  const multipliers: Record<ScenarioType, { multiplier: number; growth: number; label: string }> = {
    CONSERVATIVE: { multiplier: 0.85, growth: revenue.growthRatePercent * 0.6, label: "Conservative growth" },
    BASE: { multiplier: 1, growth: revenue.growthRatePercent, label: "Base case growth" },
    AGGRESSIVE: { multiplier: 1.35, growth: revenue.growthRatePercent * 1.5, label: "Aggressive expansion" },
  };

  const config = multipliers[scenarioType];
  const projectedAnnualRevenue = Math.round(revenue.annualRevenue * config.multiplier * 100) / 100;
  const projectedAnnualProfit = Math.round(profit.annualProfit * config.multiplier * 100) / 100;

  const assumptions: Record<ScenarioType, string[]> = {
    CONSERVATIVE: [
      "Ad spend held flat with modest conversion gains",
      "No new product launches in forecast window",
      `${input.brand.niche} demand grows at lower bound`,
    ],
    BASE: [
      "Current funnel performance maintained",
      "Seasonal peaks aligned with category norms",
      `${input.brand.targetAudience} retention stable`,
    ],
    AGGRESSIVE: [
      "Scaled paid acquisition with ROAS guardrails",
      "Cross-sell and upsell lift average order value",
      `${input.brand.positioning} drives share gains`,
    ],
  };

  return {
    scenarioId: randomUUID(),
    scenarioType,
    label: config.label,
    revenueMultiplier: config.multiplier,
    projectedAnnualRevenue,
    projectedAnnualProfit,
    growthRatePercent: Math.round(config.growth * 10) / 10,
    assumptions: assumptions[scenarioType],
    score: clampScore(baseScore(input) + (scenarioType === "BASE" ? 3 : scenarioType === "AGGRESSIVE" ? 1 : 0)),
  };
}

function buildRiskScenarios(input: FinancialForecastInput, roas: RoasForecast): RiskScenario[] {
  const risks: RiskScenario[] = [
    {
      riskId: randomUUID(),
      riskName: "Ad cost inflation",
      severity: roas.currentRoas < roas.breakEvenRoas ? "HIGH" : "MEDIUM",
      description: "Rising CPMs compress ROAS below profitable thresholds.",
      revenueImpactPercent: 18,
      probabilityPercent: 42,
      mitigation: "Diversify channels and tighten audience targeting to protect break-even ROAS.",
      score: clampScore(baseScore(input) - (roas.currentRoas < roas.breakEvenRoas ? 12 : 4)),
    },
    {
      riskId: randomUUID(),
      riskName: "Demand seasonality dip",
      severity: "MEDIUM",
      description: `Off-peak months reduce order volume in ${input.brand.niche}.`,
      revenueImpactPercent: 12,
      probabilityPercent: 55,
      mitigation: "Build email and retention flows to smooth monthly revenue variance.",
      score: clampScore(baseScore(input) - 3),
    },
    {
      riskId: randomUUID(),
      riskName: "Supplier cost increase",
      severity: "LOW",
      description: "Variable cost per unit rises, eroding gross margin.",
      revenueImpactPercent: 8,
      probabilityPercent: 35,
      mitigation: "Renegotiate supplier terms and adjust pricing bands proactively.",
      score: clampScore(baseScore(input)),
    },
  ];

  return risks.sort((left, right) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[left.severity] - order[right.severity];
  });
}

function buildSignals(
  revenue: RevenueForecast,
  profit: ProfitForecast,
  roas: RoasForecast,
  cashFlow: CashFlowForecast,
  breakeven: BreakevenAnalysis,
  growthScenarios: GrowthScenario[],
  risks: RiskScenario[],
  confidence: number,
): FinancialForecastSignal[] {
  const riskScore = clampScore(100 - average(risks.map((risk) => risk.revenueImpactPercent * 0.4)));

  return [
    buildSignal(
      "revenue_projection",
      revenue.score,
      `Monthly revenue ${revenue.currency} ${revenue.monthlyRevenue.toLocaleString()} at ${revenue.growthRatePercent}% growth`,
    ),
    buildSignal(
      "profit_health",
      profit.score,
      `Net margin ${profit.netMarginPercent}% — annual profit ${profit.currency} ${profit.annualProfit.toLocaleString()}`,
    ),
    buildSignal(
      "roas_efficiency",
      roas.score,
      `ROAS ${roas.currentRoas}x vs break-even ${roas.breakEvenRoas}x`,
    ),
    buildSignal(
      "cash_flow_stability",
      cashFlow.score,
      `Net cash flow ${cashFlow.currency} ${cashFlow.netCashFlow.toLocaleString()} — ${cashFlow.runwayMonths} month runway`,
    ),
    buildSignal(
      "breakeven_proximity",
      breakeven.score,
      `Breakeven at ${breakeven.breakevenUnits} units (${breakeven.monthsToBreakeven} months)`,
    ),
    buildSignal(
      "growth_potential",
      average(growthScenarios.map((scenario) => scenario.score)),
      `${growthScenarios.length} growth scenarios modeled`,
    ),
    buildSignal(
      "risk_exposure",
      riskScore,
      `${risks.filter((risk) => risk.severity === "HIGH").length} high-severity risks flagged`,
    ),
    buildSignal("forecast_composite", confidence, `Financial forecast confidence ${confidence}`),
  ];
}

function computeConfidence(signals: FinancialForecastSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "forecast_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "forecast_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(
  revenue: RevenueForecast,
  profit: ProfitForecast,
  cashFlow: CashFlowForecast,
  risks: RiskScenario[],
): number {
  const highRiskPenalty = risks.filter((risk) => risk.severity === "HIGH").length * 6;
  return clampScore(average([revenue.score, profit.score, cashFlow.score]) - highRiskPenalty);
}

/** Generates financial forecast report — intelligence only, no auto-apply. */
export function generateFinancialForecast(
  input: FinancialForecastInput,
): FinancialForecastBreakdown {
  const revenue = buildRevenueForecast(input);
  const profit = buildProfitForecast(input, revenue);
  const roas = buildRoasForecast(input, revenue);
  const cashFlow = buildCashFlowForecast(input, revenue, profit);
  const breakeven = buildBreakevenAnalysis(input, revenue);
  const growthScenarios: GrowthScenario[] = (
    ["CONSERVATIVE", "BASE", "AGGRESSIVE"] as ScenarioType[]
  ).map((scenarioType) => buildGrowthScenario(input, revenue, profit, scenarioType));
  const riskScenarios = buildRiskScenarios(input, roas);

  const provisionalSignals = buildSignals(
    revenue,
    profit,
    roas,
    cashFlow,
    breakeven,
    growthScenarios,
    riskScenarios,
    0,
  );
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(
    revenue,
    profit,
    roas,
    cashFlow,
    breakeven,
    growthScenarios,
    riskScenarios,
    confidence,
  );
  const overallScore = computeOverallScore(revenue, profit, cashFlow, riskScenarios);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    reportName: `${input.brand.brandName} Financial Forecast`,
    revenue,
    profit,
    roas,
    cashFlow,
    breakeven,
    growthScenarios,
    riskScenarios,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoApplyEnabled: false,
  };
}

export const financialForecastIntelligenceScoring = {
  generateFinancialForecast,
  computeConfidence,
  computeOverallScore,
  FINANCIAL_FORECAST_SIGNAL_WEIGHTS,
};
