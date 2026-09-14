import type {
  TrueProfitLedger,
  TrueProfitLedgerEntry,
  TrueProfitLedgerLineInputs,
  TrueProfitLedgerTotals,
} from "./types.js";
import { SYNTHETIC_MARKETPLACE } from "./types.js";

const FORBIDDEN_LIVE_KEYS = ["liveSales", "realisedLiveProfit"] as const;

export class SyntheticLedgerError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "SyntheticLedgerError";
    this.code = code;
  }
}

export function moneyRound(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertNoForbiddenLiveFields(value: unknown, path: string): void {
  if (value === null || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  for (const key of FORBIDDEN_LIVE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      throw new SyntheticLedgerError(
        "FORBIDDEN_LIVE_FIELD",
        `Synthetic ledger forbids field '${key}' at ${path}`,
      );
    }
  }
}

function assertSyntheticFlag(entry: { synthetic?: unknown }, path: string): asserts entry is { synthetic: true } {
  if (entry.synthetic !== true) {
    throw new SyntheticLedgerError(
      "SYNTHETIC_FLAG_REQUIRED",
      `TrueProfitLedger entry requires synthetic: true (${path})`,
    );
  }
}

function lineInputs(entry: TrueProfitLedgerLineInputs): TrueProfitLedgerLineInputs {
  return {
    revenue: moneyRound(entry.revenue),
    productCost: moneyRound(entry.productCost),
    shipping: moneyRound(entry.shipping),
    fees: moneyRound(entry.fees),
    ads: moneyRound(entry.ads),
    refunds: moneyRound(entry.refunds),
    returns: moneyRound(entry.returns),
    opex: moneyRound(entry.opex),
  };
}

/** realisedNetProfit = revenue − productCost − shipping − fees − ads − refunds − returns − opex */
export function realisedNetProfitFromLines(lines: TrueProfitLedgerLineInputs): number {
  const l = lineInputs(lines);
  return moneyRound(
    l.revenue -
      l.productCost -
      l.shipping -
      l.fees -
      l.ads -
      l.refunds -
      l.returns -
      l.opex,
  );
}

function emptyTotals(): TrueProfitLedgerTotals {
  return {
    revenue: 0,
    productCost: 0,
    shipping: 0,
    fees: 0,
    ads: 0,
    refunds: 0,
    returns: 0,
    opex: 0,
    realisedNetProfit: 0,
  };
}

/**
 * Reconcile synthetic true-profit ledger entries exactly.
 * Rejects missing synthetic flag and any liveSales / realisedLiveProfit fields.
 */
export function computeProfitLedger(
  entries: TrueProfitLedgerEntry[],
  options?: { ledgerId?: string; currency?: TrueProfitLedgerEntry["currency"] },
): TrueProfitLedger {
  assertNoForbiddenLiveFields(entries, "entries");
  if (!Array.isArray(entries)) {
    throw new SyntheticLedgerError("INVALID_ENTRIES", "entries must be an array");
  }

  const normalised: TrueProfitLedgerEntry[] = [];
  const totals = emptyTotals();
  let currency = options?.currency;

  for (let i = 0; i < entries.length; i += 1) {
    const raw = entries[i];
    const path = `entries[${i}]`;
    if (raw === undefined || raw === null || typeof raw !== "object") {
      throw new SyntheticLedgerError("INVALID_ENTRY", `Invalid ledger entry at ${path}`);
    }
    assertNoForbiddenLiveFields(raw, path);
    assertSyntheticFlag(raw, path);

    const lines = lineInputs(raw);
    const entryCurrency = raw.currency;
    if (!entryCurrency) {
      throw new SyntheticLedgerError("CURRENCY_REQUIRED", `currency required at ${path}`);
    }
    if (currency === undefined) currency = entryCurrency;
    if (currency !== entryCurrency) {
      throw new SyntheticLedgerError(
        "CURRENCY_MIX",
        `Cannot mix ${currency} and ${entryCurrency} without explicit per-ledger currency segregation (${path})`,
      );
    }

    const entry: TrueProfitLedgerEntry = {
      entryId: raw.entryId,
      synthetic: true,
      currency: entryCurrency,
      productId: raw.productId,
      orderId: raw.orderId,
      costCentreIds: raw.costCentreIds,
      notes: raw.notes,
      ...lines,
    };
    normalised.push(entry);

    totals.revenue = moneyRound(totals.revenue + lines.revenue);
    totals.productCost = moneyRound(totals.productCost + lines.productCost);
    totals.shipping = moneyRound(totals.shipping + lines.shipping);
    totals.fees = moneyRound(totals.fees + lines.fees);
    totals.ads = moneyRound(totals.ads + lines.ads);
    totals.refunds = moneyRound(totals.refunds + lines.refunds);
    totals.returns = moneyRound(totals.returns + lines.returns);
    totals.opex = moneyRound(totals.opex + lines.opex);
  }

  totals.realisedNetProfit = realisedNetProfitFromLines(totals);

  return {
    ledgerId: options?.ledgerId ?? "synth-ledger-amazon-us",
    marketplace: SYNTHETIC_MARKETPLACE,
    synthetic: true,
    currency: currency ?? "USD",
    entries: normalised,
    totals,
  };
}

/** Runtime guard: public ledger APIs must not emit live profit fields. */
export function assertLedgerHasNoLiveFields(ledger: TrueProfitLedger): void {
  assertNoForbiddenLiveFields(ledger, "ledger");
  assertNoForbiddenLiveFields(ledger.totals, "ledger.totals");
  for (let i = 0; i < ledger.entries.length; i += 1) {
    assertNoForbiddenLiveFields(ledger.entries[i], `ledger.entries[${i}]`);
  }
  if ("liveSales" in ledger || "realisedLiveProfit" in ledger) {
    throw new SyntheticLedgerError("FORBIDDEN_LIVE_FIELD", "ledger must not expose live sales fields");
  }
}
