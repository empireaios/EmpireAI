const redact = (value: unknown): unknown => typeof value === "string" ? value.replace(/(token|secret|password|credential)\s*[:=]\s*\S+/gi, "$1=[REDACTED]") : value;
export function createPfcLogger(sink: (entry: Record<string, unknown>) => void = () => undefined) {
  return { info(event: string, detail: unknown) { sink({ event, detail: redact(detail), timestamp: new Date().toISOString() }); } };
}
