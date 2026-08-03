const logs: string[] = [];
export function appendEnkLog(message: string) { logs.push(message.replace(/(token|password|secret)=\S+/gi, "$1=[masked]")); }
export function getEnkLogs(limit = 8) { return logs.slice(-limit); }
export function resetEnkLogsForTesting() { logs.length = 0; }
