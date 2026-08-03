const logs: Array<{ timestamp: string; event: string; details: string }> = [];
const redact = (value: string) =>
  value.replace(
    /(api[_-]?key|token|password|secret|bearer|credential|ssn|national[_-]?id|passport|phone|wa[_-]?id)\s*[=:]\s*\S+/gi,
    "$1=[redacted]",
  );

export function appendWawLog(entry: { event: string; details: string }): void {
  logs.push({
    timestamp: new Date().toISOString(),
    event: entry.event,
    details: redact(entry.details),
  });
}

export function getWawLogs(limit = 50) {
  return logs.slice(-limit);
}

export function resetWawLogsForTesting() {
  logs.length = 0;
}
