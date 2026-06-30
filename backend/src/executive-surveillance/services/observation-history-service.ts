import { randomUUID } from "node:crypto";

import { captureSoulRuntimeMemory } from "../../foundation/soul-file/index.js";
import type { ObservationHistoryRecord, ObservationOutcome } from "../models/observation-history.js";
import { getExecutiveSurveillanceRepository } from "../repositories/sqlite-ess-repository.js";

/** ESS-007 — Observation history; reuses Soul, no duplicated memory. */
export function recordObservationOutcome(
  workspaceId: string,
  companyId: string,
  input: {
    observationId?: string;
    signalId?: string;
    missionId?: string;
    outcome: ObservationOutcome;
    accuracy?: number;
    learningReference?: string;
  },
): ObservationHistoryRecord {
  const record: ObservationHistoryRecord = {
    recordId: randomUUID(),
    workspaceId,
    companyId,
    observationId: input.observationId,
    signalId: input.signalId,
    missionId: input.missionId,
    outcome: input.outcome,
    accuracy: input.accuracy,
    learningReference: input.learningReference,
    soulIntegrated: false,
    recordedAt: new Date().toISOString(),
    resolvedAt: input.outcome === "RESOLVED" || input.outcome === "IGNORED" ? new Date().toISOString() : undefined,
  };

  getExecutiveSurveillanceRepository().saveHistory(record);

  if (input.outcome === "RESOLVED" && input.learningReference) {
    try {
      captureSoulRuntimeMemory({
        workspaceId,
        actor: "executive-surveillance",
        memoryKey: "lessonsLearned",
        entry: {
          title: "Executive Surveillance outcome",
          summary: input.learningReference,
          source: "executive-surveillance",
          payload: { recordId: record.recordId, signalId: input.signalId, missionId: input.missionId },
        },
      });
      record.soulIntegrated = true;
    } catch {
      // Soul optional in validation
    }
  }

  return record;
}

export function listObservationHistory(workspaceId: string, companyId: string): ObservationHistoryRecord[] {
  return getExecutiveSurveillanceRepository().listHistory(workspaceId, companyId);
}
