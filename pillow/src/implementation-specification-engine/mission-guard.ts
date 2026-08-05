/** Reject Q13-02+ / Q13-03+ / Q14+ mission ids. Q13-01 itself is the only allowed self-mission-id. */

export function isForbiddenMissionId(missionId: string): boolean {
  const trimmed = missionId.trim();
  if (/^Q13-01$/i.test(trimmed)) return false;
  if (/^Q13-0[2-9]/i.test(trimmed)) return true;
  if (/^Q13-[1-9]\d/i.test(trimmed)) return true;
  return /^Q1[4-9]-/i.test(trimmed) || /^Q[2-9]\d-/i.test(trimmed);
}
