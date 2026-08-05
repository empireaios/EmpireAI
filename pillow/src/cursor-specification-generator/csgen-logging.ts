export type CsgenLogEntry = {
  timestamp: string;
  event: string;
  details: string;
};

const logs: CsgenLogEntry[] = [];

export function appendCsgenLog(entry: Omit<CsgenLogEntry, "timestamp">) {
  logs.push({ ...entry, timestamp: new Date().toISOString() });
}

export function getCsgenLogs(limit = 100): CsgenLogEntry[] {
  return logs.slice(-limit).map((entry) => ({ ...entry }));
}

export function resetCsgenLogsForTesting() {
  logs.length = 0;
}
