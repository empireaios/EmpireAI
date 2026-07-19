/** R3-12 — Exchange rate manager. */

import type { MultiCurrencyEngineConfiguration } from "./configuration.js";
import type { ExchangeRateProvider } from "./exchange-rate-provider.js";
import type { ExchangeRateRegistry } from "./currency-registry.js";
import type { ExchangeRateRecord } from "./types.js";

export class ExchangeRateManager {
  private lastRefreshAt: string | null = null;

  constructor(
    private readonly provider: ExchangeRateProvider,
    private readonly registry: ExchangeRateRegistry,
  ) {}

  getRate(
    sourceCurrency: string,
    targetCurrency: string,
    config: MultiCurrencyEngineConfiguration,
  ): { record: ExchangeRateRecord | null; error: string | null } {
    if (sourceCurrency === targetCurrency) {
      return {
        record: this.provider.buildRateRecord(sourceCurrency, targetCurrency, 1, "identity"),
        error: null,
      };
    }

    const cached = this.registry.get(sourceCurrency, targetCurrency);
    if (cached) return { record: cached, error: null };

    const resolved = this.provider.resolveRate(sourceCurrency, targetCurrency, config);
    if (resolved.error) return { record: null, error: resolved.error };

    const record = this.provider.buildRateRecord(
      sourceCurrency,
      targetCurrency,
      resolved.rate,
      resolved.provider,
    );
    this.registry.store(record);
    return { record, error: null };
  }

  refreshRates(
    config: MultiCurrencyEngineConfiguration,
    force = false,
  ): { records: ExchangeRateRecord[]; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    if (
      !force &&
      this.lastRefreshAt &&
      Date.now() - Date.parse(this.lastRefreshAt) < config.exchangeRateRefreshFrequencyMs
    ) {
      warnings.push("Exchange rate refresh skipped — within refresh frequency window");
      return { records: this.registry.list(), warnings, errors: [] };
    }

    const result = this.provider.refreshAllPairs(config);
    for (const record of result.records) {
      this.registry.store(record);
    }
    this.lastRefreshAt = new Date().toISOString();
    return { records: result.records, warnings, errors: result.errors };
  }

  getHistory(): ExchangeRateRecord[] {
    return this.registry.listHistory();
  }

  resetForTesting(): void {
    this.lastRefreshAt = null;
  }
}
