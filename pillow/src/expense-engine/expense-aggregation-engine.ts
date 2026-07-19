/** R3-05 — Expense aggregation engine. */

import { appendExLog } from "./ex-logging.js";
import type { ExpenseEngineConfiguration } from "./configuration.js";
import type { ExpenseMetadataGenerator } from "./expense-metadata-generator.js";
import type { ExpenseRegistry } from "./expense-registry.js";
import type { AggregateExpensesInput, ExpenseAggregationSummary } from "./types.js";

export class ExpenseAggregationEngine {
  constructor(
    private readonly registry: ExpenseRegistry,
    private readonly metadataGenerator: ExpenseMetadataGenerator,
  ) {}

  aggregate(
    input: AggregateExpensesInput,
    config: ExpenseEngineConfiguration,
  ): ExpenseAggregationSummary {
    if (!config.aggregationRulesEnabled) {
      throw new Error("Expense aggregation rules disabled");
    }

    const currency = input.currency ?? config.defaultCurrency;
    let records = this.registry.listValidated();

    if (input.expenseCategory) {
      records = records.filter((r) => r.expenseCategory === input.expenseCategory);
    }

    const summary = this.metadataGenerator.buildAggregationSummary({ records, currency });

    appendExLog({
      event: "expense_aggregation",
      level: "info",
      details: `Aggregated ${summary.totalRecords} expense(s) · total ${summary.totalExpenses}`,
    });

    return summary;
  }
}
