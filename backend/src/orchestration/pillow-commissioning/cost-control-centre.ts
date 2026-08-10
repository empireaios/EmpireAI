/**
 * Cost Control Centre + billing exposure register.
 * ACTUAL ≠ COMMITTED ≠ FORECAST.
 * UNKNOWN remains UNKNOWN.
 */

import { costIntelligenceRegistry } from "../../cost/cost-registry.js";
import { buildCostGuardStatus } from "./cost-guard.js";
import { buildSmartViableKpiSnapshot } from "../pillow-commerce-presale/smart-viable-kpi.js";
import { getOneProductCommissioningRecord } from "./one-product-commissioning.js";

export type BillingExposureRow = {
  provider: string;
  service: string;
  status: "configured" | "optional" | "unknown";
  plan: string | null;
  billingModel: string;
  paymentExposure: string;
  autoScaling: boolean;
  empireAiCap: number | null;
  knownMaxExposureUsd: number | null | "UNKNOWN";
  billingDataAvailability: "live" | "partial" | "none" | "unknown";
  unexpectedChargeRisk: "low" | "medium" | "high";
  notes: string;
};

export type CostControlCentreSnapshot = {
  computedAt: string;
  reportingCurrency: "USD";
  costGuard: ReturnType<typeof buildCostGuardStatus>;
  providers: Array<{
    provider: string;
    service: string;
    status: string;
    plan: string | null;
    billingModel: string;
    currentUsage: string | null;
    todayUsd: number | null | "UNKNOWN";
    thisMonthUsd: number | null | "UNKNOWN";
    lastMonthUsd: number | null | "UNKNOWN";
    forecastMonthEndUsd: number | null | "UNKNOWN";
    budgetLimitUsd: number | null;
    pctConsumed: number | null;
    lastRefreshed: string;
    costDataSource: string;
    confidence: "high" | "medium" | "low" | "none";
    billingBlindSpot: boolean;
  }>;
  billingExposure: BillingExposureRow[];
  actualVsCommittedVsForecast: {
    actualUsd: number;
    committedUsd: number;
    forecastUsd: number;
    note: string;
  };
  attribution: {
    pillowUsd: number | null | "INSUFFICIENT_MEASURED_DATA";
    commerceCycleUsd: number | null | "INSUFFICIENT_MEASURED_DATA";
    memoryUsd: number | null | "INSUFFICIENT_MEASURED_DATA";
    hostingUsd: number | null | "INSUFFICIENT_MEASURED_DATA";
  };
  scaleForecast: ReturnType<typeof buildScaleCostForecast>;
  blindSpots: string[];
};

function envConfigured(keys: string[]): boolean {
  return keys.some((k) => Boolean(process.env[k] && String(process.env[k]).trim()));
}

export function buildBillingExposureRegister(): BillingExposureRow[] {
  return [
    {
      provider: "OpenAI",
      service: "LLM / chat / tools",
      status: envConfigured(["OPENAI_API_KEY"]) ? "configured" : "optional",
      plan: null,
      billingModel: "token metered",
      paymentExposure: "usage-based; can grow with autonomous cycles",
      autoScaling: true,
      empireAiCap: null,
      knownMaxExposureUsd: "UNKNOWN",
      billingDataAvailability: "partial",
      unexpectedChargeRisk: "high",
      notes: "Primary AI spend surface for Pillow executive reasoning",
    },
    {
      provider: "Railway",
      service: "Brain / workers / compute",
      status: "configured",
      plan: null,
      billingModel: "compute + network metered",
      paymentExposure: "hosting usage",
      autoScaling: true,
      empireAiCap: null,
      knownMaxExposureUsd: "UNKNOWN",
      billingDataAvailability: "none",
      unexpectedChargeRisk: "medium",
      notes: "Billing blind spot unless Railway invoice API wired",
    },
    {
      provider: "Vercel",
      service: "empireai-web",
      status: "configured",
      plan: null,
      billingModel: "plan + bandwidth/functions",
      paymentExposure: "frontend hosting",
      autoScaling: true,
      empireAiCap: null,
      knownMaxExposureUsd: "UNKNOWN",
      billingDataAvailability: "none",
      unexpectedChargeRisk: "medium",
      notes: "Billing blind spot unless Vercel invoice API wired",
    },
    {
      provider: "CJdropshipping",
      service: "Supplier API",
      status: envConfigured(["CJ_API_KEY", "CJ_ACCESS_TOKEN", "CJ_EMAIL"])
        ? "configured"
        : "optional",
      plan: null,
      billingModel: "API free / fulfilment on order",
      paymentExposure: "fulfilment when orders placed (governed)",
      autoScaling: false,
      empireAiCap: null,
      knownMaxExposureUsd: "UNKNOWN",
      billingDataAvailability: "partial",
      unexpectedChargeRisk: "high",
      notes: "Discovery must not place supplier orders; spend gated",
    },
    {
      provider: "Amazon",
      service: "SP-API",
      status: envConfigured(["AMAZON_SP_API_REFRESH_TOKEN", "AMAZON_SP_API_CLIENT_ID"])
        ? "configured"
        : "optional",
      plan: null,
      billingModel: "API + seller fees on sales",
      paymentExposure: "marketplace fees on realised orders",
      autoScaling: false,
      empireAiCap: null,
      knownMaxExposureUsd: "UNKNOWN",
      billingDataAvailability: "partial",
      unexpectedChargeRisk: "medium",
      notes: "Separate ordinary operating cost from customer-order fulfilment cost",
    },
    {
      provider: "Anthropic",
      service: "LLM backup",
      status: envConfigured(["ANTHROPIC_API_KEY"]) ? "configured" : "optional",
      plan: null,
      billingModel: "token metered",
      paymentExposure: "usage-based if enabled",
      autoScaling: true,
      empireAiCap: null,
      knownMaxExposureUsd: "UNKNOWN",
      billingDataAvailability: "none",
      unexpectedChargeRisk: "medium",
      notes: "Only chargeable if key configured and router selects it",
    },
  ];
}

export function buildScaleCostForecast(workspaceId: string) {
  const kpi = buildSmartViableKpiSnapshot(workspaceId);
  const commission = getOneProductCommissioningRecord(workspaceId);
  const measuredUnit =
    commission?.attributableCostUsd != null && commission.attributableCostUsd > 0
      ? commission.attributableCostUsd
      : null;

  const evaluated = Math.max(1, kpi.candidatesEvaluated || 1);
  const smart = Math.max(0, kpi.smartViable);
  // Without measured unit cost, refuse fabrication — report INSUFFICIENT
  if (measuredUnit == null) {
    return {
      basis: "INSUFFICIENT_MEASURED_DATA",
      costPerRawCandidateUsd: null as number | null,
      costPerSmartViableUsd: null as number | null,
      scenarios: {
        "1": null,
        "10": null,
        "100": null,
        "1000": null,
        "10000": null,
      } as Record<string, number | null>,
      monthlyMonitoring1000Usd: null as number | null,
      confidence: "none" as const,
      notes: [
        "Do not fabricate precision or blindly multiply by 1,000.",
        `Pipeline evidence: evaluated=${evaluated}, smartViable=${smart}.`,
        "Capture one-product attributable cost to unlock forecasts.",
      ],
    };
  }

  return {
    basis: "ONE_PRODUCT_MEASURED",
    costPerRawCandidateUsd: measuredUnit,
    costPerSmartViableUsd: measuredUnit,
    scenarios: {
      "1": measuredUnit,
      "10": measuredUnit * 10,
      "100": measuredUnit * 100,
      "1000": measuredUnit * 1000,
      "10000": measuredUnit * 10000,
    },
    monthlyMonitoring1000Usd: measuredUnit * 1000 * 0.05,
    confidence: "low" as const,
    notes: [
      "Linear extrapolation from one measured unit — uncertainty remains high.",
      "Hybrid/deterministic funnel should reduce realised unit cost vs AI-heavy path.",
    ],
  };
}

export function buildCostControlCentreSnapshot(workspaceId: string): CostControlCentreSnapshot {
  const costGuard = buildCostGuardStatus(workspaceId);
  const exposure = buildBillingExposureRegister();
  const catalog = costIntelligenceRegistry.listCatalog();
  const now = new Date().toISOString();

  const providers = exposure.map((row) => {
    const budget =
      row.provider === "OpenAI"
        ? costGuard.limits.dailyAiBudgetUsd
        : costGuard.limits.monthlyOperatingBudgetUsd;
    const today =
      row.provider === "OpenAI" ? costGuard.spend.dailyAi.actualUsd : ("UNKNOWN" as const);
    const month =
      row.provider === "OpenAI"
        ? costGuard.spend.autonomousPaid.actualUsd + costGuard.spend.dailyAi.actualUsd
        : ("UNKNOWN" as const);
    const forecast =
      typeof today === "number" && typeof month === "number"
        ? costGuard.spend.dailyAi.forecastUsd
        : ("UNKNOWN" as const);
    const pct =
      typeof budget === "number" && budget > 0 && typeof month === "number"
        ? Math.round((month / budget) * 100)
        : null;

    return {
      provider: row.provider,
      service: row.service,
      status: row.status,
      plan: row.plan,
      billingModel: row.billingModel,
      currentUsage: null,
      todayUsd: today,
      thisMonthUsd: month,
      lastMonthUsd: "UNKNOWN" as const,
      forecastMonthEndUsd: forecast,
      budgetLimitUsd: budget,
      pctConsumed: pct,
      lastRefreshed: now,
      costDataSource:
        row.billingDataAvailability === "none" ? "blind-spot" : "internal-spend-ledger+env",
      confidence:
        row.billingDataAvailability === "none"
          ? ("none" as const)
          : row.billingDataAvailability === "partial"
            ? ("low" as const)
            : ("medium" as const),
      billingBlindSpot: row.billingDataAvailability === "none",
    };
  });

  const blindSpots = [
    ...exposure
      .filter((e) => e.billingDataAvailability === "none" || e.knownMaxExposureUsd === "UNKNOWN")
      .map((e) => `${e.provider}: ${e.notes}`),
    `Static catalog entries: ${catalog.length} (architecture dependency list — not live invoices)`,
  ];

  return {
    computedAt: now,
    reportingCurrency: "USD",
    costGuard,
    providers,
    billingExposure: exposure,
    actualVsCommittedVsForecast: {
      actualUsd:
        costGuard.spend.dailyAi.actualUsd +
        costGuard.spend.monthlyOperating.actualUsd +
        costGuard.spend.autonomousPaid.actualUsd,
      committedUsd:
        costGuard.spend.dailyAi.committedUsd +
        costGuard.spend.monthlyOperating.committedUsd +
        costGuard.spend.autonomousPaid.committedUsd,
      forecastUsd:
        costGuard.spend.dailyAi.forecastUsd +
        costGuard.spend.monthlyOperating.forecastUsd +
        costGuard.spend.autonomousPaid.forecastUsd,
      note: "ACTUAL, COMMITTED, and FORECAST are reported separately and never merged.",
    },
    attribution: {
      pillowUsd: "INSUFFICIENT_MEASURED_DATA",
      commerceCycleUsd: "INSUFFICIENT_MEASURED_DATA",
      memoryUsd: "INSUFFICIENT_MEASURED_DATA",
      hostingUsd: "INSUFFICIENT_MEASURED_DATA",
    },
    scaleForecast: buildScaleCostForecast(workspaceId),
    blindSpots,
  };
}
