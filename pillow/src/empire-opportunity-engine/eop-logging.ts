/** Sanitized structural logger: callers must never pass sensitive values. */
export class EopLogger { entries: Array<{ timestamp: string; event: string }> = []; record(event: string) { this.entries.push({ timestamp: new Date().toISOString(), event }); } }
