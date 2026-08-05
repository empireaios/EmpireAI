/**
 * Reject any Q11-05+ (Security Audit and later) or Q12+ mission id.
 * Q11-04 itself is the only allowed self-mission-id.
 */
export function isForbiddenMissionId(missionId: string): boolean {
  const trimmed = missionId.trim();
  if (/^Q11-04$/i.test(trimmed)) return false;
  if (/^Q11-(0[5-9]|[1-9]\d)/i.test(trimmed)) return true;
  return /^Q1[2-9]-/i.test(trimmed) || /^Q[2-9]\d-/i.test(trimmed);
}
