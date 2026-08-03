import type { HealthStatus } from "./types.js";
export class HealthMonitor { assess(enabled: boolean): HealthStatus { return enabled ? "healthy" : "failed"; } }
