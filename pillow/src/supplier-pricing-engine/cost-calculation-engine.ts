/** R2-07 — Cost Calculation Engine (landed cost). */

import type { SupplierPricingEngineConfiguration } from "./configuration.js";

export class CostCalculationEngine {
  calculateLandedCost(input: {
    supplierPrice: number;
    config: SupplierPricingEngineConfiguration;
    shippingPercent?: number;
  }): number {
    const pct = input.shippingPercent ?? input.config.landedCostShippingPercent;
    const shipping = input.supplierPrice * (pct / 100);
    return Math.round((input.supplierPrice + shipping) * 100) / 100;
  }
}
