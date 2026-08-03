const logs: string[] = [];
export function appendEedLog(message: string) { logs.push(message.replace(/(token|password|api_key)=\S+/gi, "$1=[redacted]")); }
export function getEedLogs() { return [...logs]; }
export function resetEedLogsForTesting() { logs.length = 0; }
