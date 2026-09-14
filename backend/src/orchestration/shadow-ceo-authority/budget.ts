import {
  DEFAULT_BUDGET_CAPS,
  type BudgetEnvelope,
} from "./types.js";

/** Deterministic budget envelope — caps never come from LLM output. */
export function defaultBudgetEnvelope(): BudgetEnvelope {
  return {
    totalCapSgd: DEFAULT_BUDGET_CAPS.totalCapSgd,
    monthlyOopCapSgd: DEFAULT_BUDGET_CAPS.monthlyOopCapSgd,
    spentTotalSgd: 0,
    spentMonthlyOopSgd: 0,
    currency: "SGD",
    source: "deterministic_state",
  };
}

export function assertBudgetFromDeterministicState(
  budget: BudgetEnvelope,
): void {
  if (budget.source !== "deterministic_state") {
    throw new Error("BUDGET_MUST_BE_DETERMINISTIC_STATE");
  }
  if (budget.currency !== "SGD") {
    throw new Error("BUDGET_CURRENCY_MUST_BE_SGD");
  }
  if (
    budget.totalCapSgd !== DEFAULT_BUDGET_CAPS.totalCapSgd ||
    budget.monthlyOopCapSgd !== DEFAULT_BUDGET_CAPS.monthlyOopCapSgd
  ) {
    throw new Error("BUDGET_CAPS_MUST_MATCH_DETERMINISTIC_DEFAULTS");
  }
}

export function wouldExceedBudget(
  budget: BudgetEnvelope,
  proposedSpendSgd: number,
): boolean {
  assertBudgetFromDeterministicState(budget);
  if (proposedSpendSgd < 0) return true;
  if (budget.spentTotalSgd + proposedSpendSgd > budget.totalCapSgd) return true;
  if (budget.spentMonthlyOopSgd + proposedSpendSgd > budget.monthlyOopCapSgd) {
    return true;
  }
  return false;
}
