type SrtcLogEntry = {
  event: string;
  details: string;
  timestamp?: string;
};

const logs: SrtcLogEntry[] = [];

export function appendSrtcLog(entry: Omit<SrtcLogEntry, "timestamp">) {
  logs.push({ ...entry, timestamp: new Date().toISOString() });
}

export function getSrtcLogs() {
  return logs.map((entry) => ({ ...entry }));
}

export function resetSrtcLogsForTesting() {
  logs.length = 0;
}
