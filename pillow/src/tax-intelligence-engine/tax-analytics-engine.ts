/** R3-11 — Tax analytics engine (summaries and obligations). */

import { TX_METADATA_VERSION } from "./paths.js";
import type { TaxRegistry } from "./tax-registry.js";
import type { TaxSummary, TaxRecord } from "./types.js";

export class TaxAnalyticsEngine {
  generateSummary(
    registry: TaxRegistry,
    jurisdictionFilter?: string,
  ): TaxSummary {
    let records = registry.list();
    if (jurisdictionFilter) {
      records = records.filter((r) => r.taxJurisdiction === jurisdictionFilter);
    }

    const byJurisdiction: TaxSummary["byJurisdiction"] = {};
    const byCategory: TaxSummary["byCategory"] = {};

    let totalTaxLiability = 0;
    let totalTaxPaid = 0;
    let totalTaxObligation = 0;

    for (const record of records) {
      const amount = record.taxAmount;
      if (record.taxStatus === "calculated" || record.taxStatus === "adjusted" || record.taxStatus === "obligation") {
        totalTaxLiability += amount;
      }
      if (record.taxStatus === "paid") {
        totalTaxPaid += Math.abs(amount);
      }
      if (record.taxStatus === "obligation" || record.taxStatus === "calculated") {
        totalTaxObligation += amount;
      }

      if (!byJurisdiction[record.taxJurisdiction]) {
        byJurisdiction[record.taxJurisdiction] = { liability: 0, paid: 0, obligation: 0, count: 0 };
      }
      const j = byJurisdiction[record.taxJurisdiction]!;
      j.count += 1;
      if (record.taxStatus === "paid") j.paid += Math.abs(amount);
      else if (record.taxStatus === "obligation" || record.taxStatus === "calculated") {
        j.liability += amount;
        j.obligation += amount;
      } else if (record.taxStatus === "adjusted") {
        j.liability += amount;
      }

      if (!byCategory[record.taxCategory]) {
        byCategory[record.taxCategory] = { amount: 0, count: 0 };
      }
      byCategory[record.taxCategory]!.amount += amount;
      byCategory[record.taxCategory]!.count += 1;
    }

    return {
      summaryId: `tx-sum-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      totalTaxLiability: Math.round(totalTaxLiability * 100) / 100,
      totalTaxPaid: Math.round(totalTaxPaid * 100) / 100,
      totalTaxObligation: Math.round(totalTaxObligation * 100) / 100,
      byJurisdiction,
      byCategory,
      recordCount: records.length,
      metadataVersion: TX_METADATA_VERSION,
    };
  }

  markObligations(registry: TaxRegistry): TaxRecord[] {
    const updated: TaxRecord[] = [];
    for (const record of registry.list()) {
      if (record.taxStatus === "calculated") {
        const obligation: TaxRecord = {
          ...record,
          taxStatus: "obligation",
          timestamp: new Date().toISOString(),
        };
        registry.update(obligation);
        updated.push(obligation);
      }
    }
    return updated;
  }
}
