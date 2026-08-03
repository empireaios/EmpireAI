/** X2-05 — Investment evaluation engine. */

import { appendCdeLog } from "./cde-logging.js";
import type { AllocationPriority } from "./types.js";

export class InvestmentEvaluationEngine {
  evaluatePriority(input: {
    expectedRoi: number;
    requestedCapital: number;
    minExpectedRoi: number;
  }): AllocationPriority {
    let priority: AllocationPriority = "low";
    if (input.expectedRoi >= input.minExpectedRoi + 25 && input.requestedCapital <= 150) {
      priority = "critical";
    } else if (input.expectedRoi >= input.minExpectedRoi + 15) {
      priority = "high";
    } else if (input.expectedRoi >= input.minExpectedRoi) {
      priority = "medium";
    }

    appendCdeLog({
      event: "investment_evaluation",
      level: "info",
      details: `Priority ${priority} · ROI ${input.expectedRoi}%`,
    });

    return priority;
  }
}
