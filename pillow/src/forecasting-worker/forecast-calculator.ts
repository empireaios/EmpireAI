import { DEFAULT_CURRENCY } from "./paths.js";
import { applyGrowthBps } from "./money.js";
import type { CashRunwayStatus, ForecastMetric, HistoricalPoint } from "./types.js";

export function normalizeCurrency(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim().toUpperCase();
  return trimmed || fallback || DEFAULT_CURRENCY;
}

/** Deterministic forecast-period label — never invented from a calendar assumption; falls back to an explicit "unspecified" marker. */
export function resolveForecastPeriodLabel(input: string | null | undefined): string {
  const trimmed = input?.trim();
  return trimmed || "unspecified";
}

/** Filter historical points to a single business/currency scope — pure, no fabrication. */
export function filterHistoricalPoints(
  points: readonly HistoricalPoint[],
  filter: { businessId?: string | null; metric?: ForecastMetric; currency?: string | null },
): HistoricalPoint[] {
  return points.filter((point) => {
    if (filter.businessId && point.businessId !== filter.businessId) return false;
    if (filter.metric && point.metric !== filter.metric) return false;
    if (filter.currency && point.currency !== filter.currency) return false;
    return true;
  });
}

const YEAR_MONTH = /^(\d{4})-(\d{2})$/;
const YEAR_ONLY = /^(\d{4})$/;

/**
 * Chronological comparator for period labels. Recognises `YYYY-MM` and
 * `YYYY` deterministically; otherwise falls back to a stable lexicographic
 * comparison — never guesses a calendar interpretation of an unrecognised
 * label.
 */
export function comparePeriodLabels(a: string, b: string): -1 | 0 | 1 {
  const am = YEAR_MONTH.exec(a);
  const bm = YEAR_MONTH.exec(b);
  if (am && bm) {
    const av = Number(am[1]) * 12 + Number(am[2]);
    const bv = Number(bm[1]) * 12 + Number(bm[2]);
    return av < bv ? -1 : av > bv ? 1 : 0;
  }
  const ay = YEAR_ONLY.exec(a);
  const by = YEAR_ONLY.exec(b);
  if (ay && by) {
    const av = Number(ay[1]);
    const bv = Number(by[1]);
    return av < bv ? -1 : av > bv ? 1 : 0;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Sort historical points chronologically by period label — never reorders based on a fabricated date interpretation. */
export function sortHistoricalPointsChronologically(points: readonly HistoricalPoint[]): HistoricalPoint[] {
  return [...points].sort((a, b) => comparePeriodLabels(a.periodLabel, b.periodLabel));
}

/**
 * Increment a period label forward by `n` periods. Recognises `YYYY-MM`
 * (rolled forward by calendar months) and `YYYY` (rolled forward by
 * calendar years) deterministically; any other label format is never
 * reinterpreted as a calendar value — it is suffixed with `+n` instead so
 * the forecast period is still uniquely identifiable without inventing a
 * date.
 */
export function incrementPeriodLabel(label: string, n: number): string {
  const ym = YEAR_MONTH.exec(label);
  if (ym) {
    const totalMonths = Number(ym[1]) * 12 + (Number(ym[2]) - 1) + n;
    const year = Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    return `${year}-${String(month).padStart(2, "0")}`;
  }
  const y = YEAR_ONLY.exec(label);
  if (y) {
    return String(Number(y[1]) + n);
  }
  return `${label}+${n}`;
}

export type GrowthRateResult = {
  growthRateBps: number;
  derived: boolean;
  usedDefault: boolean;
  note: string | null;
};

/**
 * Resolve the growth rate (basis points) used to project a metric forward.
 * An explicit caller-supplied rate always wins. Otherwise the rate is
 * derived purely from the last two verified historical points
 * (`((last-prev)*10000)/prev`, integer division). When fewer than two
 * historical points are available and no rate was supplied, the rate
 * defaults to zero — an explicitly-labelled, non-fabricated default, never
 * a fabricated growth assumption.
 */
export function deriveGrowthRateBps(
  chronologicalPoints: readonly HistoricalPoint[],
  explicitBps: number | null | undefined,
): GrowthRateResult {
  if (typeof explicitBps === "number" && Number.isFinite(explicitBps)) {
    return { growthRateBps: Math.trunc(explicitBps), derived: false, usedDefault: false, note: null };
  }
  if (chronologicalPoints.length >= 2) {
    const prev = chronologicalPoints[chronologicalPoints.length - 2]!.amountMinor;
    const last = chronologicalPoints[chronologicalPoints.length - 1]!.amountMinor;
    if (prev !== 0) {
      const growthRateBps = Math.trunc(((last - prev) * 10000) / prev);
      return { growthRateBps, derived: true, usedDefault: false, note: null };
    }
    return {
      growthRateBps: 0,
      derived: true,
      usedDefault: true,
      note: "zero_growth_default_due_to_insufficient_history",
    };
  }
  return {
    growthRateBps: 0,
    derived: false,
    usedDefault: true,
    note: "zero_growth_default_due_to_insufficient_history",
  };
}

export type ScenarioGrowthRates = {
  best_case: number;
  expected: number;
  worst_case: number;
};

/**
 * Derive best/expected/worst-case growth rates from the expected rate and a
 * sensitivity delta (basis points): best = expected + delta, worst =
 * expected - delta (floored at -10000, i.e. never below a total decline).
 * Documented, never invented silently — the delta used is always either
 * caller-supplied or the configured default.
 */
export function buildScenarioGrowthRates(expectedGrowthRateBps: number, sensitivityDeltaBps: number): ScenarioGrowthRates {
  const delta = Math.trunc(sensitivityDeltaBps);
  return {
    best_case: expectedGrowthRateBps + delta,
    expected: expectedGrowthRateBps,
    worst_case: Math.max(-10000, expectedGrowthRateBps - delta),
  };
}

export type ProjectedPoint = { periodLabel: string; amountMinor: number };

/**
 * Roll a metric forward `horizonPeriods` periods from `lastAmountMinor` at
 * `lastPeriodLabel`, applying `growthRateBps` compounding at each step via
 * integer truncated arithmetic only (`applyGrowthBps`) — never a
 * floating-point projection.
 */
export function projectSeriesForward(params: {
  lastAmountMinor: number;
  lastPeriodLabel: string;
  growthRateBps: number;
  horizonPeriods: number;
}): ProjectedPoint[] {
  const { lastAmountMinor, lastPeriodLabel, growthRateBps, horizonPeriods } = params;
  const points: ProjectedPoint[] = [];
  let current = lastAmountMinor;
  for (let i = 1; i <= horizonPeriods; i += 1) {
    current = applyGrowthBps(current, growthRateBps);
    points.push({ periodLabel: incrementPeriodLabel(lastPeriodLabel, i), amountMinor: current });
  }
  return points;
}

export type NetCashflowAverageResult = {
  avgNetCashflowMinor: number;
  sampleCount: number;
  derivedFromClosingCash: boolean;
};

/**
 * Average net monthly cashflow from verified historical evidence. Prefers
 * explicit `net_cashflow` historical points (simple integer average,
 * truncated); when none exist, derives period-over-period deltas from
 * `closing_cash` historical points instead. Returns a zero average with
 * `sampleCount: 0` when neither is available — never fabricates a cashflow
 * trend.
 */
export function averageNetCashflow(
  netCashflowPoints: readonly HistoricalPoint[],
  closingCashPointsChronological: readonly HistoricalPoint[],
): NetCashflowAverageResult {
  if (netCashflowPoints.length > 0) {
    const sum = netCashflowPoints.reduce((acc, p) => acc + p.amountMinor, 0);
    return {
      avgNetCashflowMinor: Math.trunc(sum / netCashflowPoints.length),
      sampleCount: netCashflowPoints.length,
      derivedFromClosingCash: false,
    };
  }
  if (closingCashPointsChronological.length >= 2) {
    const deltas: number[] = [];
    for (let i = 1; i < closingCashPointsChronological.length; i += 1) {
      deltas.push(closingCashPointsChronological[i]!.amountMinor - closingCashPointsChronological[i - 1]!.amountMinor);
    }
    const sum = deltas.reduce((acc, d) => acc + d, 0);
    return {
      avgNetCashflowMinor: Math.trunc(sum / deltas.length),
      sampleCount: deltas.length,
      derivedFromClosingCash: true,
    };
  }
  return { avgNetCashflowMinor: 0, sampleCount: 0, derivedFromClosingCash: false };
}

export type CashRunwayComputation = {
  status: CashRunwayStatus;
  monthlyNetBurnMinor: number;
  monthlySurplusMinor: number;
  runwayMonths: number | null;
  runwayDays: number | null;
};

/**
 * Compute the cash-runway status deterministically from opening cash and
 * the average net monthly cashflow. Burn = `max(0, -avgNetCashflow)`. When
 * the business is net cash-positive (or exactly breakeven), runway is
 * recorded as indefinite (`runwayMonths: null`) rather than a fabricated
 * ceiling. Integer division (truncated) is used throughout; `runwayDays`
 * is approximated on a fixed 30-day month, always documented as such by
 * the caller via a supporting assumption.
 */
export function computeCashRunway(openingCashMinor: number, avgNetCashflowMinor: number): CashRunwayComputation {
  const burn = Math.max(0, -avgNetCashflowMinor);
  const surplus = Math.max(0, avgNetCashflowMinor);
  if (burn === 0) {
    return {
      status: surplus > 0 ? "surplus" : "breakeven",
      monthlyNetBurnMinor: 0,
      monthlySurplusMinor: surplus,
      runwayMonths: null,
      runwayDays: null,
    };
  }
  const runwayMonths = Math.trunc(openingCashMinor / burn);
  const runwayDays = Math.trunc((openingCashMinor * 30) / burn);
  return {
    status: "burning",
    monthlyNetBurnMinor: burn,
    monthlySurplusMinor: 0,
    runwayMonths: Math.max(0, runwayMonths),
    runwayDays: Math.max(0, runwayDays),
  };
}

/**
 * Integer confidence score (0-100) from the completeness of verified
 * historical evidence and assumption coverage — never a fabricated
 * confidence figure. Weighted equally across the supplied checks.
 */
export function computeConfidenceScore(checks: readonly boolean[]): number {
  if (!checks.length) return 0;
  const weight = 100 / checks.length;
  let score = 0;
  for (const ok of checks) if (ok) score += weight;
  return Math.min(100, Math.round(score));
}

/** Same confidence computation expressed as basis points (0-10000) for use on forecast points/assessments. */
export function computeConfidenceBps(checks: readonly boolean[]): number {
  return computeConfidenceScore(checks) * 100;
}
