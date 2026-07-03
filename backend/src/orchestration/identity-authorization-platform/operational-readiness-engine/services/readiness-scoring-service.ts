/**
 * G8-06 — Readiness scoring service.
 */

import type { ReadinessLevel } from "../contracts/readiness-types.js";

export function computeReadinessScore(input: {
  requiredCount: number;
  connectedCount: number;
  expiredCount: number;
  degradedCount: number;
  blockerCount: number;
}): number {
  if (input.requiredCount === 0) return 0;
  let score = Math.round((input.connectedCount / input.requiredCount) * 100);
  score -= input.expiredCount * 15;
  score -= input.degradedCount * 5;
  score -= input.blockerCount * 10;
  return Math.max(0, Math.min(100, score));
}

export function deriveReadinessLevel(input: {
  score: number;
  expiredCount: number;
  blockerCount: number;
  connectedCount: number;
  requiredCount: number;
}): ReadinessLevel {
  if (input.blockerCount > 0 && input.connectedCount === 0) return "blocked";
  if (input.expiredCount > 0) return "blocked";
  if (input.score >= 85) return "ready";
  if (input.score >= 50) return "partially_ready";
  if (input.connectedCount === 0) return "not_ready";
  if (input.score > 0) return "requires_review";
  return "unknown";
}
