type MemrtLogEntry = {
  timestamp: string;
  event: string;
  details: string;
};

const logs: MemrtLogEntry[] = [];

export function appendMemrtLog(entry: { event: string; details: string }) {
  logs.push({ timestamp: new Date().toISOString(), ...entry });
}

export function getMemrtLogs() {
  return [...logs];
}

export function resetMemrtLogsForTesting() {
  logs.length = 0;
}
