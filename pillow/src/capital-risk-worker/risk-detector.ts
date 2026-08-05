import type { CapitalRiskWorkerConfiguration } from "./configuration.js";
import { computeBpsDelta } from "./money.js";
import { nextRiskId } from "./risk-store.js";
import type {
  CapitalRisk,
  DetectionContext,
  EscalationLevel,
  SeverityLevel,
  VerifiedBudgetSnapshot,
  VerifiedCashflowSnapshot,
  VerifiedInvestmentSnapshot,
  VerifiedLiquiditySnapshot,
  VerifiedProfitabilitySnapshot,
  VerifiedRevenueSnapshot,
  MultiBusinessCashEntry,
} from "./types.js";

const SEVERITY_ORDER: Record<SeverityLevel, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function baseRisk(
  category: CapitalRisk["category"],
  title: string,
  description: string,
  sourceRefs: string[],
  evidenceRefs: string[],
  currency: string,
  detectedFrom: string,
  magnitudeMinor: number | null,
  severity: SeverityLevel,
  probabilityBps: number,
  impactBps: number,
  escalationLevel: EscalationLevel,
): CapitalRisk {
  return {
    riskId: nextRiskId(),
    category,
    severity,
    probabilityBps,
    impactBps,
    escalationLevel,
    resolutionStatus: "open",
    title,
    description,
    evidenceRefs: [...evidenceRefs],
    sourceRefs: [...sourceRefs],
    magnitudeMinor,
    currency,
    detectedFrom,
    observedAt: new Date().toISOString(),
    fabricated: false,
  };
}

export function scoreSeverityFromBps(bps: number, config: CapitalRiskWorkerConfiguration): SeverityLevel {
  if (bps >= config.budgetOverrunBps * 4) return "critical";
  if (bps >= config.budgetOverrunBps * 2) return "high";
  if (bps >= config.budgetOverrunBps) return "medium";
  if (bps >= Math.floor(config.budgetOverrunBps / 2)) return "low";
  return "info";
}

export function scoreSeverityFromMagnitude(
  magnitudeMinor: number,
  thresholdMinor: number,
): SeverityLevel {
  if (thresholdMinor <= 0) return magnitudeMinor > 0 ? "medium" : "info";
  const ratio = magnitudeMinor / thresholdMinor;
  if (ratio >= 4) return "critical";
  if (ratio >= 2) return "high";
  if (ratio >= 1) return "medium";
  if (ratio >= 0.5) return "low";
  return "info";
}

export function scoreEscalation(severity: SeverityLevel): EscalationLevel {
  if (severity === "critical") return "grand_king";
  if (severity === "high") return "pillow";
  return "monitor";
}

export function scoreProbabilityBps(severity: SeverityLevel): number {
  const map: Record<SeverityLevel, number> = {
    info: 1000,
    low: 2500,
    medium: 5000,
    high: 7500,
    critical: 9000,
  };
  return map[severity];
}

export function scoreImpactBps(magnitudeMinor: number | null, referenceMinor: number): number {
  if (magnitudeMinor == null || referenceMinor <= 0) return 3000;
  const bps = computeBpsDelta(magnitudeMinor, referenceMinor);
  return Math.min(10000, Math.max(500, bps));
}

export function detectOverspending(
  snapshot: VerifiedBudgetSnapshot | null | undefined,
  config: CapitalRiskWorkerConfiguration,
): CapitalRisk | null {
  if (!snapshot || snapshot.fabricated !== false) return null;
  if (!Number.isInteger(snapshot.plannedMinor) || !Number.isInteger(snapshot.actualMinor)) return null;
  if (snapshot.actualMinor <= snapshot.plannedMinor) return null;
  const overrunMinor = snapshot.actualMinor - snapshot.plannedMinor;
  const overrunBps = computeBpsDelta(overrunMinor, snapshot.plannedMinor);
  const severity = scoreSeverityFromBps(overrunBps, config);
  return baseRisk(
    "overspending",
    "Budget overspending detected",
    `Actual spend ${snapshot.actualMinor} exceeds planned ${snapshot.plannedMinor} by ${overrunMinor} minor units (${overrunBps} bps)`,
    snapshot.sourceRefs,
    snapshot.sourceRefs,
    snapshot.currency,
    "budgetSnapshot",
    overrunMinor,
    severity,
    scoreProbabilityBps(severity),
    scoreImpactBps(overrunMinor, snapshot.plannedMinor),
    scoreEscalation(severity),
  );
}

export function detectCashShortage(
  snapshot: VerifiedCashflowSnapshot | null | undefined,
  config: CapitalRiskWorkerConfiguration,
): CapitalRisk | null {
  if (!snapshot || snapshot.fabricated !== false) return null;
  if (!Number.isInteger(snapshot.cashPositionMinor)) return null;
  if (snapshot.cashPositionMinor >= config.cashShortageMinor) return null;
  const shortageMinor = config.cashShortageMinor - snapshot.cashPositionMinor;
  const severity = scoreSeverityFromMagnitude(shortageMinor, config.cashShortageMinor);
  return baseRisk(
    "cash_shortage",
    "Cash shortage detected",
    `Cash position ${snapshot.cashPositionMinor} is below threshold ${config.cashShortageMinor} minor units`,
    snapshot.sourceRefs,
    snapshot.sourceRefs,
    snapshot.currency,
    "cashflowSnapshot",
    shortageMinor,
    severity,
    scoreProbabilityBps(severity),
    scoreImpactBps(shortageMinor, config.cashShortageMinor),
    scoreEscalation(severity),
  );
}

export function detectLiquidityRisk(
  snapshot: VerifiedLiquiditySnapshot | null | undefined,
  config: CapitalRiskWorkerConfiguration,
): CapitalRisk | null {
  if (!snapshot) return null;
  if (snapshot.fabricated !== false) return null;
  if (snapshot.runwayDays == null || !Number.isFinite(snapshot.runwayDays)) return null;
  if (snapshot.runwayDays >= config.liquidityDaysWarning) return null;
  const severity: SeverityLevel =
    snapshot.runwayDays <= 7 ? "critical" : snapshot.runwayDays <= 14 ? "high" : "medium";
  return baseRisk(
    "liquidity",
    "Liquidity risk identified",
    `Cash runway ${snapshot.runwayDays} days is below warning threshold ${config.liquidityDaysWarning} days`,
    snapshot.sourceRefs,
    snapshot.sourceRefs,
    snapshot.currency,
    "liquiditySnapshot",
    snapshot.runwayDays,
    severity,
    scoreProbabilityBps(severity),
    Math.min(10000, computeBpsDelta(config.liquidityDaysWarning - snapshot.runwayDays, config.liquidityDaysWarning)),
    scoreEscalation(severity),
  );
}

export function detectBudgetOverrun(
  snapshot: VerifiedBudgetSnapshot | null | undefined,
  config: CapitalRiskWorkerConfiguration,
): CapitalRisk | null {
  if (!snapshot || snapshot.fabricated !== false) return null;
  if (!Number.isInteger(snapshot.plannedMinor) || snapshot.plannedMinor <= 0) return null;
  if (!Number.isInteger(snapshot.actualMinor)) return null;
  const overrunMinor = snapshot.actualMinor - snapshot.plannedMinor;
  if (overrunMinor <= 0) return null;
  const overrunBps = computeBpsDelta(overrunMinor, snapshot.plannedMinor);
  if (overrunBps < config.budgetOverrunBps) return null;
  const severity = scoreSeverityFromBps(overrunBps, config);
  return baseRisk(
    "budget_overrun",
    "Budget overrun threshold exceeded",
    `Budget overrun ${overrunBps} bps exceeds threshold ${config.budgetOverrunBps} bps`,
    snapshot.sourceRefs,
    snapshot.sourceRefs,
    snapshot.currency,
    "budgetSnapshot",
    overrunMinor,
    severity,
    scoreProbabilityBps(severity),
    scoreImpactBps(overrunMinor, snapshot.plannedMinor),
    scoreEscalation(severity),
  );
}

export function detectRevenueDecline(
  snapshot: VerifiedRevenueSnapshot | null | undefined,
  config: CapitalRiskWorkerConfiguration,
): CapitalRisk | null {
  if (!snapshot || snapshot.fabricated !== false) return null;
  if (snapshot.priorTotalMinor == null || !Number.isInteger(snapshot.priorTotalMinor)) return null;
  if (!Number.isInteger(snapshot.totalMinor)) return null;
  if (snapshot.totalMinor >= snapshot.priorTotalMinor) return null;
  const declineMinor = snapshot.priorTotalMinor - snapshot.totalMinor;
  const declineBps = computeBpsDelta(declineMinor, snapshot.priorTotalMinor);
  if (declineBps < config.revenueDeclineBps) return null;
  const severity = scoreSeverityFromBps(declineBps, config);
  return baseRisk(
    "revenue_decline",
    "Revenue decline detected",
    `Revenue declined ${declineBps} bps from prior period (${snapshot.priorTotalMinor} to ${snapshot.totalMinor})`,
    snapshot.sourceRefs,
    snapshot.sourceRefs,
    snapshot.currency,
    "revenueSnapshot",
    declineMinor,
    severity,
    scoreProbabilityBps(severity),
    scoreImpactBps(declineMinor, snapshot.priorTotalMinor),
    scoreEscalation(severity),
  );
}

export function detectMarginDeterioration(
  snapshot: VerifiedProfitabilitySnapshot | null | undefined,
  config: CapitalRiskWorkerConfiguration,
): CapitalRisk | null {
  if (!snapshot || snapshot.fabricated !== false) return null;
  if (snapshot.marginBps == null || snapshot.priorMarginBps == null) return null;
  const declineBps = snapshot.priorMarginBps - snapshot.marginBps;
  if (declineBps < config.marginDeclineBps) return null;
  const severity = scoreSeverityFromBps(declineBps, config);
  return baseRisk(
    "margin_deterioration",
    "Margin deterioration detected",
    `Margin declined ${declineBps} bps from ${snapshot.priorMarginBps} to ${snapshot.marginBps}`,
    snapshot.sourceRefs,
    snapshot.sourceRefs,
    snapshot.currency,
    "profitabilitySnapshot",
    declineBps,
    severity,
    scoreProbabilityBps(severity),
    Math.min(10000, declineBps),
    scoreEscalation(severity),
  );
}

export function detectNegativeCashflow(
  snapshot: VerifiedCashflowSnapshot | null | undefined,
): CapitalRisk | null {
  if (!snapshot || snapshot.fabricated !== false) return null;
  if (!Number.isInteger(snapshot.netCashflowMinor)) return null;
  if (snapshot.netCashflowMinor >= 0) return null;
  const magnitude = Math.abs(snapshot.netCashflowMinor);
  const severity: SeverityLevel = magnitude >= 1_000_000 ? "critical" : magnitude >= 500_000 ? "high" : "medium";
  return baseRisk(
    "negative_cashflow",
    "Negative cashflow detected",
    `Net cashflow ${snapshot.netCashflowMinor} is negative`,
    snapshot.sourceRefs,
    snapshot.sourceRefs,
    snapshot.currency,
    "cashflowSnapshot",
    magnitude,
    severity,
    scoreProbabilityBps(severity),
    scoreImpactBps(magnitude, Math.max(magnitude, 1)),
    scoreEscalation(severity),
  );
}

export function detectUnderperformingInvestment(
  snapshot: VerifiedInvestmentSnapshot | null | undefined,
  config: CapitalRiskWorkerConfiguration,
): CapitalRisk[] {
  if (!snapshot || snapshot.fabricated !== false) return [];
  const risks: CapitalRisk[] = [];
  for (const opp of snapshot.opportunities) {
    const underRoi = opp.expectedRoiBps < config.underperformingRoiBps;
    const rejected = opp.recommendation === "reject" || opp.recommendation === "defer";
    if (!underRoi && !rejected) continue;
    const severity: SeverityLevel =
      opp.recommendation === "reject" ? "high" : underRoi ? "medium" : "low";
    risks.push(
      baseRisk(
        "underperforming_investment",
        `Underperforming investment: ${opp.opportunityId}`,
        rejected
          ? `Investment ${opp.opportunityId} recommendation is ${opp.recommendation}`
          : `Investment ${opp.opportunityId} ROI ${opp.expectedRoiBps} bps below threshold ${config.underperformingRoiBps} bps`,
        snapshot.sourceRefs,
        opp.evidenceRefs,
        snapshot.currency,
        "investmentSnapshot",
        opp.capitalRequiredMinor,
        severity,
        scoreProbabilityBps(severity),
        scoreImpactBps(opp.capitalRequiredMinor, Math.max(opp.capitalRequiredMinor, 1)),
        scoreEscalation(severity),
      ),
    );
  }
  return risks;
}

export function detectCapitalConcentration(
  entries: MultiBusinessCashEntry[] | null | undefined,
  currency: string,
  config: CapitalRiskWorkerConfiguration,
  sourceRefs: string[],
): CapitalRisk | null {
  if (!entries || entries.length < 2) return null;
  const total = entries.reduce((sum, e) => sum + e.cashMinor, 0);
  if (total <= 0) return null;
  const maxEntry = entries.reduce((a, b) => (b.cashMinor > a.cashMinor ? b : a));
  const shareBps = computeBpsDelta(maxEntry.cashMinor, total);
  if (shareBps < config.capitalConcentrationBps) return null;
  const severity: SeverityLevel = shareBps >= 9000 ? "critical" : shareBps >= 8000 ? "high" : "medium";
  return baseRisk(
    "capital_concentration",
    "Capital concentration risk detected",
    `Business ${maxEntry.businessId} holds ${shareBps} bps of total cash across ${entries.length} businesses`,
    sourceRefs,
    sourceRefs,
    currency,
    "multiBusinessCash",
    maxEntry.cashMinor,
    severity,
    scoreProbabilityBps(severity),
    shareBps,
    scoreEscalation(severity),
  );
}

export function detectAllRisks(ctx: DetectionContext): CapitalRisk[] {
  const risks: CapitalRisk[] = [];
  const overspend = detectOverspending(ctx.budgetSnapshot, ctx.config);
  if (overspend) risks.push(overspend);
  const cashShortage = detectCashShortage(ctx.cashflowSnapshot, ctx.config);
  if (cashShortage) risks.push(cashShortage);
  const liquidity = detectLiquidityRisk(ctx.liquiditySnapshot, ctx.config);
  if (liquidity) risks.push(liquidity);
  const budgetOverrun = detectBudgetOverrun(ctx.budgetSnapshot, ctx.config);
  if (budgetOverrun) risks.push(budgetOverrun);
  const revenueDecline = detectRevenueDecline(ctx.revenueSnapshot, ctx.config);
  if (revenueDecline) risks.push(revenueDecline);
  const marginDecline = detectMarginDeterioration(ctx.profitabilitySnapshot, ctx.config);
  if (marginDecline) risks.push(marginDecline);
  const negativeCf = detectNegativeCashflow(ctx.cashflowSnapshot);
  if (negativeCf) risks.push(negativeCf);
  risks.push(...detectUnderperformingInvestment(ctx.investmentSnapshot, ctx.config));
  const sourceRefs = [
    ...(ctx.budgetSnapshot?.sourceRefs ?? []),
    ...(ctx.cashflowSnapshot?.sourceRefs ?? []),
    ...(ctx.liquiditySnapshot?.sourceRefs ?? []),
  ];
  const concentration = detectCapitalConcentration(
    ctx.multiBusinessCash,
    ctx.currency,
    ctx.config,
    sourceRefs,
  );
  if (concentration) risks.push(concentration);
  return risks;
}

export function prioritiseRisks(risks: CapitalRisk[]): CapitalRisk[] {
  return [...risks].sort((a, b) => {
    const sevDiff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.impactBps - a.impactBps;
  });
}

export function computeConfidenceScore(params: {
  riskCount: number;
  evidenceRefCount: number;
  snapshotCount: number;
}): number {
  let score = 40;
  if (params.snapshotCount >= 1) score += 15;
  if (params.snapshotCount >= 3) score += 15;
  if (params.evidenceRefCount >= 2) score += 15;
  if (params.riskCount >= 1) score += 10;
  return Math.min(100, score);
}
