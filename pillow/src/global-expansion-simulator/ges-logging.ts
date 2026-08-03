/** Deliberately redacted simulation logging. */
export function createGesLog(event: string) { return { event, timestamp: new Date().toISOString(), structuralSignalOnly: true as const, sensitiveValuesLogged: false as const }; }
