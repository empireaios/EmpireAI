const logs: Array<{ event: string; details: string; timestamp: string }> = [];

export function appendPlmrtLog(input: { event: string; details: string }) {
  logs.push({ ...input, timestamp: new Date().toISOString() });
}

export function getPlmrtLogs() {
  return logs.map((l) => ({ ...l }));
}

export function resetPlmrtLogsForTesting() {
  logs.length = 0;
}
