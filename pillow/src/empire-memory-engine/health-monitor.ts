import type { HealthStatus } from "./types.js";
export class EmpireMemoryHealthMonitor {
  assess(enabled: boolean): HealthStatus { return enabled ? "healthy" : "failed"; }
}
