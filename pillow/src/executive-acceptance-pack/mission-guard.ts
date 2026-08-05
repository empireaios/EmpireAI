/**
 * Reject any Q11-10+ (Grand King Acceptance Gate and later) or Q12+ mission id.
 * Q11-09 itself is the only allowed self-mission-id.
 */
export function isForbiddenMissionId(missionId: string): boolean {
  const trimmed = missionId.trim();
  if (/^Q11-09$/i.test(trimmed)) return false;
  if (/^Q11-1[0-9]/i.test(trimmed)) return true;
  if (/^Q11-[2-9]\d/i.test(trimmed)) return true;
  return /^Q1[2-9]-/i.test(trimmed) || /^Q[2-9]\d-/i.test(trimmed);
}
