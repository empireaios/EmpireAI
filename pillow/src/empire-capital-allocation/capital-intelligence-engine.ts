import type { EmpireCapitalAllocationInput } from "./types.js";
export class CapitalIntelligenceEngine {
  available(input: EmpireCapitalAllocationInput) { return Math.max(0, input.availableCapital ?? 0); }
  utilization(input: EmpireCapitalAllocationInput) { return Math.max(0, Math.min(100, input.allocationPriority ?? 50)); }
}
