export class GlobalExpansionSimulatorHealthMonitor { assess(enabled: boolean) { return { status: enabled ? "healthy" as const : "failed" as const, structuralSignalOnly: true as const }; } }
