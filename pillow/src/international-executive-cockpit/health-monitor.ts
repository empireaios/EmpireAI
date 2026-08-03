export class HealthMonitor { assess(enabled: boolean) { return { status: enabled ? "healthy" as const : "degraded" as const }; } }
