/** T5-02 — Severity normalization for upstream findings. */

import type { IssueSeverity } from "./types.js";

export function normalizeSeverity(
  upstream: string | undefined | null,
): IssueSeverity {
  const value = (upstream ?? "info").toLowerCase();
  if (value === "critical" || value === "error") return "critical";
  if (value === "high" || value === "warning") return "high";
  if (value === "medium") return "medium";
  if (value === "low") return "low";
  return "info";
}

export function maxSeverity(severities: IssueSeverity[]): IssueSeverity {
  const rank: Record<IssueSeverity, number> = {
    info: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  if (severities.length === 0) return "info";
  return severities.reduce((max, s) => (rank[s] > rank[max] ? s : max), "info");
}
