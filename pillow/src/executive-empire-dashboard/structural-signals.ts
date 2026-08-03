/** Explicit boundary: dashboard intelligence carries no raw enterprise values. */
export function structuralSignal(summary: string) { return { summary, structuralSignalOnly: true as const, maskSensitiveValues: true as const }; }
