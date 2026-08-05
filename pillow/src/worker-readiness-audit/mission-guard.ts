/**
 * Reject any Q11-03+ (Pillow Command Audit and later) or Q12+ mission id.
 * Q11-02 itself is the only allowed self-mission-id.
 */
export function isForbiddenMissionId(missionId: string): boolean {
  const trimmed = missionId.trim();
  if (/^Q11-02$/i.test(trimmed)) return false;
  if (/^Q11-(0[3-9]|[1-9]\d)/i.test(trimmed)) return true;
  return /^Q1[2-9]-/i.test(trimmed) || /^Q[2-9]\d-/i.test(trimmed);
}
