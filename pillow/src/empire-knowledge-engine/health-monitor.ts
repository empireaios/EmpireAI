export class HealthMonitor {
  assess(enabled: boolean, connected: boolean) { return { status: !enabled ? "failed" as const : connected ? "healthy" as const : "degraded" as const, structuralSignalOnly: true as const }; }
}
