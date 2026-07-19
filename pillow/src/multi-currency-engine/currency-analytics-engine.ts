/** R3-12 — Currency analytics engine. */

import { MC_METADATA_VERSION } from "./paths.js";
import type { CurrencyRegistry } from "./currency-registry.js";
import type { CurrencySummary } from "./types.js";

export class CurrencyAnalyticsEngine {
  generateSummary(
    registry: CurrencyRegistry,
    reportingCurrency: string,
  ): CurrencySummary {
    const records = registry.list().filter((r) => r.conversionStatus === "completed");
    const gainLoss = registry.listGainLoss();

    const byCurrencyPair: CurrencySummary["byCurrencyPair"] = {};
    let totalConvertedAmount = 0;

    for (const record of records) {
      const pair = `${record.sourceCurrency}/${record.targetCurrency}`;
      if (!byCurrencyPair[pair]) {
        byCurrencyPair[pair] = { count: 0, totalConverted: 0 };
      }
      byCurrencyPair[pair]!.count += 1;
      byCurrencyPair[pair]!.totalConverted += record.convertedAmount;
      totalConvertedAmount += record.convertedAmount;
    }

    const totalGainLoss = gainLoss
      .filter((g) => g.reportingCurrency === reportingCurrency)
      .reduce((s, g) => s + g.gainLossAmount, 0);

    return {
      summaryId: `mc-sum-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      reportingCurrency,
      totalConversions: records.length,
      totalConvertedAmount: Math.round(totalConvertedAmount * 100) / 100,
      totalGainLoss: Math.round(totalGainLoss * 100) / 100,
      byCurrencyPair,
      metadataVersion: MC_METADATA_VERSION,
    };
  }
}
