/** R3-12 — Exchange rate provider (internal fixture rates). */

import { appendMcLog } from "./mc-logging.js";
import type { MultiCurrencyEngineConfiguration } from "./configuration.js";
import type { ExchangeRateRecord } from "./types.js";
import { MC_METADATA_VERSION } from "./paths.js";

/** Base rates vs USD for supported currencies. */
const BASE_USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.52,
};

export class ExchangeRateProvider {
  resolveRate(
    sourceCurrency: string,
    targetCurrency: string,
    config: MultiCurrencyEngineConfiguration,
  ): { rate: number; provider: string; error: string | null } {
    if (!config.exchangeRateProviderRulesEnabled) {
      return { rate: 1, provider: "disabled", error: null };
    }

    const sourceBase = BASE_USD_RATES[sourceCurrency];
    const targetBase = BASE_USD_RATES[targetCurrency];

    if (sourceBase === undefined || targetBase === undefined) {
      return {
        rate: 0,
        provider: "internal-fixture",
        error: `Exchange rate unavailable for ${sourceCurrency} → ${targetCurrency}`,
      };
    }

    const rate = Math.round((targetBase / sourceBase) * 1_000_000) / 1_000_000;
    return { rate, provider: "internal-fixture", error: null };
  }

  buildRateRecord(
    sourceCurrency: string,
    targetCurrency: string,
    rate: number,
    provider: string,
  ): ExchangeRateRecord {
    return {
      rateId: `mc-rate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      sourceCurrency,
      targetCurrency,
      rate,
      provider,
      metadataVersion: MC_METADATA_VERSION,
    };
  }

  refreshAllPairs(
    config: MultiCurrencyEngineConfiguration,
  ): { records: ExchangeRateRecord[]; errors: string[] } {
    const records: ExchangeRateRecord[] = [];
    const errors: string[] = [];
    const currencies = config.supportedCurrencies;

    for (const source of currencies) {
      for (const target of currencies) {
        if (source === target) continue;
        const resolved = this.resolveRate(source, target, config);
        if (resolved.error) {
          errors.push(resolved.error);
          continue;
        }
        records.push(
          this.buildRateRecord(source, target, resolved.rate, resolved.provider),
        );
      }
    }

    appendMcLog({
      event: "exchange_rate_update",
      level: "info",
      details: `Refreshed ${records.length} exchange rate pair(s)`,
    });

    return { records, errors };
  }
}
