type EesaeLogEntry = {
  event: string;
  details: string;
  timestamp: string;
};

const logs: EesaeLogEntry[] = [];

export function appendEesaeLog(entry: { event: string; details: string }) {
  logs.push({ ...entry, timestamp: new Date().toISOString() });
}

export function getEesaeLogs(limit = 100): EesaeLogEntry[] {
  return logs.slice(-limit).map((entry) => ({ ...entry }));
}

export function resetEesaeLogsForTesting() {
  logs.length = 0;
}
