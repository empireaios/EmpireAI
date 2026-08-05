const logs: Array<{ timestamp: string; event: string; details: string }> = [];

const SECRET_KEY_PATTERN =
  /(api[_-]?key|token|password|secret|bearer|credential|session[_-]?secret|authorization)\s*[=:]\s*\S+/gi;

const redact = (value: string) => value.replace(SECRET_KEY_PATTERN, "$1=[REDACTED]");

export function appendRecartLog(entry: { event: string; details: string }): void {
  logs.push({
    timestamp: new Date().toISOString(),
    event: entry.event,
    details: redact(entry.details),
  });
}

export function getRecartLogs(limit = 50) {
  return logs.slice(-limit);
}

export function resetRecartLogsForTesting() {
  logs.length = 0;
}
