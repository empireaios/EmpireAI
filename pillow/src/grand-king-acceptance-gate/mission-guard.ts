/**

 * Reject any Q12-01+ or Q12+ mission id.

 * Q11-10 itself is the only allowed self-mission-id.

 */

export function isForbiddenMissionId(missionId: string): boolean {

  const trimmed = missionId.trim();

  if (/^Q11-10$/i.test(trimmed)) return false;

  if (/^Q11-1[1-9]/i.test(trimmed)) return true;

  if (/^Q11-[2-9]\d/i.test(trimmed)) return true;

  return /^Q1[2-9]-/i.test(trimmed) || /^Q[2-9]\d-/i.test(trimmed);

}

