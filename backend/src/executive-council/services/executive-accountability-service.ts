import { randomUUID } from "node:crypto";

import type { AccountabilityOutcome, ExecutiveAccountabilityRecord } from "../models/executive-accountability.js";
import { getExecutiveCouncilRepository } from "../repositories/sqlite-executive-council-repository.js";
import { listRegisteredExecutives } from "./executive-registry-service.js";

/** EC-007 — Executive accountability and confidence calibration. */
export function recordExecutiveAccountability(
  workspaceId: string,
  companyId: string,
  input: {
    executiveId: string;
    recommendationId: string;
    sessionId: string;
    predictedOutcome: string;
    outcome: AccountabilityOutcome;
    actualOutcome?: string;
    commercialResult?: string;
    confidenceAtRecommendation: number;
  },
): ExecutiveAccountabilityRecord {
  const calibration = computeConfidenceCalibration(input.confidenceAtRecommendation, input.outcome);

  const record: ExecutiveAccountabilityRecord = {
    recordId: randomUUID(),
    workspaceId,
    companyId,
    executiveId: input.executiveId,
    recommendationId: input.recommendationId,
    sessionId: input.sessionId,
    predictedOutcome: input.predictedOutcome,
    actualOutcome: input.actualOutcome,
    outcome: input.outcome,
    commercialResult: input.commercialResult,
    confidenceAtRecommendation: input.confidenceAtRecommendation,
    confidenceCalibration: calibration,
    recordedAt: new Date().toISOString(),
    resolvedAt: input.outcome !== "UNKNOWN" ? new Date().toISOString() : undefined,
  };

  getExecutiveCouncilRepository().saveAccountability(record);
  updateExecutiveSuccessRate(workspaceId, companyId, input.executiveId);
  return record;
}

function computeConfidenceCalibration(confidence: number, outcome: AccountabilityOutcome): number {
  if (outcome === "UNKNOWN") return 0;
  const actual = outcome === "CORRECT" ? 100 : 0;
  return Math.round(actual - confidence);
}

function updateExecutiveSuccessRate(workspaceId: string, companyId: string, executiveId: string): void {
  const repo = getExecutiveCouncilRepository();
  const records = repo.listAccountability(workspaceId, companyId, executiveId).filter((r) => r.outcome !== "UNKNOWN");
  if (records.length === 0) return;

  const successRate = Math.round((records.filter((r) => r.outcome === "CORRECT").length / records.length) * 100);
  const exec = listRegisteredExecutives(workspaceId, companyId).find((e) => e.executiveId === executiveId);
  if (!exec) return;
  repo.saveExecutive(workspaceId, companyId, { ...exec, successRate });
}

export function listExecutiveAccountability(
  workspaceId: string,
  companyId: string,
  executiveId?: string,
): ExecutiveAccountabilityRecord[] {
  return getExecutiveCouncilRepository().listAccountability(workspaceId, companyId, executiveId);
}
