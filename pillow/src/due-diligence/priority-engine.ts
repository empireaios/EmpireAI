import type { RecommendationPriority, ReviewFinding } from "./types.js";

const SEVERITY_ORDER: RecommendationPriority[] = [
  "critical",
  "high",
  "normal",
  "low",
  "future",
];

export function comparePriority(
  a: RecommendationPriority,
  b: RecommendationPriority,
): number {
  return SEVERITY_ORDER.indexOf(a) - SEVERITY_ORDER.indexOf(b);
}

export function escalatePriority(
  finding: ReviewFinding,
  context: { healthScore?: number; syncRequired?: boolean },
): RecommendationPriority {
  if (finding.severity === "critical") return "critical";
  if (context.healthScore !== undefined && context.healthScore < 50) {
    return finding.severity === "high" ? "critical" : "high";
  }
  if (context.syncRequired && finding.category === "repository_drift_review") {
    return "high";
  }
  return finding.severity;
}

export function sortRecommendationsByPriority<T extends { priority: RecommendationPriority }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => comparePriority(a.priority, b.priority));
}
