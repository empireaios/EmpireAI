type QrtLogEntry = {
  timestamp: string;
  event: string;
  details: string;
};

const logs: QrtLogEntry[] = [];

export function appendQrtLog(entry: { event: string; details: string }) {
  logs.push({ timestamp: new Date().toISOString(), ...entry });
}

export function getQrtLogs() {
  return [...logs];
}

export function resetQrtLogsForTesting() {
  logs.length = 0;
}
