/** T2-08 — Shared scoring helpers. */

export function countSeverities(
  items: { severity: string }[],
): { error: number; warning: number; info: number } {
  return {
    error: items.filter((i) => i.severity === "error").length,
    warning: items.filter((i) => i.severity === "warning").length,
    info: items.filter((i) => i.severity === "info").length,
  };
}

export function averageConfidence(values: number[]): number {
  const filtered = values.filter((v) => v > 0);
  if (filtered.length === 0) return 0.5;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}
