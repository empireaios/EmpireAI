/**
 * G7-04 — Operational timeline.
 */

import { randomUUID } from "node:crypto";
import type { ExecutiveDecision, ExecutiveTimelineEntry } from "../contracts/executive-decision-types.js";

export function buildOperationalTimeline(decisions: ExecutiveDecision[] = []): ExecutiveTimelineEntry[] {
  const entries: ExecutiveTimelineEntry[] = [];

  for (const decision of decisions) {
    entries.push({
      entryId: randomUUID(),
      timestamp: decision.createdAt,
      kind: "executive_decision",
      summary: `${decision.decisionType} decision ${decision.status} — ${decision.recommendedAction}`,
      module: decision.sourceModule,
    });
    if (decision.completedAt) {
      entries.push({
        entryId: randomUUID(),
        timestamp: decision.completedAt,
        kind: "executive_decision_completed",
        summary: `Decision ${decision.decisionId} completed: ${decision.executedAction ?? decision.recommendedAction}`,
        module: decision.targetModule,
      });
    }
  }

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
