const logs: Array<{ timestamp: string; event: string; details: string }> = [];
const redact = (value: string) =>
  value.replace(/(api[_-]?key|token|password|secret)\s*[=:]\s*\S+/gi, "$1=[redacted]");

export function appendEpLog(entry: { event: string; details: string }): void {
  logs.push({ timestamp: new Date().toISOString(), event: entry.event, details: redact(entry.details) });
}

export function getEpLogs(limit = 50) {
  return logs.slice(-limit);
}

export function resetEpLogsForTesting() {
  logs.length = 0;
}
