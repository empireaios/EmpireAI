export type MpengLogEntry = {
  timestamp: string;
  event: string;
  details: string;
};

const logs: MpengLogEntry[] = [];

export function appendMpengLog(entry: Omit<MpengLogEntry, "timestamp">) {
  logs.push({ ...entry, timestamp: new Date().toISOString() });
}

export function getMpengLogs(limit = 100): MpengLogEntry[] {
  return logs.slice(-limit).map((entry) => ({ ...entry }));
}

export function resetMpengLogsForTesting() {
  logs.length = 0;
}
