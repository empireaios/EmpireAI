/** R2-07 — Price Change Detector. */

import type { PriceChangeFinding, SupplierPricingRecord } from "./types.js";
import type { SupplierPricingEngineConfiguration } from "./configuration.js";

export class PriceChangeDetector {
  detectChanges(input: {
    previousPricing: SupplierPricingRecord[];
    currentPricing: SupplierPricingRecord[];
    config: SupplierPricingEngineConfiguration;
  }): PriceChangeFinding[] {
    const findings: PriceChangeFinding[] = [];
    const prevMap = new Map(
      input.previousPricing.map((p) => [`${p.supplierId}:${p.supplierProductId}`, p]),
    );

    for (const current of input.currentPricing) {
      const key = `${current.supplierId}:${current.supplierProductId}`;
      const previous = prevMap.get(key);
      const prevPrice = previous?.currentSupplierPrice ?? null;
      const currPrice = current.currentSupplierPrice;

      if (prevPrice === null) {
        findings.push({
          changeId: `spe-change-${key}-initial`,
          changeType: "initial",
          supplierId: current.supplierId,
          supplierProductId: current.supplierProductId,
          pricingRecordId: current.pricingRecordId,
          previousPrice: null,
          currentPrice: currPrice,
          priceChangeAmount: 0,
          priceChangePercentage: null,
          details: "Initial supplier price recorded",
        });
        continue;
      }

      if (currPrice === prevPrice) continue;

      const amount = currPrice - prevPrice;
      const pct = prevPrice > 0 ? (amount / prevPrice) * 100 : null;
      const isAnomaly =
        pct !== null &&
        Math.abs(pct) >= input.config.priceAnomalyThresholdPercent;

      let changeType: PriceChangeFinding["changeType"];
      if (isAnomaly) {
        changeType = "anomaly";
      } else if (amount > 0) {
        changeType = "increase";
      } else {
        changeType = "decrease";
      }

      findings.push({
        changeId: `spe-change-${key}-${Date.now()}`,
        changeType,
        supplierId: current.supplierId,
        supplierProductId: current.supplierProductId,
        pricingRecordId: current.pricingRecordId,
        previousPrice: prevPrice,
        currentPrice: currPrice,
        priceChangeAmount: amount,
        priceChangePercentage: pct,
        details:
          changeType === "anomaly"
            ? `Abnormal price movement: ${pct?.toFixed(1)}% change`
            : `${changeType === "increase" ? "Price increase" : "Price decrease"}: ${amount.toFixed(2)}`,
      });
    }

    return findings;
  }
}
