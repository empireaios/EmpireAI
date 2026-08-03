/** X4-05 — Exchange Rate Engine (structural baselines; no live FX APIs). */

import type { CurrencyIntelligenceConfiguration } from "./configuration.js";
import {
  buildCurrencyIntelligenceRecord,
  computeStructuralCurrencySignals,
  convertStructuralAmount,
  normalizeCurrency,
  structuralRateToUsd,
} from "./structural-signals.js";
import type { CurrencyAnalysisInput, CurrencyIntelligenceRecord } from "./types.js";

export class ExchangeRateEngine {
  refresh(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurrencyIntelligenceRecord {
    const signals = computeStructuralCurrencySignals(
      { ...input, exchangeDataValidated: true, validated: true },
      config,
    );
    return buildCurrencyIntelligenceRecord({
      ...signals,
      exchangeRateSource: "cached_structural",
      recommendationSummary: `Refreshed structural exchange baseline for ${signals.currencyCode} @ ${signals.exchangeRateToUsd} vs USD`,
    });
  }

  monitorFluctuations(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurrencyIntelligenceRecord {
    const signals = computeStructuralCurrencySignals(input, config);
    const alert = signals.fluctuationPercent >= config.fluctuationAlertThresholdPercent;
    return buildCurrencyIntelligenceRecord(
      {
        ...signals,
        recommendationSummary: alert
          ? `Fluctuation alert ${signals.currencyCode}: ${signals.fluctuationPercent}% ≥ threshold ${config.fluctuationAlertThresholdPercent}%`
          : `Fluctuation stable for ${signals.currencyCode}: ${signals.fluctuationPercent}%`,
      },
      alert ? "partial" : "passed",
    );
  }

  /**
   * Convert only when exchange data is validated — safety invariant for X4-05.
   */
  convert(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): { record: CurrencyIntelligenceRecord; convertedAmount: number | null; blocked: boolean; reason?: string } {
    const from = normalizeCurrency(input.currencyCode);
    const to = normalizeCurrency(input.targetCurrencyCode, from);
    const validated = input.exchangeDataValidated === true || input.validated === true;

    if (!validated) {
      const signals = computeStructuralCurrencySignals(input, config);
      return {
        record: buildCurrencyIntelligenceRecord(
          {
            ...signals,
            exchangeRateSource: "unavailable",
            recommendationSummary:
              "Conversion blocked — never perform financial conversions using unvalidated exchange data",
          },
          "failed",
        ),
        convertedAmount: null,
        blocked: true,
        reason: "Never perform financial conversions using unvalidated exchange data",
      };
    }

    const fromRate = structuralRateToUsd(from, input.rateHint);
    const toRate = structuralRateToUsd(to);
    const amount = typeof input.amount === "number" ? input.amount : 100;
    const convertedAmount = convertStructuralAmount(amount, from, to, fromRate, toRate);
    const signals = computeStructuralCurrencySignals(
      { ...input, currencyCode: to, exchangeDataValidated: true, validated: true },
      config,
    );

    return {
      record: buildCurrencyIntelligenceRecord({
        ...signals,
        recommendationSummary: `Converted structural amount ${from}→${to} using validated exchange baseline`,
      }),
      convertedAmount,
      blocked: false,
    };
  }
}
