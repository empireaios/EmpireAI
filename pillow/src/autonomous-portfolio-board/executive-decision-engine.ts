/** X2-20 — Executive Decision Engine. */

import type { ExecutiveBoardRecord, PriorityLevel } from "./types.js";

const PRIORITY_RANK: Record<PriorityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export class ExecutiveDecisionEngine {
  synthesizeDecisions(records: ExecutiveBoardRecord[]): string[] {
    const decisions = new Set<string>();
    for (const record of records) {
      for (const decision of record.recommendedDecisions) {
        decisions.add(decision);
      }
    }
    return [...decisions];
  }

  rankRecords(records: ExecutiveBoardRecord[]): ExecutiveBoardRecord[] {
    return [...records].sort((a, b) => {
      const priorityDelta =
        PRIORITY_RANK[b.priorityLevel] - PRIORITY_RANK[a.priorityLevel];
      if (priorityDelta !== 0) return priorityDelta;
      return b.decisionConfidence - a.decisionConfidence;
    });
  }

  expectedImpact(records: ExecutiveBoardRecord[]): string {
    if (!records.length) return "No executive impact assessed";
    const top = this.rankRecords(records)[0]!;
    return `Primary impact vector: ${top.expectedEnterpriseImpact}`;
  }
}
