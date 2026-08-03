import type { EmpireOptimizationInput } from "./types.js";
export class OpportunityDetectionEngine {
  detect(input: EmpireOptimizationInput) { return Math.max(0, Math.min(100, input.expectedImprovement ?? 20)); }
}
