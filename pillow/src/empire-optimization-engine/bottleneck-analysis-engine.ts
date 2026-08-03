import type { EmpireOptimizationInput } from "./types.js";
export class BottleneckAnalysisEngine {
  analyze(input: EmpireOptimizationInput) { return Math.max(0, Math.min(100, input.priorityScore ?? 70)); }
}
