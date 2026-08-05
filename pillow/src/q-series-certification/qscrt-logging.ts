const logs: Array<{ event: string; details: string; timestamp: string }> = [];

export function appendQscrtLog(input: { event: string; details: string }) {
  logs.push({ ...input, timestamp: new Date().toISOString() });
}

export function getQscrtLogs() {
  return logs.map((l) => ({ ...l }));
}

export function resetQscrtLogsForTesting() {
  logs.length = 0;
}
