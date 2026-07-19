/** R2-07 — Currency Handler. */

import type { SupportedCurrency } from "./types.js";
import { SUPPORTED_CURRENCIES } from "./paths.js";

const FX_RATES_TO_USD: Record<SupportedCurrency, number> = {
  USD: 1,
  CNY: 0.14,
  EUR: 1.08,
  GBP: 1.27,
};

export class CurrencyHandler {
  normalizeCurrency(currency?: string): SupportedCurrency {
    const upper = (currency ?? "USD").toUpperCase();
    if ((SUPPORTED_CURRENCIES as readonly string[]).includes(upper)) {
      return upper as SupportedCurrency;
    }
    return "USD";
  }

  normalizePrice(price: number, currency: SupportedCurrency): number {
    const rate = FX_RATES_TO_USD[currency] ?? 1;
    return Math.round(price * rate * 100) / 100;
  }

  convertToUsd(price: number, currency: SupportedCurrency): number {
    return this.normalizePrice(price, currency);
  }

  convert(input: { amount: number; from: SupportedCurrency; to: SupportedCurrency }): number {
    const usd = input.amount * (FX_RATES_TO_USD[input.from] ?? 1);
    const toRate = FX_RATES_TO_USD[input.to] ?? 1;
    if (toRate === 0) return usd;
    return Math.round((usd / toRate) * 100) / 100;
  }
}
