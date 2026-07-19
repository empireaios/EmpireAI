/** R3-07 — Liquidity monitoring engine. */

import type { CashFlowMonitorConfiguration } from "./configuration.js";
import type { LiquidityStatus } from "./types.js";

export class LiquidityMonitoringEngine {
  assess(closingBalance: number, config: CashFlowMonitorConfiguration): LiquidityStatus {
    if (closingBalance >= config.liquidityThresholdHealthy) return "healthy";
    if (closingBalance >= config.liquidityThresholdAdequate) return "adequate";
    if (closingBalance >= config.liquidityThresholdLow) return "low";
    return "critical";
  }
}
