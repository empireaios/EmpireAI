import { DEFAULT_CURRENCY } from "./paths.js";
import { moneyAdd, moneyFromDecimal, moneyFromMinor, moneySub, moneyZero, type MoneyMinor } from "./money.js";
import type {
  AmountStatus,
  CashAmountSummary,
  CashMovement,
  CashMovementDirection,
  InjectedAccountingEntry,
  InjectedLedgerLine,
  LiquidityStatus,
  ReconciliationStatus,
  ReportingFrequency,
  TransfersSummary,
} from "./types.js";

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
 * Resolve deterministic UTC period boundaries for a reporting frequency.
 * daily = calendar day UTC, weekly = ISO week Monday-Sunday UTC,
 * monthly = calendar month, annual = calendar year,
 * custom = explicit periodStart/periodEnd (required).
 */
export function resolvePeriodBoundaries(
  frequency: ReportingFrequency,
  reportingPeriod?: string | null,
  periodStartInput?: string | null,
  periodEndInput?: string | null,
): PeriodBoundaries {
  if (frequency === "custom") {
    if (!periodStartInput || !periodEndInput) {
      throw new Error("Custom reporting frequency requires explicit periodStart and periodEnd");
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

  const reference = resolveReferenceDate(frequency, reportingPeriod);

  if (frequency === "daily") {
    const start = startOfUtcDay(reference);
    const end = endOfUtcDay(reference);
    return { periodStart: start.toISOString(), periodEnd: end.toISOString(), periodLabel: dateLabel(start) };
  }

  if (frequency === "weekly") {
    const monday = mondayOfIsoWeek(reference);
    const start = startOfUtcDay(monday);
    const end = endOfUtcDay(addUtcDays(monday, 6));
    return { periodStart: start.toISOString(), periodEnd: end.toISOString(), periodLabel: isoWeekLabel(start) };
  }

  if (frequency === "monthly") {
    const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    return {
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      periodLabel: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
    };
  }

  // annual
  const start = new Date(Date.UTC(reference.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(reference.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
  return { periodStart: start.toISOString(), periodEnd: end.toISOString(), periodLabel: String(start.getUTCFullYear()) };
}

/** Resolve the prior period's boundaries for period-over-period comparison. */
export function resolvePriorPeriodBoundaries(
  frequency: ReportingFrequency,
  current: PeriodBoundaries,
): PeriodBoundaries | null {
  if (frequency === "custom") return null;
  const currentStart = new Date(current.periodStart);
  if (frequency === "daily") {
    const priorReference = addUtcDays(currentStart, -1);
    return resolvePeriodBoundaries("daily", dateLabel(priorReference));
  }
  if (frequency === "weekly") {
    const priorReference = addUtcDays(currentStart, -7);
    return resolvePeriodBoundaries("weekly", isoWeekLabel(priorReference));
  }
  if (frequency === "monthly") {
    const priorMonthDate = new Date(Date.UTC(currentStart.getUTCFullYear(), currentStart.getUTCMonth() - 1, 1));
    const label = `${priorMonthDate.getUTCFullYear()}-${String(priorMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;
    return resolvePeriodBoundaries("monthly", label);
  }
  // annual
  return resolvePeriodBoundaries("annual", String(currentStart.getUTCFullYear() - 1));
}

function resolveReferenceDate(frequency: ReportingFrequency, reportingPeriod?: string | null): Date {
  if (!reportingPeriod?.trim()) return new Date();
  const label = reportingPeriod.trim();
  if (frequency === "daily") {
    const parsed = new Date(`${label}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid daily reportingPeriod: ${label}`);
    return parsed;
  }
  if (frequency === "weekly") {
    if (/^\d{4}-W\d{1,2}$/.test(label)) return mondayFromIsoWeekLabel(label);
    const parsed = new Date(label);
    if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid weekly reportingPeriod: ${label}`);
    return parsed;
  }
  if (frequency === "monthly") {
    const parsed = new Date(`${label}-01T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid monthly reportingPeriod: ${label}`);
    return parsed;
  }
  // annual
  const year = Number.parseInt(label, 10);
  if (!Number.isFinite(year)) throw new Error(`Invalid annual reportingPeriod: ${label}`);
  return new Date(Date.UTC(year, 0, 1));
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function addUtcDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function dateLabel(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mondayOfIsoWeek(date: Date): Date {
  const day = date.getUTCDay(); // 0=Sun..6=Sat
  const isoDay = day === 0 ? 7 : day; // 1=Mon..7=Sun
  return addUtcDays(startOfUtcDay(date), -(isoDay - 1));
}

function isoWeekLabel(mondayUtc: Date): string {
  const target = addUtcDays(mondayUtc, 3); // Thursday of this ISO week determines the ISO year
  const year = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const firstThursdayIsoDay = firstThursday.getUTCDay() || 7;
  const firstMonday = addUtcDays(firstThursday, -(firstThursdayIsoDay - 1));
  const weekNumber = Math.round((target.getTime() - firstMonday.getTime()) / (7 * 24 * 3600 * 1000)) + 1;
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

function mondayFromIsoWeekLabel(label: string): Date {
  const match = /^(\d{4})-W(\d{1,2})$/.exec(label);
  if (!match) throw new Error(`Invalid ISO week reportingPeriod: ${label}`);
  const year = Number.parseInt(match[1]!, 10);
  const week = Number.parseInt(match[2]!, 10);
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const firstThursdayIsoDay = firstThursday.getUTCDay() || 7;
  const firstMonday = addUtcDays(firstThursday, -(firstThursdayIsoDay - 1));
  return addUtcDays(firstMonday, (week - 1) * 7);
}

/* ------------------------------------------------------------------------ */
/* Verified-record → cash-movement classification                          */
/* ------------------------------------------------------------------------ */

export type ClassifiedMovementResult = {
  movements: CashMovement[];
  issues: string[];
};

function sumLineAmountMinor(lines: InjectedLedgerLine[], field: "debit" | "credit", currency: string): number {
  return lines.reduce((sum, line) => sum + moneyFromDecimal(line[field] ?? 0, currency).minorUnits, 0);
}

function findLargestLine(
  lines: InjectedLedgerLine[],
  field: "debit" | "credit",
): InjectedLedgerLine | null {
  let best: InjectedLedgerLine | null = null;
  for (const line of lines) {
    const value = line[field] ?? 0;
    if (value > 0 && (!best || value > (best[field] ?? 0))) best = line;
  }
  return best;
}

function buildMovement(params: {
  entry: InjectedAccountingEntry;
  currency: string;
  direction: CashMovementDirection;
  accountId: string;
  amountMinor: number;
  amountStatus: AmountStatus;
  traceRefs: string[];
}): CashMovement {
  const { entry, currency, direction, accountId, amountMinor, amountStatus, traceRefs } = params;
  return {
    movementId: `cfw-mv-${entry.entryId}-${accountId}-${direction}`,
    businessId: entry.businessId,
    accountId,
    direction,
    amountMinor: moneyFromMinor(amountMinor, currency),
    currency,
    category: entry.entryType || "unknown",
    timestamp: entry.timestamp,
    accountingPeriod: entry.accountingPeriod,
    sourceEntryId: entry.entryId,
    amountStatus,
    fabricated: false,
    traceabilityRefs: Array.from(
      new Set([...traceRefs, `cfw:movement:${entry.entryId}:${accountId}:${direction}`]),
    ),
  };
}

/**
 * Classify a single verified Accounting Worker journal entry into zero or
 * more real cash movements. Income → inflow (cash debit side), expense →
 * outflow (cash credit side), transfer → transfer_in/transfer_out pairs
 * (never counted as enterprise income/expense). Any other/unknown entry
 * type is surfaced as a `pending` movement with an outstanding issue rather
 * than silently dropped or fabricated as certain.
 */
export function classifyEntryIntoMovements(
  entry: InjectedAccountingEntry,
  defaultCurrency: string,
): ClassifiedMovementResult {
  const currency = normalizeCurrency(entry.currency, defaultCurrency);
  const issues: string[] = [];
  const movements: CashMovement[] = [];
  const traceRefs = entry.traceabilityRefs?.length ? [...entry.traceabilityRefs] : [`cfw:source_entry:${entry.entryId}`];

  const totalDebitMinor = sumLineAmountMinor(entry.lines, "debit", currency);
  const totalCreditMinor = sumLineAmountMinor(entry.lines, "credit", currency);
  const balanced = totalDebitMinor === totalCreditMinor;
  if (!balanced) {
    issues.push(
      `Accounting entry ${entry.entryId} is not balanced (debitMinor=${totalDebitMinor} creditMinor=${totalCreditMinor}); cash effect surfaced as disputed and excluded from reconciled totals.`,
    );
  }

  const entryType = (entry.entryType || "unknown").toLowerCase();
  const confirmedStatus: AmountStatus = balanced ? "recorded" : "disputed";

  if (entryType === "income") {
    const debitLine = findLargestLine(entry.lines, "debit");
    if (debitLine) {
      movements.push(
        buildMovement({
          entry,
          currency,
          direction: "inflow",
          accountId: debitLine.accountId,
          amountMinor: moneyFromDecimal(debitLine.debit, currency).minorUnits,
          amountStatus: confirmedStatus,
          traceRefs,
        }),
      );
    } else {
      issues.push(`Income entry ${entry.entryId} has no debit (cash) line — cash effect could not be determined.`);
    }
  } else if (entryType === "expense") {
    const creditLine = findLargestLine(entry.lines, "credit");
    if (creditLine) {
      movements.push(
        buildMovement({
          entry,
          currency,
          direction: "outflow",
          accountId: creditLine.accountId,
          amountMinor: moneyFromDecimal(creditLine.credit, currency).minorUnits,
          amountStatus: confirmedStatus,
          traceRefs,
        }),
      );
    } else {
      issues.push(`Expense entry ${entry.entryId} has no credit (cash) line — cash effect could not be determined.`);
    }
  } else if (entryType === "transfer") {
    for (const line of entry.lines) {
      if ((line.debit ?? 0) > 0) {
        movements.push(
          buildMovement({
            entry,
            currency,
            direction: "transfer_in",
            accountId: line.accountId,
            amountMinor: moneyFromDecimal(line.debit, currency).minorUnits,
            amountStatus: confirmedStatus,
            traceRefs,
          }),
        );
      }
      if ((line.credit ?? 0) > 0) {
        movements.push(
          buildMovement({
            entry,
            currency,
            direction: "transfer_out",
            accountId: line.accountId,
            amountMinor: moneyFromDecimal(line.credit, currency).minorUnits,
            amountStatus: confirmedStatus,
            traceRefs,
          }),
        );
      }
    }
    if (!movements.length) {
      issues.push(`Transfer entry ${entry.entryId} has no non-zero lines — no cash movement recorded.`);
    }
  } else {
    const debitLine = findLargestLine(entry.lines, "debit");
    const creditLine = debitLine ? null : findLargestLine(entry.lines, "credit");
    const line = debitLine ?? creditLine;
    if (line) {
      const isDebit = Boolean(debitLine);
      movements.push(
        buildMovement({
          entry,
          currency,
          direction: isDebit ? "inflow" : "outflow",
          accountId: line.accountId,
          amountMinor: moneyFromDecimal(isDebit ? line.debit : line.credit, currency).minorUnits,
          amountStatus: "pending",
          traceRefs,
        }),
      );
      issues.push(
        `Entry ${entry.entryId} has unrecognized entryType '${entry.entryType}'; cash effect surfaced as pending and excluded from reconciled totals until classified.`,
      );
    } else {
      issues.push(
        `Entry ${entry.entryId} has entryType '${entry.entryType}' and no usable lines — no cash movement recorded.`,
      );
    }
  }

  return { movements, issues };
}

/* ------------------------------------------------------------------------ */
/* Aggregation                                                              */
/* ------------------------------------------------------------------------ */

/** Sum only recorded+reconciled ("confirmed") movements into an authoritative total, never silently dropping the rest. */
export function buildAmountSummary(movements: CashMovement[], currency: string): CashAmountSummary {
  let recordedMinor = moneyZero(currency);
  let reconciledMinor = moneyZero(currency);
  let pendingMinor = moneyZero(currency);
  let disputedMinor = moneyZero(currency);
  const categoryTotals = new Map<string, MoneyMinor>();

  for (const movement of movements) {
    const amount = movement.amountMinor;
    if (movement.amountStatus === "recorded") recordedMinor = moneyAdd(recordedMinor, amount);
    else if (movement.amountStatus === "reconciled") reconciledMinor = moneyAdd(reconciledMinor, amount);
    else if (movement.amountStatus === "pending") pendingMinor = moneyAdd(pendingMinor, amount);
    else disputedMinor = moneyAdd(disputedMinor, amount);

    if (movement.amountStatus === "recorded" || movement.amountStatus === "reconciled") {
      const existing = categoryTotals.get(movement.category) ?? moneyZero(currency);
      categoryTotals.set(movement.category, moneyAdd(existing, amount));
    }
  }

  const totalMinor = moneyAdd(recordedMinor, reconciledMinor);
  return {
    totalMinor,
    recordedMinor,
    reconciledMinor,
    pendingMinor,
    disputedMinor,
    movementCount: movements.length,
    byCategory: [...categoryTotals.entries()].map(([category, total]) => ({
      category,
      totalMinor: total,
      fabricated: false,
    })),
    fabricated: false,
    evidencePresent: movements.length > 0,
  };
}

export function buildTransfersSummary(movements: CashMovement[], currency: string): TransfersSummary {
  const inbound = movements.filter((m) => m.direction === "transfer_in");
  const outbound = movements.filter((m) => m.direction === "transfer_out");
  const transferInTotal = inbound.reduce((sum, m) => moneyAdd(sum, m.amountMinor), moneyZero(currency));
  const transferOutTotal = outbound.reduce((sum, m) => moneyAdd(sum, m.amountMinor), moneyZero(currency));
  return {
    transferInTotal,
    transferOutTotal,
    netTransfers: moneySub(transferInTotal, transferOutTotal),
    transferCount: inbound.length + outbound.length,
    fabricated: false,
  };
}

/* ------------------------------------------------------------------------ */
/* Status scoring                                                           */
/* ------------------------------------------------------------------------ */

export function computeReconciliationStatus(movements: CashMovement[]): ReconciliationStatus {
  if (!movements.length) return "unreconciled";
  const disputed = movements.some((m) => m.amountStatus === "disputed");
  if (disputed) return "disputed";
  const pending = movements.some((m) => m.amountStatus === "pending");
  const confirmed = movements.some((m) => m.amountStatus === "recorded" || m.amountStatus === "reconciled");
  if (pending && confirmed) return "partial";
  if (pending && !confirmed) return "pending";
  return "reconciled";
}

/**
 * Liquidity classification derived strictly from confirmed available cash
 * relative to confirmed outflows for the period — never fabricated when
 * evidence is absent.
 */
export function computeLiquidityStatus(params: {
  hasEvidence: boolean;
  reconciliationStatus: ReconciliationStatus;
  availableCashMinor: number;
  outflowsMinor: number;
}): LiquidityStatus {
  const { hasEvidence, reconciliationStatus, availableCashMinor, outflowsMinor } = params;
  if (!hasEvidence) return "unknown";
  if (reconciliationStatus === "unreconciled") return "unreconciled";
  if (availableCashMinor < 0) return "critical";
  if (outflowsMinor <= 0) return availableCashMinor >= 0 ? "healthy" : "critical";
  const ratioTenThousandths = Math.floor((availableCashMinor * 10000) / outflowsMinor);
  if (ratioTenThousandths >= 10000) return "healthy";
  if (ratioTenThousandths >= 5000) return "adequate";
  if (ratioTenThousandths >= 1000) return "tight";
  return "critical";
}

export function computeConfidenceScore(params: {
  hasSourceRecords: boolean;
  reconciliationStatus: ReconciliationStatus;
  outstandingIssueCount: number;
  openingBalanceEvidencePresent: boolean;
}): number {
  const checks: boolean[] = [
    params.hasSourceRecords,
    params.reconciliationStatus === "reconciled",
    params.outstandingIssueCount === 0,
    params.openingBalanceEvidencePresent,
  ];
  const weight = 100 / checks.length;
  let score = 0;
  for (const ok of checks) if (ok) score += weight;
  return Math.min(100, Math.round(score));
}

/** Percentage change is a display-only derived ratio, never fed back into money math. */
export function computePercentChange(current: MoneyMinor, prior: MoneyMinor): number | null {
  if (prior.minorUnits === 0) return null;
  return Math.round(((current.minorUnits - prior.minorUnits) / Math.abs(prior.minorUnits)) * 10000) / 100;
}
