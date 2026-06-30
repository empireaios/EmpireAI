import type { ExecutivePriorityLevel } from "../models/surveillance-core.js";
import type { ExecutiveSignal } from "../models/surveillance-core.js";

/** ESS-009 — Executive Priority Engine. */
export function scoreSignalPriority(input: {
  urgency: number;
  businessImpact: number;
  commercialValue: number;
  strategicValue: number;
  confidence: number;
  expectedRoi?: number;
}): { priority: ExecutivePriorityLevel; compositeScore: number } {
  const roiBoost = (input.expectedRoi ?? 50) * 0.1;
  const composite =
    input.urgency * 0.25 +
    input.businessImpact * 0.25 +
    input.commercialValue * 0.2 +
    input.strategicValue * 0.15 +
    input.confidence * 0.1 +
    roiBoost;

  let priority: ExecutivePriorityLevel = "LOW";
  if (composite >= 75) priority = "CRITICAL";
  else if (composite >= 55) priority = "HIGH";
  else if (composite >= 35) priority = "MEDIUM";

  return { priority, compositeScore: Math.round(composite) };
}

export function rankSignals(signals: ExecutiveSignal[]): ExecutiveSignal[] {
  const order: Record<ExecutivePriorityLevel, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  return [...signals].sort((a, b) => {
    const po = order[b.priority] - order[a.priority];
    if (po !== 0) return po;
    return b.confidence - a.confidence;
  });
}

export function enrichSignalWithPriority(
  signal: Omit<ExecutiveSignal, "priority" | "urgency" | "businessImpact" | "commercialValue" | "strategicValue" | "expectedRoi"> & {
    urgency?: number;
    businessImpact?: number;
    commercialValue?: number;
    strategicValue?: number;
    expectedRoi?: number;
  },
): ExecutiveSignal {
  const urgency = signal.urgency ?? Math.min(100, signal.confidence + 10);
  const businessImpact = signal.businessImpact ?? Math.round(signal.confidence * 0.85);
  const commercialValue = signal.commercialValue ?? Math.round(signal.confidence * 0.7);
  const strategicValue = signal.strategicValue ?? Math.round(signal.confidence * 0.6);
  const expectedRoi = signal.expectedRoi ?? Math.round(commercialValue * 0.8);
  const { priority } = scoreSignalPriority({ urgency, businessImpact, commercialValue, strategicValue, confidence: signal.confidence, expectedRoi });
  return { ...signal, urgency, businessImpact, commercialValue, strategicValue, expectedRoi, priority };
}
