export type DbwLog = { timestamp: string; event: string; details: string };
const logs: DbwLog[] = [];
const redact = (value: string) => value.replace(/(token|secret|password|authorization|connectionString)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]");
export function appendDbwLog(entry: Omit<DbwLog, "timestamp">) {
  logs.push({ timestamp: new Date().toISOString(), event: entry.event, details: redact(entry.details) });
}
export function getDbwLogs(limit = 100) { return logs.slice(-limit).map((entry) => ({ ...entry })); }
export function resetDbwLogsForTesting() { logs.length = 0; }
