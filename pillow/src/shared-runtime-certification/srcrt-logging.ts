const logs: Array<{ timestamp: string; event: string; details: string }> = [];
const redact = (value: string) =>
  value.replace(
    /(api[_-]?key|token|password|secret|bearer|credential)\s*[=:]\s*\S+/gi,
    "$1=[redacted]",
  );

export function appendSrcrtLog(entry: { event: string; details: string }): void {
  logs.push({
    timestamp: new Date().toISOString(),
    event: entry.event,
    details: redact(entry.details),
  });
}

export function getSrcrtLogs(limit = 50) {
  return logs.slice(-limit);
}

export function resetSrcrtLogsForTesting() {
  logs.length = 0;
}
