export class HealthMonitor { report(recordCount: number) { return { status: recordCount >= 0 ? "healthy" as const : "failed" as const, recordCount }; } }
