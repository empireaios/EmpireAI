import type { EmpireCapitalAllocationInput } from "./types.js";
export class RoiAnalysisEngine {
  estimate(input: EmpireCapitalAllocationInput) { return Math.max(0, Math.min(100, input.expectedRoi ?? 0)); }
}
