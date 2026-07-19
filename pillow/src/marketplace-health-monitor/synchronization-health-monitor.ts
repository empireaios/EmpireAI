/** R1-14 — Synchronization health monitor. */

import type { MarketplaceProductNormalizationEngine } from "../marketplace-product-normalization/engine.js";
import type { MarketplaceOrderNormalizationEngine } from "../marketplace-order-normalization/engine.js";
import type { MarketplaceHealthFixture } from "./marketplace-health-fixtures.js";

export class SynchronizationHealthMonitor {
  assessProductSync(
    fixture: MarketplaceHealthFixture,
    productNormalization: MarketplaceProductNormalizationEngine | null,
  ): string {
    if (!productNormalization) return fixture.productSynchronizationStatus;
    try {
      const state = productNormalization.getState();
      if (state.catalog.length === 0) return "idle";
      if (state.health.status === "failed") return "failed";
      if (state.health.status === "degraded") return "degraded";
      return state.catalog.length > 0 ? "synced" : fixture.productSynchronizationStatus;
    } catch {
      return fixture.productSynchronizationStatus;
    }
  }

  assessOrderSync(
    fixture: MarketplaceHealthFixture,
    orderNormalization: MarketplaceOrderNormalizationEngine | null,
  ): string {
    if (!orderNormalization) return fixture.orderSynchronizationStatus;
    try {
      const state = orderNormalization.getState();
      if (state.catalog.length === 0) return "idle";
      if (state.health.status === "failed") return "failed";
      if (state.health.status === "degraded") return "degraded";
      return state.catalog.length > 0 ? "synced" : fixture.orderSynchronizationStatus;
    } catch {
      return fixture.orderSynchronizationStatus;
    }
  }
}
