type PorLogEntry = {
  event: string;
  details: string;
  timestamp?: string;
};

const logs: PorLogEntry[] = [];

export function appendPorLog(entry: Omit<PorLogEntry, "timestamp">) {
  logs.push({ ...entry, timestamp: new Date().toISOString() });
}

export function getPorLogs() {
  return logs.map((entry) => ({ ...entry }));
}

export function resetPorLogsForTesting() {
  logs.length = 0;
}
