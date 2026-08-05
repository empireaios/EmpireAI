export type RiengLogEntry = {
  timestamp: string;
  event: string;
  details: string;
};

const logs: RiengLogEntry[] = [];

export function appendRiengLog(entry: Omit<RiengLogEntry, "timestamp">) {
  logs.push({ ...entry, timestamp: new Date().toISOString() });
}

export function getRiengLogs(limit = 100): RiengLogEntry[] {
  return logs.slice(-limit).map((entry) => ({ ...entry }));
}

export function resetRiengLogsForTesting() {
  logs.length = 0;
}
