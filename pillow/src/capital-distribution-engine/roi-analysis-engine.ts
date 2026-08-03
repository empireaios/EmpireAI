/** X2-05 — ROI analysis engine. */

import { appendCdeLog } from "./cde-logging.js";

export class RoiAnalysisEngine {
  calculateExpectedRoi(input: {
    requestedCapital: number;
    expectedRoiHint?: number;
    performanceScore?: number;
  }): number {
    const hint =
      typeof input.expectedRoiHint === "number" && Number.isFinite(input.expectedRoiHint)
        ? Math.max(0, Math.min(200, input.expectedRoiHint))
        : null;

    const performanceBoost =
      typeof input.performanceScore === "number"
        ? Math.max(-10, Math.min(20, (input.performanceScore - 50) / 5))
        : 0;

    const base = hint ?? Math.max(8, Math.min(40, 1000 / Math.max(input.requestedCapital, 1)));
    const expectedRoi = Math.round((base + performanceBoost) * 10) / 10;

    appendCdeLog({
      event: "roi_calculation",
      level: "info",
      details: `Expected ROI ${expectedRoi}% for request ${input.requestedCapital} units`,
    });

    return expectedRoi;
  }

  calculateCapitalEfficiency(expectedRoi: number, approvedAllocation: number): number {
    if (approvedAllocation <= 0) return 0;
    return Math.round((expectedRoi / Math.sqrt(approvedAllocation)) * 10) / 10;
  }
}
