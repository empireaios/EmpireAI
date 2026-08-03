/** X2-19 — Value Growth Engine. */

import type { ValuationHistoryEntry, ValuationRecord } from "./types.js";
import { EVE_METADATA_VERSION } from "./paths.js";

export class ValueGrowthEngine {
  measure(input: {
    current: ValuationRecord;
    history: ValuationHistoryEntry[];
  }): ValuationRecord {
    const scoped = input.history.filter(
      (h) =>
        h.portfolioReference === input.current.portfolioReference &&
        h.companyReference === input.current.companyReference,
    );

    const previous = scoped.length > 0 ? scoped[scoped.length - 1] : null;
    const previousValue = previous
      ? previous.companyReference
        ? previous.companyValuation
        : previous.portfolioValuation || previous.enterpriseValuation
      : input.current.companyReference
        ? input.current.companyValuation
        : input.current.portfolioValuation;

    const currentValue = input.current.companyReference
      ? input.current.companyValuation
      : input.current.portfolioValuation || input.current.enterpriseValuation;

    const valueGrowthRate =
      previousValue > 0
        ? Math.round(((currentValue - previousValue) / previousValue) * 1000) / 10
        : 0;

    return {
      ...input.current,
      valueGrowthRate,
      timestamp: new Date().toISOString(),
      metadataVersion: EVE_METADATA_VERSION,
    };
  }
}
