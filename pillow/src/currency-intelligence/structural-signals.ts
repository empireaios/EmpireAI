/** X4-05 — Shared structural currency scoring helpers (no live FX APIs). */

import { CUR_METADATA_VERSION } from "./paths.js";
import type { CurrencyIntelligenceConfiguration } from "./configuration.js";
import type {
  CurrencyAnalysisInput,
  CurrencyIntelligenceRecord,
  ExchangeRateSource,
  RegionalPricingStatus,
} from "./types.js";

/** Deterministic structural baseline rates vs USD (not live market data). */
const STRUCTURAL_USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150,
  AUD: 1.52,
  CAD: 1.36,
  SGD: 1.34,
  CHF: 0.88,
  CNY: 7.2,
  INR: 83,
};

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: CurrencyAnalysisInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function normalizeCurrency(code?: string, fallback = "USD"): string {
  const raw = code?.trim().toUpperCase() || fallback;
  return raw.slice(0, 8);
}

export function isSupportedCurrency(
  code: string,
  config: CurrencyIntelligenceConfiguration,
): boolean {
  return config.supportedCurrencies.map((c) => c.toUpperCase()).includes(code);
}

export function structuralRateToUsd(
  currencyCode: string,
  rateHint?: number,
): number {
  if (typeof rateHint === "number" && Number.isFinite(rateHint) && rateHint > 0) {
    return rateHint;
  }
  if (STRUCTURAL_USD_RATES[currencyCode] !== undefined) {
    return STRUCTURAL_USD_RATES[currencyCode]!;
  }
  return 1 + hashScore(currencyCode, 1, 50) / 10;
}

export function computeStructuralCurrencySignals(
  input: CurrencyAnalysisInput,
  config: CurrencyIntelligenceConfiguration,
): {
  companyReference: string;
  currencyCode: string;
  exchangeRateSource: ExchangeRateSource;
  regionalPricingStatus: RegionalPricingStatus;
  exchangeRateTimestamp: string;
  exchangeRateToUsd: number;
  fluctuationPercent: number;
  preferenceConfidence: number;
  anomalyScore: number;
  recommendationSummary: string;
  exchangeDataValidated: boolean;
} {
  const companyReference = defaultCompany(input);
  const currencyCode = normalizeCurrency(input.currencyCode);
  const supported = isSupportedCurrency(currencyCode, config);
  const exchangeDataValidated = input.exchangeDataValidated === true || input.validated === true;
  const exchangeRateSource: ExchangeRateSource = exchangeDataValidated
    ? supported
      ? "structural_baseline"
      : "manual_validated"
    : "unavailable";
  const exchangeRateToUsd = structuralRateToUsd(currencyCode, input.rateHint);
  const seed = `${companyReference}::${currencyCode}`;
  const fluctuationPercent = Math.round(
    (input.fluctuationHint ?? hashScore(`${seed}:fluct`, 0, 15)) * 10,
  ) / 10;
  const preferenceConfidence = Math.round(
    input.preferenceHint ?? hashScore(`${seed}:pref`, 45, 98),
  );
  const anomalyScore = Math.round(
    input.anomalyHint ??
      (fluctuationPercent >= config.fluctuationAlertThresholdPercent
        ? hashScore(`${seed}:anom`, 55, 95)
        : hashScore(`${seed}:anom`, 0, 35)),
  );

  let regionalPricingStatus: RegionalPricingStatus = config.regionalPricingRulesEnabled
    ? supported
      ? "enabled"
      : "partial"
    : "disabled";
  if (anomalyScore >= 60) regionalPricingStatus = "anomaly";

  const recommendationSummary =
    exchangeRateSource === "unavailable"
      ? `Exchange data for ${currencyCode} unvalidated — conversions blocked until validated`
      : anomalyScore >= 60
        ? `Anomaly on ${currencyCode}: fluctuation=${fluctuationPercent}% anomaly=${anomalyScore}`
        : `Maintain ${currencyCode} regional pricing — rate source=${exchangeRateSource}, fluctuation=${fluctuationPercent}%`;

  return {
    companyReference,
    currencyCode,
    exchangeRateSource,
    regionalPricingStatus,
    exchangeRateTimestamp: new Date().toISOString(),
    exchangeRateToUsd,
    fluctuationPercent,
    preferenceConfidence: Math.max(0, Math.min(100, preferenceConfidence)),
    anomalyScore: Math.max(0, Math.min(100, anomalyScore)),
    recommendationSummary,
    exchangeDataValidated,
  };
}

export function buildCurrencyIntelligenceRecord(
  signals: ReturnType<typeof computeStructuralCurrencySignals>,
  validationStatus: CurrencyIntelligenceRecord["validationStatus"] = "passed",
): CurrencyIntelligenceRecord {
  return {
    currencyIntelligenceId: `cur-${Date.now()}-${signals.currencyCode}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    currencyCode: signals.currencyCode,
    exchangeRateSource: signals.exchangeRateSource,
    regionalPricingStatus: signals.regionalPricingStatus,
    exchangeRateTimestamp: signals.exchangeRateTimestamp,
    recommendationSummary: signals.recommendationSummary,
    validationStatus,
    metadataVersion: CUR_METADATA_VERSION,
    exchangeRateToUsd: signals.exchangeRateToUsd,
    fluctuationPercent: signals.fluctuationPercent,
    preferenceConfidence: signals.preferenceConfidence,
    anomalyScore: signals.anomalyScore,
    structuralSignalOnly: true,
    neverPerformFinancialConversionsUsingUnvalidatedExchangeData: true,
  };
}

export function convertStructuralAmount(
  amount: number,
  fromCode: string,
  toCode: string,
  fromRateToUsd: number,
  toRateToUsd: number,
): number {
  if (!Number.isFinite(amount) || amount < 0) return 0;
  if (fromCode === toCode) return amount;
  const usd = amount / fromRateToUsd;
  return Math.round(usd * toRateToUsd * 100) / 100;
}
