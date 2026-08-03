import type { HealthStatus } from "./types.js";
export class HealthMonitor { status(connected: boolean): HealthStatus { return connected ? "healthy" : "degraded"; } }
