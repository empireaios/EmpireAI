/**
 * Integer-minor-unit money model for the Forecasting Worker (Q9-06).
 *
 * This is a local copy of the profitability-worker/cashflow-worker/
 * budget-planning-worker money model, intentionally duplicated rather than
 * imported across worker module boundaries so the Forecasting Worker stays
 * fully isolated. All forecasting arithmetic (revenue, cost, cashflow,
 * profit, cash-runway, and reinvestment sizing) operates exclusively on
 * integer minor units (e.g. cents for SGD/USD) via the helpers below.
 * `Math.round` is only ever applied at the single decimal->minor-units
 * parse boundary (`moneyFromDecimal`) when converting a verified decimal
 * amount into minor units. No forecast total, growth projection, cash-
 * runway estimate, or reinvestment amount is ever computed with floating-
 * point multiplication/division — `moneyToDecimalNumber`/`moneyToDecimalString`
 * exist purely for report display and are never fed back into money math.
 * Growth rates are represented exclusively as integer basis points
 * (`moneyRatioBasisPoints` / `basisPointsToPercent`).
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
      `Forecasting Worker cannot combine mismatched currencies without conversion: ${a.currency} vs ${b.currency}`,
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
 * zero rather than fabricating a ratio. Used for growth-rate derivation and
 * display percentage conversion — never a floating multiplication of two
 * money amounts.
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
 * Apply an integer basis-points growth (or decline) rate to a Money amount:
 * `amount + trunc(amount * bps / 10000)`. Truncation (rather than floor) is
 * used so growth compounds symmetrically for both positive and negative
 * rates — never a floating-point multiplication.
 */
export function applyGrowthBps(amountMinor: number, growthRateBps: number): number {
  return amountMinor + Math.trunc((amountMinor * growthRateBps) / 10000);
}

/**
 * Integer proportional split of `poolMinor` into a set of basis-point
 * tiers (e.g. reinvestment recommendation sizing). Each share is
 * `trunc(pool * tierBps / 10000)` — never a fractional or invented split.
 */
export function splitByBasisPoints(poolMinor: number, tierBps: readonly number[]): number[] {
  return tierBps.map((bps) => Math.trunc((poolMinor * bps) / 10000));
}
