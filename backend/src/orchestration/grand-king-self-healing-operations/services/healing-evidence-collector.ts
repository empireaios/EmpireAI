/**
 * G7-08 — Healing evidence collector.
 */

import type { HealingActionRecord, HealingEvidence } from "../contracts/self-healing-types.js";

export function collectHealingEvidence(record: HealingActionRecord): HealingEvidence[] {
  return [{
    evidenceId: `ev-outcome-${record.healingId}`,
    kind: "recovery",
    summary: `Recovery outcome for ${record.healingAction}`,
    ref: record.recoveryReference,
  }, {
    evidenceId: `ev-confidence-${record.healingId}`,
    kind: "signal",
    summary: `Confidence score ${record.confidenceScore}`,
    ref: `confidence:${record.confidenceScore}`,
  }];
}
