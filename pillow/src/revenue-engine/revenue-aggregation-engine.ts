/** R3-04 — Revenue aggregation engine. */

import { appendReLog } from "./re-logging.js";
import type { RevenueEngineConfiguration } from "./configuration.js";
import type { RevenueMetadataGenerator } from "./revenue-metadata-generator.js";
import type { RevenueRegistry } from "./revenue-registry.js";
import type { AggregateRevenueInput, RevenueAggregationSummary } from "./types.js";

export class RevenueAggregationEngine {
  constructor(
    private readonly registry: RevenueRegistry,
    private readonly metadataGenerator: RevenueMetadataGenerator,
  ) {}

  aggregate(
    input: AggregateRevenueInput,
    config: RevenueEngineConfiguration,
  ): RevenueAggregationSummary {
    if (!config.aggregationRulesEnabled) {
      throw new Error("Revenue aggregation rules disabled");
    }

    const currency = input.currency ?? config.defaultCurrency;
    let records = this.registry.listValidated();

    if (input.businessReference) {
      records = records.filter((r) => r.businessReference === input.businessReference);
    }
    if (input.marketplaceReference) {
      records = records.filter((r) => r.marketplaceReference === input.marketplaceReference);
    }

    const summary = this.metadataGenerator.buildAggregationSummary({ records, currency });

    appendReLog({
      event: "revenue_aggregation",
      level: "info",
      details: `Aggregated ${summary.totalRecords} record(s) · gross ${summary.grossRevenue} · net ${summary.netRevenue}`,
    });

    return summary;
  }
}
