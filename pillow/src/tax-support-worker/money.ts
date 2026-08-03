/**
 * Integer-minor-unit money model for the Tax Support Worker (Q9-07).
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

function assertSameCurrency(a: MoneyMinor, b: MoneyMinor): void {
  if (a.currency !== b.currency) {
    throw new Error(
      `Tax Support Worker cannot combine mismatched currencies without conversion: ${a.currency} vs ${b.currency}`,
    );
  }
}

export function moneyZero(currency: string): MoneyMinor {
  return { currency, minorUnits: 0 };
}

export function moneyFromMinor(minorUnits: number, currency: string): MoneyMinor {
  assertSafeInteger(minorUnits, "Money minorUnits");
  return { currency, minorUnits };
}

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

export function moneyAdd(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  assertSameCurrency(a, b);
  return { currency: a.currency, minorUnits: a.minorUnits + b.minorUnits };
}

export function moneySub(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  assertSameCurrency(a, b);
  return { currency: a.currency, minorUnits: a.minorUnits - b.minorUnits };
}

export function moneySum(items: readonly MoneyMinor[], currency: string): MoneyMinor {
  return items.reduce((acc, item) => moneyAdd(acc, item), moneyZero(currency));
}

export function moneyToDecimalString(a: MoneyMinor): string {
  const negative = a.minorUnits < 0;
  const abs = Math.abs(a.minorUnits);
  const whole = Math.trunc(abs / MINOR_UNITS_PER_MAJOR);
  const fraction = abs % MINOR_UNITS_PER_MAJOR;
  return `${negative ? "-" : ""}${whole}.${String(fraction).padStart(2, "0")}`;
}
