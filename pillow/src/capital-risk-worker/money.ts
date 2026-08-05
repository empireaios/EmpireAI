/**
 * Integer-minor-unit money model for the Capital Risk Worker (Q9-10).
 * Local copy — not imported across worker boundaries.
 */

const MINOR_UNITS_PER_MAJOR = 100;

export type MoneyMinor = {
  readonly currency: string;
  readonly minorUnits: number;
};

function assertSafeInteger(value: number, context: string): void {
  if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
    throw new Error(`${context} must be a safe integer, received ${value}`);
  }
}

export function moneyZero(currency: string): MoneyMinor {
  return { currency, minorUnits: 0 };
}

export function moneyFromMinor(minorUnits: number, currency: string): MoneyMinor {
  assertSafeInteger(minorUnits, "Money minorUnits");
  return { currency, minorUnits };
}

export function moneyToDecimalString(a: MoneyMinor): string {
  const negative = a.minorUnits < 0;
  const abs = Math.abs(a.minorUnits);
  const whole = Math.trunc(abs / MINOR_UNITS_PER_MAJOR);
  const fraction = abs % MINOR_UNITS_PER_MAJOR;
  return `${negative ? "-" : ""}${whole}.${String(fraction).padStart(2, "0")}`;
}

export function computeBpsDelta(numerator: number, denominator: number): number {
  if (denominator === 0) return numerator > 0 ? 10000 : 0;
  return Math.round((numerator * 10000) / denominator);
}
