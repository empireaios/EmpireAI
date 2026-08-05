/**
 * Reject any Q11-04+ (Factory Readiness Audit and later) or Q12+ mission id.
 * Q11-03 itself is the only allowed self-mission-id.
 */
export function isForbiddenMissionId(missionId: string): boolean {
  const trimmed = missionId.trim();
  if (/^Q11-03$/i.test(trimmed)) return false;
  if (/^Q11-(0[4-9]|[1-9]\d)/i.test(trimmed)) return true;
  return /^Q1[2-9]-/i.test(trimmed) || /^Q[2-9]\d-/i.test(trimmed);
}
