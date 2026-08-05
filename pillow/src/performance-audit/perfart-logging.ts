const logs: Array<{ timestamp: string; event: string; details: string }> = [];

/**
 * Defense-in-depth redaction. Performance Audit never handles secret
 * values structurally — it only measures timings and structural
 * presence — but this redaction guards the log sink against any
 * accidental leakage from evidence strings composed elsewhere.
 */
const SECRET_KEY_PATTERN =
  /(api[_-]?key|token|password|secret|bearer|credential|session[_-]?secret|authorization)\s*[=:]\s*\S+/gi;

const redact = (value: string) => value.replace(SECRET_KEY_PATTERN, "$1=[REDACTED]");

export function appendPerfartLog(entry: { event: string; details: string }): void {
  logs.push({
    timestamp: new Date().toISOString(),
    event: entry.event,
    details: redact(entry.details),
  });
}

export function getPerfartLogs(limit = 50) {
  return logs.slice(-limit);
}

export function resetPerfartLogsForTesting() {
  logs.length = 0;
}
