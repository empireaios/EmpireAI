import { ECA_STRUCTURAL_SAFETY_SIGNALS } from "./structural-signals.js";
export function createCapitalAllocationLogEvent(event: string) {
  return { timestamp: new Date().toISOString(), event, ...ECA_STRUCTURAL_SAFETY_SIGNALS };
}
