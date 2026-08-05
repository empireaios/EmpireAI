type MonrtLogEntry = {
  timestamp: string;
  event: string;
  details: string;
};

const SECRET_PATTERNS = [
  /api[_-]?key\s*[:=]\s*["']?[^"'\s]+/gi,
  /bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /password\s*[:=]\s*["']?[^"'\s]+/gi,
  /secret\s*[:=]\s*["']?[^"'\s]+/gi,
  /token\s*[:=]\s*["']?(?!audit:\/\/)(?!msg:\/\/)[^"'\s]+/gi,
];

const logs: MonrtLogEntry[] = [];

function sanitizeDetails(details: string): string {
  let sanitized = details;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  return sanitized;
}

/** Append-only log. NEVER logs credential values — auditReference-safe strings only. */
export function appendMonrtLog(entry: { event: string; details: string }) {
  logs.push({
    timestamp: new Date().toISOString(),
    event: entry.event,
    details: sanitizeDetails(entry.details),
  });
}

export function getMonrtLogs() {
  return [...logs];
}

export function resetMonrtLogsForTesting() {
  logs.length = 0;
}
