import type { EmpireOptimizationInput } from "./types.js";
export class ResourceOptimizationEngine {
  identify(input: EmpireOptimizationInput) { return Math.max(0, Math.min(100, input.expectedImprovement ?? 15)); }
}
