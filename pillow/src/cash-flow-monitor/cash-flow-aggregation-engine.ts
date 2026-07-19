/** R3-07 — Cash flow aggregation engine. */

import { appendCfLog } from "./cf-logging.js";
import type { CashFlowMonitorConfiguration } from "./configuration.js";
import type { CashFlowMetadataGenerator } from "./cash-flow-metadata-generator.js";
import type { CashFlowRegistry } from "./cash-flow-registry.js";
import type { LiquidityMonitoringEngine } from "./liquidity-monitoring-engine.js";
import type { AggregateCashFlowInput, CashFlowAggregationSummary } from "./types.js";

export class CashFlowAggregationEngine {
  constructor(
    private readonly registry: CashFlowRegistry,
    private readonly metadataGenerator: CashFlowMetadataGenerator,
    private readonly liquidityEngine: LiquidityMonitoringEngine,
  ) {}

  aggregate(
    input: AggregateCashFlowInput,
    config: CashFlowMonitorConfiguration,
  ): CashFlowAggregationSummary {
    const records = this.registry.listValidated();
    const closingBalance = records.length > 0 ? records[records.length - 1]!.closingBalance : 0;
    const liquidityStatus = this.liquidityEngine.assess(closingBalance, config);

    const summary = this.metadataGenerator.buildAggregationSummary({
      records,
      liquidityStatus,
    });

    appendCfLog({
      event: "cash_flow_aggregation",
      level: "info",
      details: `Aggregated ${summary.totalRecords} record(s) · net ${summary.netCashFlow}`,
    });

    return summary;
  }
}
