/**
 * G6-06 — Executive performance score engine.
 */

import type { PerformanceBottleneck, PerformanceResultState } from "../contracts/performance-certification-types.js";

const STATUS_SCORES: Record<PerformanceResultState, number> = {
  pass: 100,
  pass_with_conditions: 85,
  warning: 70,
  blocked: 0,
  fail: 0,
};

export function scorePerformanceStatus(status: PerformanceResultState): number {
  return STATUS_SCORES[status];
}

export function derivePerformanceStatus(input: {
  bottlenecks: PerformanceBottleneck[];
  warnings: PerformanceBottleneck[];
  pillowBlocked: boolean;
}): PerformanceResultState {
  if (input.pillowBlocked) return "blocked";
  if (input.bottlenecks.some((b) => b.severity === "critical")) return "fail";
  if (input.bottlenecks.length > 0) return "warning";
  if (input.warnings.some((w) => w.severity === "high")) return "warning";
  if (input.warnings.length > 0) return "pass_with_conditions";
  return "pass";
}

export function computeExecutivePerformanceScore(input: {
  bottlenecks: PerformanceBottleneck[];
  warnings: PerformanceBottleneck[];
  benchmarksWithinTarget: number;
  benchmarksTotal: number;
}): number {
  const status = derivePerformanceStatus({
    bottlenecks: input.bottlenecks,
    warnings: input.warnings,
    pillowBlocked: false,
  });
  let score = scorePerformanceStatus(status);
  if (input.benchmarksTotal > 0) {
    const ratio = input.benchmarksWithinTarget / input.benchmarksTotal;
    score = Math.round(score * 0.7 + ratio * 100 * 0.3);
  }
  return Math.max(0, Math.min(100, score));
}
