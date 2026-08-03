import type { MissionVerificationRow } from "./types.js";
export function evaluateDimensions(matrix: MissionVerificationRow[]) {
  const failedMissionIds = matrix.filter((row) => row.status !== "Certified").map((row) => row.missionId);
  return [{ dimension: "complete_observed_evidence", passed: failedMissionIds.length === 0, evidence: `${matrix.length - failedMissionIds.length}/${matrix.length} certified`, failedMissionIds }];
}
