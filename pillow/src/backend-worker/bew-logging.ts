type BewLog = { timestamp: string; event: string; details: string };
const logs: BewLog[] = [];
const redact = (value: string) => value.replace(/(token|secret|password|authorization)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]");
export function appendBewLog(entry: Omit<BewLog, "timestamp">) { logs.push({ timestamp: new Date().toISOString(), event: entry.event, details: redact(entry.details) }); }
export function getBewLogs(limit = 100) { return logs.slice(-limit).map((entry) => ({ ...entry })); }
export function resetBewLogsForTesting() { logs.length = 0; }
