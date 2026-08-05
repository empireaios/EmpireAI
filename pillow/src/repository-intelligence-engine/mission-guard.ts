/** Reject Q13-03+ mission ids. Q13-02 itself is the only allowed self-mission-id. */

export function isForbiddenMissionId(missionId: string): boolean {
  const trimmed = missionId.trim();
  if (/^Q13-02$/i.test(trimmed)) return false;
  if (/^Q13-0[3-9]/i.test(trimmed)) return true;
  if (/^Q13-[1-9]\d/i.test(trimmed)) return true;
  return /^Q1[4-9]-/i.test(trimmed) || /^Q[2-9]\d-/i.test(trimmed);
}

export function isQ1301MissionId(missionId: string): boolean {
  return /^Q13-01$/i.test(missionId.trim());
}
