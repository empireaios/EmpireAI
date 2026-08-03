export class HealthMonitor { health(enabled: boolean) { return enabled ? "healthy" as const : "failed" as const; } }
