import { EOE_STRUCTURAL_SAFETY_SIGNALS } from "./structural-signals.js";
export function createOptimizationLogEvent(event: string) {
  return { timestamp: new Date().toISOString(), event, ...EOE_STRUCTURAL_SAFETY_SIGNALS };
}
