import { PROGRAMME_CATALOG } from "./paths.js";
import type { ProgrammeDefinition, ProgrammeId } from "./types.js";

/** Fixed Q11 certification programme catalog — never mutated per-run. */
export const PROGRAMMES: readonly ProgrammeDefinition[] = PROGRAMME_CATALOG;

export function listProgrammeIds(): ProgrammeId[] {
  return PROGRAMMES.map((p) => p.programmeId);
}

export function getProgramme(programmeId: string): ProgrammeDefinition | undefined {
  return PROGRAMMES.find((p) => p.programmeId === programmeId);
}

/**
 * Reject any Q11-02+ (Worker Readiness Audit and later) or Q12+ mission id.
 * Q11-01 itself is the only allowed self-mission-id.
 */
export function isForbiddenMissionId(missionId: string): boolean {
  const trimmed = missionId.trim();
  if (/^Q11-01$/i.test(trimmed)) return false;
  return /^Q11-\d{2}/i.test(trimmed) || /^Q1[2-9]-/i.test(trimmed) || /^Q[2-9]\d-/i.test(trimmed);
}
