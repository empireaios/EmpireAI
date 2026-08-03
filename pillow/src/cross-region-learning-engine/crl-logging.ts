type CrlLog = { timestamp: string; event: string; details: string };
const logs: CrlLog[] = [];
export function appendCrlLog(event: string, details: string) { logs.push({ timestamp: new Date().toISOString(), event, details }); }
export function getCrlLogs(limit = 50) { return logs.slice(-limit); }
export function resetCrlLogsForTesting() { logs.length = 0; }
