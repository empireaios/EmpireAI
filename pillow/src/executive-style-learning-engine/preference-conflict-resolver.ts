/** T2-03 — Preference conflict resolution. */

import { appendExecutiveStyleLog } from "./executive-style-logging.js";
import type { PreferenceRecord } from "./types.js";

export class PreferenceConflictResolver {
  resolve(preferences: PreferenceRecord[]): {
    resolved: PreferenceRecord[];
    conflictsResolved: number;
  } {
    const byKey = new Map<string, PreferenceRecord[]>();
    for (const pref of preferences) {
      const key = `${pref.preferenceCategory}:${pref.preferenceValue}`;
      const list = byKey.get(key) ?? [];
      list.push(pref);
      byKey.set(key, list);
    }

    const resolved: PreferenceRecord[] = [];
    let conflictsResolved = 0;

    for (const [, group] of byKey) {
      if (group.length === 1) {
        resolved.push(group[0]!);
        continue;
      }

      const approvals = group.filter((p) => p.sourceReference.startsWith("approval-"));
      const rejections = group.filter((p) => p.sourceReference.startsWith("rejection-"));

      if (approvals.length > 0 && rejections.length > 0) {
        const winner = approvals.sort((a, b) => b.learningConfidence - a.learningConfidence)[0]!;
        resolved.push({ ...winner, currentStatus: "active" });
        conflictsResolved += 1;
        appendExecutiveStyleLog({
          event: "conflict_resolved",
          level: "info",
          details: `Resolved conflict for ${winner.preferenceCategory}: ${winner.preferenceValue}`,
        });
      } else {
        const best = group.sort((a, b) => b.learningConfidence - a.learningConfidence)[0]!;
        resolved.push(best);
      }
    }

    return { resolved, conflictsResolved };
  }
}
