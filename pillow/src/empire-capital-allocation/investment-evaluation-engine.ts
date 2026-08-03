import type { EmpireCapitalAllocationInput } from "./types.js";
export class InvestmentEvaluationEngine {
  evaluate(input: EmpireCapitalAllocationInput) { return input.investmentOpportunity?.trim() || "enterprise capital opportunity"; }
}
