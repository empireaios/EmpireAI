type FewLog = { timestamp: string; event: string; details: string };
const logs: FewLog[] = [];
const redact = (value: string) => value.replace(/(password|token|secret|api[_-]?key)\s*[:=]\s*\S+/gi, "$1=[REDACTED]");
export function appendFewLog(entry: Omit<FewLog, "timestamp">) { logs.push({ timestamp: new Date().toISOString(), event: entry.event, details: redact(entry.details) }); }
export function getFewLogs(limit = 100) { return logs.slice(-limit).map((entry) => ({ ...entry })); }
export function resetFewLogsForTesting() { logs.length = 0; }
