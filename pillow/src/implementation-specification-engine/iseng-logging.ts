const logs: Array<{ event: string; details: string; timestamp: string }> = [];

export function appendIsengLog(input: { event: string; details: string }) {
  logs.push({ ...input, timestamp: new Date().toISOString() });
}

export function getIsengLogs() {
  return logs.map((l) => ({ ...l }));
}

export function resetIsengLogsForTesting() {
  logs.length = 0;
}
