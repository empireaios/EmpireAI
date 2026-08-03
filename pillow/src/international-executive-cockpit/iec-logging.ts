/** Sanitized logger boundary: callers must supply structural events only. */
export const createIecLogEntry = (event: string) => ({ event, timestamp: new Date().toISOString(), structuralSignalOnly: true as const, sensitiveValuesMasked: true as const });
