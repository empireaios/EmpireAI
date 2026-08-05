const logs: Array<{ timestamp: string; event: string; details: string }> = [];

export function appendEaprtLog(entry: { event: string; details: string }) {
  logs.push({ timestamp: new Date().toISOString(), ...entry });
}

export function getEaprtLogs() {
  return logs.map((entry) => ({ ...entry }));
}

export function resetEaprtLogsForTesting() {
  logs.length = 0;
}
