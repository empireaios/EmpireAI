import { DEFAULT_CURRENCY } from "./paths.js";
import {
  basisPointsToPercent,
  moneyRatioBasisPoints,
  moneySub,
  type MoneyMinor,
} from "./money.js";
import type { BudgetPeriod, VarianceSeverity } from "./types.js";

export function normalizeCurrency(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim().toUpperCase();
  return trimmed || fallback || DEFAULT_CURRENCY;
}

/* ------------------------------------------------------------------------ */
/* Deterministic period boundaries                                          */
/* ------------------------------------------------------------------------ */

export type PeriodBoundaries = {
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
};

/**
 * Resolve deterministic UTC period boundaries for a budget period.
 * annual = calendar year, quarterly = calendar quarter, monthly = calendar
 * month, custom = explicit periodStart/periodEnd (required).
 */
export function resolvePeriodBoundaries(
  period: BudgetPeriod,
  periodLabelInput?: string | null,
  periodStartInput?: string | null,
  periodEndInput?: string | null,
): PeriodBoundaries {
  if (period === "custom") {
    if (!periodStartInput || !periodEndInput) {
      throw new Error("Custom budget period requires explicit periodStart and periodEnd");
    }
    const start = new Date(periodStartInput);
    const end = new Date(periodEndInput);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Custom periodStart/periodEnd must be valid ISO date strings");
    }
    return {
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      periodLabel: `${start.toISOString().slice(0, 10)}_to_${end.toISOString().slice(0, 10)}`,
    };
  }

  const reference = resolveReferenceDate(period, periodLabelInput);

  if (period === "monthly") {
    const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    return {
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      periodLabel: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
    };
  }

  if (period === "quarterly") {
    const quarterIndex = Math.floor(reference.getUTCMonth() / 3);
    const start = new Date(Date.UTC(reference.getUTCFullYear(), quarterIndex * 3, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(reference.getUTCFullYear(), quarterIndex * 3 + 3, 0, 23, 59, 59, 999));
    return {
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      periodLabel: `${start.getUTCFullYear()}-Q${quarterIndex + 1}`,
    };
  }

  // annual
  const start = new Date(Date.UTC(reference.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(reference.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
  return { periodStart: start.toISOString(), periodEnd: end.toISOString(), periodLabel: String(start.getUTCFullYear()) };
}

function resolveReferenceDate(period: BudgetPeriod, periodLabel?: string | null): Date {
  if (!periodLabel?.trim()) return new Date();
  const label = periodLabel.trim();
  if (period === "monthly") {
    const parsed = new Date(`${label}-01T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid monthly budgetPeriod label: ${label}`);
    return parsed;
  }
  if (period === "quarterly") {
    const match = /^(\d{4})-Q([1-4])$/.exec(label);
    if (!match) throw new Error(`Invalid quarterly budgetPeriod label: ${label}`);
    const year = Number.parseInt(match[1]!, 10);
    const quarter = Number.parseInt(match[2]!, 10);
    return new Date(Date.UTC(year, (quarter - 1) * 3, 1));
  }
  // annual
  const year = Number.parseInt(label, 10);
  if (!Number.isFinite(year)) throw new Error(`Invalid annual budgetPeriod label: ${label}`);
  return new Date(Date.UTC(year, 0, 1));
}

/* ------------------------------------------------------------------------ */
/* Utilisation and variance — pure integer money math                      */
/* ------------------------------------------------------------------------ */

/**
 * Utilisation percentage derived exclusively from integer basis points
 * ((actual*10000)/planned)/100). When planned is zero (no budget allocated)
 * utilisation is 0 if actual is also zero, or Infinity when spending
 * occurred against an unallocated budget — never a fabricated finite ratio.
 */
export function computeUtilisationPercent(actual: MoneyMinor, planned: MoneyMinor): number {
  if (planned.minorUnits <= 0) {
    return actual.minorUnits > 0 ? Number.POSITIVE_INFINITY : 0;
  }
  const basisPoints = moneyRatioBasisPoints(actual.minorUnits, planned.minorUnits);
  return basisPoints === null ? 0 : basisPointsToPercent(basisPoints);
}

/** varianceAmount = actual - planned (positive = overspend). */
export function computeVarianceAmount(actual: MoneyMinor, planned: MoneyMinor): MoneyMinor {
  return moneySub(actual, planned);
}

/** variancePercentage relative to planned, via integer basis points; null when planned is zero. */
export function computeVariancePercent(variance: MoneyMinor, planned: MoneyMinor): number | null {
  if (planned.minorUnits === 0) return null;
  const basisPoints = moneyRatioBasisPoints(Math.abs(variance.minorUnits), Math.abs(planned.minorUnits));
  if (basisPoints === null) return null;
  const percent = basisPointsToPercent(basisPoints);
  return variance.minorUnits < 0 ? -percent : percent;
}

export function classifyOverspendSeverity(
  utilisationPercent: number,
  highThreshold: number,
  criticalThreshold: number,
): VarianceSeverity {
  if (utilisationPercent >= criticalThreshold) return "critical";
  if (utilisationPercent >= highThreshold) return "high";
  return "medium";
}

export function classifyUnderspendSeverity(utilisationPercent: number, severeThreshold: number): VarianceSeverity {
  if (utilisationPercent <= severeThreshold / 2) return "high";
  if (utilisationPercent <= severeThreshold) return "medium";
  return "low";
}

export function computeConfidenceScore(params: {
  hasBudgets: boolean;
  outstandingIssueCount: number;
  allActualsEvidencePresent: boolean;
  allApprovalStatusResolved: boolean;
}): number {
  const checks: boolean[] = [
    params.hasBudgets,
    params.outstandingIssueCount === 0,
    params.allActualsEvidencePresent,
    params.allApprovalStatusResolved,
  ];
  const weight = 100 / checks.length;
  let score = 0;
  for (const ok of checks) if (ok) score += weight;
  return Math.min(100, Math.round(score));
}

/** Average of a list of numbers, ignoring non-finite entries — display-only, never fed back into money math. */
export function averageOf(values: number[]): number | null {
  const finite = values.filter((v) => Number.isFinite(v));
  if (!finite.length) return null;
  const sum = finite.reduce((acc, v) => acc + v, 0);
  return sum / finite.length;
}
