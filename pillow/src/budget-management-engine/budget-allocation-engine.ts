/** R3-14 — Budget allocation engine. */

import type { BudgetManagementEngineConfiguration } from "./configuration.js";
import type { BudgetRecord } from "./types.js";

export class BudgetAllocationEngine {
  allocate(
    existing: BudgetRecord | null,
    additionalAllocation: number,
    config: BudgetManagementEngineConfiguration,
  ): { allocation: number; warnings: string[]; error: string | null } {
    const warnings: string[] = [];

    if (!config.budgetAllocationRulesEnabled) {
      warnings.push("Budget allocation rules disabled");
    }
    if (additionalAllocation <= 0) {
      return { allocation: 0, warnings, error: "Additional allocation must be positive" };
    }

    const current = existing?.budgetAllocation ?? 0;
    const allocation = Math.round((current + additionalAllocation) * 100) / 100;
    return { allocation, warnings, error: null };
  }
}
