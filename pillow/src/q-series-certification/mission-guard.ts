/** Reject any Q11-13+ mission id. Q11-12 itself is the only allowed self-mission-id. */
export function isForbiddenMissionId(missionId: string): boolean {
  const trimmed = missionId.trim();
  if (/^Q11-12$/i.test(trimmed)) return false;
  if (/^Q11-1[3-9]/i.test(trimmed)) return true;
  if (/^Q11-[2-9]\d/i.test(trimmed)) return true;
  return /^Q1[2-9]-/i.test(trimmed) || /^Q[2-9]\d-/i.test(trimmed);
}

export function isGkAuthorised(
  grandKingDecision: string | null | undefined,
  deploymentAuthorisationStatus: string | null | undefined,
): boolean {
  return grandKingDecision === "approve" && deploymentAuthorisationStatus === "authorised";
}
