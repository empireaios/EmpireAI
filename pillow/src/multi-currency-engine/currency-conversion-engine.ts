/** R3-12 — Currency conversion engine. */

import { appendMcLog } from "./mc-logging.js";
import type { MultiCurrencyEngineConfiguration } from "./configuration.js";
import type { ExchangeRateManager } from "./exchange-rate-manager.js";
import type { CurrencyRegistry } from "./currency-registry.js";
import type { CurrencyMetadataGenerator } from "./currency-metadata-generator.js";
import type { CurrencyDataSource } from "./currency-data-source.js";
import type { CurrencyRecord } from "./types.js";

export class CurrencyConversionEngine {
  constructor(
    private readonly rateManager: ExchangeRateManager,
    private readonly registry: CurrencyRegistry,
    private readonly metadataGenerator: CurrencyMetadataGenerator,
    private readonly dataSource: CurrencyDataSource,
  ) {}

  validateCurrencyCode(code: string, config: MultiCurrencyEngineConfiguration): string | null {
    if (!config.supportedCurrencies.includes(code)) {
      return `Unsupported currency code: ${code}`;
    }
    if (!/^[A-Z]{3}$/.test(code)) {
      return `Invalid currency code format: ${code}`;
    }
    return null;
  }

  recordTransactionCurrency(
    input: {
      sourceCurrency: string;
      originalAmount: number;
      revenueReference?: string;
      expenseReference?: string;
    },
    config: MultiCurrencyEngineConfiguration,
    dedupeKey: string,
  ): { record: CurrencyRecord | null; error: string | null; warnings: string[] } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate transaction currency record", warnings: [] };
    }

    const codeError = this.validateCurrencyCode(input.sourceCurrency, config);
    if (codeError) return { record: null, error: codeError, warnings: [] };

    if (input.originalAmount <= 0) {
      return { record: null, error: "Original amount must be positive", warnings: [] };
    }

    const warnings: string[] = [];
    if (input.revenueReference) {
      const revenue = this.dataSource.getRevenue(input.revenueReference);
      if (!revenue) warnings.push(`Revenue reference not found: ${input.revenueReference}`);
      else if (revenue.currency !== input.sourceCurrency) {
        warnings.push("Recorded currency differs from revenue record currency");
      }
    }
    if (input.expenseReference) {
      const expense = this.dataSource.getExpense(input.expenseReference);
      if (!expense) warnings.push(`Expense reference not found: ${input.expenseReference}`);
    }

    const record = this.metadataGenerator.buildCurrencyRecord({
      sourceCurrency: input.sourceCurrency,
      targetCurrency: input.sourceCurrency,
      exchangeRate: 1,
      convertedAmount: input.originalAmount,
      originalAmount: input.originalAmount,
      exchangeRateSource: "transaction-record",
      conversionStatus: "completed",
      validationStatus: "passed",
    });

    this.registry.store(record, dedupeKey);
    appendMcLog({
      event: "transaction_currency",
      level: "info",
      details: `Recorded ${input.sourceCurrency} transaction ${record.currencyRecordId}`,
    });

    return { record, error: null, warnings };
  }

  convertCurrency(
    input: { sourceCurrency: string; targetCurrency: string; originalAmount: number },
    config: MultiCurrencyEngineConfiguration,
    dedupeKey: string,
  ): { record: CurrencyRecord | null; error: string | null; warnings: string[] } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate currency conversion request", warnings: [] };
    }

    if (!config.conversionRulesEnabled) {
      return { record: null, error: "Currency conversion rules disabled", warnings: [] };
    }

    const sourceError = this.validateCurrencyCode(input.sourceCurrency, config);
    if (sourceError) return { record: null, error: sourceError, warnings: [] };
    const targetError = this.validateCurrencyCode(input.targetCurrency, config);
    if (targetError) return { record: null, error: targetError, warnings: [] };

    if (input.originalAmount <= 0) {
      return { record: null, error: "Original amount must be positive", warnings: [] };
    }

    const rateResult = this.rateManager.getRate(
      input.sourceCurrency,
      input.targetCurrency,
      config,
    );
    if (rateResult.error || !rateResult.record) {
      return { record: null, error: rateResult.error ?? "Exchange rate unavailable", warnings: [] };
    }

    const convertedAmount =
      Math.round(input.originalAmount * rateResult.record.rate * 100) / 100;

    const record = this.metadataGenerator.buildCurrencyRecord({
      sourceCurrency: input.sourceCurrency,
      targetCurrency: input.targetCurrency,
      exchangeRate: rateResult.record.rate,
      convertedAmount,
      originalAmount: input.originalAmount,
      exchangeRateSource: rateResult.record.provider,
      conversionStatus: "completed",
      validationStatus: "passed",
    });

    this.registry.store(record, dedupeKey);
    appendMcLog({
      event: "currency_conversion",
      level: "info",
      details: `Converted ${input.originalAmount} ${input.sourceCurrency} → ${convertedAmount} ${input.targetCurrency}`,
    });

    return { record, error: null, warnings: [] };
  }
}
