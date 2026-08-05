type MsrLogEntry = {
  timestamp: string;
  event: string;
  details: string;
};

const logs: MsrLogEntry[] = [];

export function appendMsrLog(entry: { event: string; details: string }) {
  logs.push({ timestamp: new Date().toISOString(), ...entry });
}

export function getMsrLogs() {
  return [...logs];
}

export function resetMsrLogsForTesting() {
  logs.length = 0;
}
