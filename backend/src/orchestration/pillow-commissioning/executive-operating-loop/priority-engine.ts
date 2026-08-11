/**
 * Economic prioritisation — every candidate work item competes.
 */

import { randomUUID } from "node:crypto";
import type {
  PrioritisedWorkItem,
  StrategicHypothesis,
  WorkAuthority,
} from "./types.js";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function scoreHypothesis(h: StrategicHypothesis): PrioritisedWorkItem {
  const costMap = { cheap: 15, moderate: 45, expensive: 80 } as const;
  const investigationCost = costMap[h.estimatedInvestigationCost];
  const economicUpside = clamp(h.priorityScore);
  const economicDownside = h.kind === "abandon_opportunity" ? 40 : 55;
  const urgency =
    h.kind === "owner_authority" ? 95 : h.kind === "logistics_fulfilment" ? 80 : 65;
  const confidence = h.tier === "TIER_0" ? 70 : 55;
  const customerImpact =
    h.kind === "logistics_fulfilment" || h.kind === "quality_returns" ? 85 : 50;
  const strategicValue = clamp(h.priorityScore);
  const risk = h.requiresOwnerAuthority ? 75 : 40;
  const requiredAuthority: WorkAuthority = h.requiresOwnerAuthority
    ? "requires_grand_king"
    : "pillow_autonomous";

  // Higher upside/urgency/strategy, lower cost/risk → higher priority
  const priorityScore = clamp(
    economicUpside * 0.25 +
      urgency * 0.2 +
      strategicValue * 0.15 +
      customerImpact * 0.1 +
      confidence * 0.1 -
      investigationCost * 0.1 -
      risk * 0.1 +
      (requiredAuthority === "requires_grand_king" ? 5 : 0),
  );

  return {
    id: randomUUID(),
    title: h.question,
    kind: h.kind,
    economicUpside,
    economicDownside,
    urgency,
    confidence,
    customerImpact,
    strategicValue,
    risk,
    investigationCost,
    requiredAuthority,
    priorityScore,
    hypothesisId: h.id,
  };
}

export function prioritiseWork(hypotheses: StrategicHypothesis[]): PrioritisedWorkItem[] {
  return hypotheses.map(scoreHypothesis).sort((a, b) => b.priorityScore - a.priorityScore);
}

export function selectNextAuthorisedWork(
  queue: PrioritisedWorkItem[],
): PrioritisedWorkItem | null {
  // Pull highest-value work Pillow can do now; escalate items stay visible but
  // do not block autonomous investigations ranked below only if none autonomous.
  const autonomous = queue.filter((w) => w.requiredAuthority === "pillow_autonomous");
  if (autonomous[0]) return autonomous[0];
  return queue[0] ?? null;
}
