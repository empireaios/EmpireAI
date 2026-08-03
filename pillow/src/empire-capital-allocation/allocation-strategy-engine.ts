import type { CapitalAllocationRecord } from "./types.js";
export class AllocationStrategyEngine {
  rank(records: CapitalAllocationRecord[]) { return [...records].sort((a, b) => b.allocationPriority - a.allocationPriority); }
}
