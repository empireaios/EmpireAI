/** Reject any Q12-02+ and Q13+ mission ids. Q12-01 itself is the only allowed self-mission-id. */

export function isForbiddenMissionId(missionId: string): boolean {

  const trimmed = missionId.trim();

  if (/^Q12-01$/i.test(trimmed)) return false;

  if (/^Q12-0[2-9]/i.test(trimmed)) return true;

  if (/^Q12-[1-9]\d/i.test(trimmed)) return true;

  return /^Q1[3-9]-/i.test(trimmed) || /^Q[2-9]\d-/i.test(trimmed);

}



export function isGkAuthorised(

  grandKingDecision: string | null | undefined,

  deploymentAuthorisationStatus: string | null | undefined,

): boolean {

  return grandKingDecision === "approve" && deploymentAuthorisationStatus === "authorised";

}


