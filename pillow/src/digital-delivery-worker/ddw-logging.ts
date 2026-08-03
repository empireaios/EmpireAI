const logs: Array<{ timestamp: string; event: string; details: string }> = [];
const redact = (value: string) =>
  value.replace(
    /(api[_-]?key|token|password|secret|download[_-]?token|access[_-]?token|bearer)\s*[=:]\s*\S+/gi,
    "$1=[redacted]",
  );

export function appendDdwLog(entry: { event: string; details: string }): void {
  logs.push({
    timestamp: new Date().toISOString(),
    event: entry.event,
    details: redact(entry.details),
  });
}

export function getDdwLogs(limit = 50) {
  return logs.slice(-limit);
}

export function resetDdwLogsForTesting() {
  logs.length = 0;
}
