const logs: Array<{ event: string; details: string; timestamp: string }> = [];

export function appendQscptLog(input: { event: string; details: string }) {
  logs.push({ ...input, timestamp: new Date().toISOString() });
}

export function getQscptLogs() {
  return logs.map((l) => ({ ...l }));
}

export function resetQscptLogsForTesting() {
  logs.length = 0;
}
