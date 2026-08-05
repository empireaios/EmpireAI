/** Redacted append-only log for Financial Reporting Worker (Q9-09). */

const SENSITIVE =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

type LogEntry = { event: string; details: string; at: string };

const logs: LogEntry[] = [];

function redact(value: string): string {
  return SENSITIVE.test(value) ? "[redacted — sensitive operational credential omitted]" : value;
}

export function appendFrwLog(input: { event: string; details?: string }) {
  logs.push({
    event: input.event,
    details: redact(input.details ?? ""),
    at: new Date().toISOString(),
  });
}

export function getFrwLogs(): LogEntry[] {
  return logs.map((l) => ({ ...l }));
}

export function resetFrwLogsForTesting() {
  logs.length = 0;
}
