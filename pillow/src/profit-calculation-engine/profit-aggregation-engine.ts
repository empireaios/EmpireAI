/** R3-06 — Profit aggregation engine. */

import { appendPcLog } from "./pc-logging.js";
import type { ProfitCalculationEngineConfiguration } from "./configuration.js";
import type { ProfitMetadataGenerator } from "./profit-metadata-generator.js";
import type { ProfitRegistry } from "./profit-registry.js";
import type { AggregateProfitInput, ProfitAggregationSummary } from "./types.js";

export class ProfitAggregationEngine {
  constructor(
    private readonly registry: ProfitRegistry,
    private readonly metadataGenerator: ProfitMetadataGenerator,
  ) {}

  aggregate(
    input: AggregateProfitInput,
    config: ProfitCalculationEngineConfiguration,
  ): ProfitAggregationSummary {
    if (!config.aggregationRulesEnabled) {
      throw new Error("Profit aggregation rules disabled");
    }

    const records = this.registry.listValidated();
    const scope = input.scope ?? "global";

    const summary = this.metadataGenerator.buildAggregationSummary({
      scope,
      scopeReference: null,
      records,
    });

    appendPcLog({
      event: "profit_aggregation",
      level: "info",
      details: `Aggregated ${summary.totalRecords} profit record(s) · net ${summary.netProfit}`,
    });

    return summary;
  }
}
