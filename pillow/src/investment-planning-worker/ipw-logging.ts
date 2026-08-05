/** Redacted append-only log for Investment Planning Worker (Q9-08). */

const SENSITIVE =
  /(token|secret|password|api[_-]?key|authorization|bearer|credential|access[_-]?token)/i;

type LogEntry = { event: string; details: string; at: string };

const logs: LogEntry[] = [];

function redact(value: string): string {
  return SENSITIVE.test(value) ? "[redacted — sensitive operational credential omitted]" : value;
}

export function appendIpwLog(input: { event: string; details?: string }) {
  logs.push({
    event: input.event,
    details: redact(input.details ?? ""),
    at: new Date().toISOString(),
  });
}

export function getIpwLogs(): LogEntry[] {
  return logs.map((l) => ({ ...l }));
}

export function resetIpwLogsForTesting() {
  logs.length = 0;
}
