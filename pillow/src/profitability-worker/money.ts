/**
 * Integer-minor-unit money model for the Profitability Worker (Q9-05).
 *
 * This is a local copy of the cashflow-worker/budget-planning-worker money
 * model, intentionally duplicated rather than imported across worker module
 * boundaries so the Profitability Worker stays fully isolated. All
 * profitability arithmetic (revenue, cost, fee, refund, tax, and
 * gross/operating/net profit) operates exclusively on integer minor units
 * (e.g. cents for SGD/USD) via the helpers below. `Math.round` is only ever
 * applied at the single decimal→minor-units parse boundary
 * (`moneyFromDecimal`) when converting a verified decimal amount into minor
 * units. No profit total, margin percentage, tax provision, or shared-cost
 * allocation is ever computed with floating-point multiplication/division —
 * `moneyToDecimalNumber`/`moneyToDecimalString` exist purely for report
 * display and are never fed back into money math. Margins are derived
 * exclusively from integer basis points (`moneyRatioBasisPoints` /
 * `basisPointsToPercent`).
 */

/** Minor units per one major currency unit for every supported currency (2 decimal places). */
const MINOR_UNITS_PER_MAJOR = 100;

export type MoneyMinor = {
  readonly currency: string;
  /** Integer number of minor units (e.g. cents). Always a safe integer. */
  readonly minorUnits: number;
};

function assertSafeInteger(value: number, context: string): void {
  if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
    throw new Error(`${context} must be a safe integer, received ${value}`);
  }
}

function assertSameCurrency(a: MoneyMinor, b: MoneyMinor): void {
  if (a.currency !== b.currency) {
    throw new Error(
      `Profitability Worker cannot combine mismatched currencies without conversion: ${a.currency} vs ${b.currency}`,
    );
  }
}

/** Zero-value Money in the given currency. */
export function moneyZero(currency: string): MoneyMinor {
  return { currency, minorUnits: 0 };
}

/** Construct Money directly from an already-integer minor-units value. */
export function moneyFromMinor(minorUnits: number, currency: string): MoneyMinor {
  assertSafeInteger(minorUnits, "Money minorUnits");
  return { currency, minorUnits };
}

/**
 * Parse a verified decimal amount (major units, e.g. 10.50) into integer
 * minor units (1050). This is the ONLY boundary where a rounding operation
 * on a decimal value is permitted. String inputs are parsed digit-by-digit
 * to avoid floating-point representation error entirely; number inputs use
 * a single `Math.round` at this boundary only.
 */
export function moneyFromDecimal(amount: number | string, currency: string): MoneyMinor {
  if (typeof amount === "string") {
    return { currency, minorUnits: parseDecimalStringToMinorUnits(amount) };
  }
  if (!Number.isFinite(amount)) {
    throw new Error(`Money decimal amount must be finite, received ${amount}`);
  }
  const minorUnits = Math.round(amount * MINOR_UNITS_PER_MAJOR);
  assertSafeInteger(minorUnits, "Money minorUnits");
  return { currency, minorUnits };
}

function parseDecimalStringToMinorUnits(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed.startsWith("+") ? trimmed.slice(1) : trimmed;
  if (!/^\d+(\.\d+)?$/.test(unsigned)) {
    throw new Error(`Invalid decimal money string: ${value}`);
  }
  const [wholePartRaw, fractionPartRaw = ""] = unsigned.split(".");
  const fractionPart = (fractionPartRaw + "00").slice(0, 2);
  const whole = Number.parseInt(wholePartRaw || "0", 10);
  const fraction = Number.parseInt(fractionPart || "0", 10);
  const minorUnits = whole * MINOR_UNITS_PER_MAJOR + fraction;
  return negative ? -minorUnits : minorUnits;
}

/** Integer addition of two Money values sharing the same currency. */
export function moneyAdd(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  assertSameCurrency(a, b);
  return { currency: a.currency, minorUnits: a.minorUnits + b.minorUnits };
}

/** Integer subtraction of two Money values sharing the same currency. */
export function moneySub(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  assertSameCurrency(a, b);
  return { currency: a.currency, minorUnits: a.minorUnits - b.minorUnits };
}

/** Integer negation. */
export function moneyNeg(a: MoneyMinor): MoneyMinor {
  return { currency: a.currency, minorUnits: -a.minorUnits };
}

export function moneyEquals(a: MoneyMinor, b: MoneyMinor): boolean {
  return a.currency === b.currency && a.minorUnits === b.minorUnits;
}

/** -1 if a<b, 0 if equal, 1 if a>b. Throws on mismatched currency. */
export function moneyCompare(a: MoneyMinor, b: MoneyMinor): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  if (a.minorUnits < b.minorUnits) return -1;
  if (a.minorUnits > b.minorUnits) return 1;
  return 0;
}

export function moneyIsZero(a: MoneyMinor): boolean {
  return a.minorUnits === 0;
}

export function moneyIsNegative(a: MoneyMinor): boolean {
  return a.minorUnits < 0;
}

/** Sum a list of same-currency Money values via repeated integer addition. */
export function moneySum(items: readonly MoneyMinor[], currency: string): MoneyMinor {
  return items.reduce((acc, item) => moneyAdd(acc, item), moneyZero(currency));
}

export function moneyMin(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  return moneyCompare(a, b) <= 0 ? a : b;
}

export function moneyMax(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  return moneyCompare(a, b) >= 0 ? a : b;
}

/** Display-only conversion to a decimal number. Never feed the result back into money math. */
export function moneyToDecimalNumber(a: MoneyMinor): number {
  return a.minorUnits / MINOR_UNITS_PER_MAJOR;
}

/** Display-only conversion to a fixed 2-decimal string, computed without floating-point division. */
export function moneyToDecimalString(a: MoneyMinor): string {
  const negative = a.minorUnits < 0;
  const abs = Math.abs(a.minorUnits);
  const whole = Math.trunc(abs / MINOR_UNITS_PER_MAJOR);
  const fraction = abs % MINOR_UNITS_PER_MAJOR;
  return `${negative ? "-" : ""}${whole}.${String(fraction).padStart(2, "0")}`;
}

/**
 * Basis-points ratio of `numerator` over `denominator` using pure integer
 * arithmetic (numerator*10000 is an exact integer product; the single
 * division is immediately floored). Returns null when the denominator is
 * zero rather than fabricating a ratio. The result (basis points, 1/100 of
 * a percent) is the sole integer-derived quantity from which display
 * percentages are computed (`basisPointsToPercent`) — never a floating
 * multiplication of two money amounts.
 */
export function moneyRatioBasisPoints(numeratorMinor: number, denominatorMinor: number): number | null {
  if (denominatorMinor === 0) return null;
  return Math.floor((numeratorMinor * 10000) / denominatorMinor);
}

/** Display-only conversion of integer basis points into a percentage number. */
export function basisPointsToPercent(basisPoints: number): number {
  return basisPoints / 100;
}

/**
 * Integer proportional allocation of `poolMinor` across a set of weighted
 * scopes (e.g. shared operational cost pool allocated by net-revenue
 * weight). Each share is `floor(pool * weight / totalWeight)`; the leftover
 * remainder (always < the number of scopes' worth of rounding error) is
 * assigned in full to the scope with the largest weight (ties broken by
 * ascending `scopeId` for determinism) — never split fractionally, never
 * invented. When `totalWeight` is zero or negative, no allocation is
 * computed (every share is zero) — the caller is responsible for recording
 * an outstanding issue rather than fabricating an equal-split fallback.
 */
export function allocateProportionally(
  poolMinor: number,
  currency: string,
  weights: ReadonlyArray<{ scopeId: string; weightMinor: number }>,
): Map<string, MoneyMinor> {
  const allocations = new Map<string, MoneyMinor>();
  const positiveWeights = weights.filter((w) => w.weightMinor > 0);
  const totalWeight = positiveWeights.reduce((sum, w) => sum + w.weightMinor, 0);

  for (const w of weights) {
    allocations.set(w.scopeId, moneyZero(currency));
  }
  if (poolMinor === 0 || totalWeight <= 0 || !positiveWeights.length) {
    return allocations;
  }

  let allocatedSoFar = 0;
  for (const w of positiveWeights) {
    const share = Math.floor((poolMinor * w.weightMinor) / totalWeight);
    allocations.set(w.scopeId, moneyFromMinor(share, currency));
    allocatedSoFar += share;
  }

  const remainder = poolMinor - allocatedSoFar;
  if (remainder !== 0) {
    const [largest] = [...positiveWeights].sort((a, b) => {
      if (b.weightMinor !== a.weightMinor) return b.weightMinor - a.weightMinor;
      return a.scopeId < b.scopeId ? -1 : a.scopeId > b.scopeId ? 1 : 0;
    });
    if (largest) {
      const current = allocations.get(largest.scopeId) ?? moneyZero(currency);
      allocations.set(largest.scopeId, moneyFromMinor(current.minorUnits + remainder, currency));
    }
  }
  return allocations;
}
