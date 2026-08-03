/** X3-06 — Supplier Inventory Engine (inventory / lead-time signals). */

import type { SupplierScaleEngineConfiguration } from "./configuration.js";
import type { SupplierScaleInput, SupplierScalingRecord } from "./types.js";
import { buildSupplierScalingRecord, computeSupplierSignals } from "./structural-signals.js";

export class SupplierInventoryEngine {
  assess(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
    focus: "inventory" | "lead_time" = "inventory",
  ): SupplierScalingRecord {
    const signals = computeSupplierSignals(focus, input, config);
    const summary =
      focus === "lead_time"
        ? `Lead-time structural score · fulfilment readiness ${signals.fulfilmentReadiness} — ${signals.recommendationSummary}`
        : `Inventory structural score · fulfilment readiness ${signals.fulfilmentReadiness} — ${signals.recommendationSummary}`;
    return buildSupplierScalingRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
