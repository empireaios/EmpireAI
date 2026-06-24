type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    source: "empireai-brain-client",
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (process.env.NODE_ENV === "production" && level === "debug") return;

  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  fn(JSON.stringify(entry));
}

export const brainLogger = {
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
};
