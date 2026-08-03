import type { ModulePassStatus, ProgrammeCertificationResult } from "./types.js";

/** Validates constitutional governance continuity across certified programmes. */
export class ConstitutionalGovernanceValidator {
  validate(programmeResults: ProgrammeCertificationResult[], validated: boolean): ModulePassStatus {
    if (!validated) return "fail";
    if (programmeResults.every((r) => r.status === "pass")) return "pass";
    return "fail";
  }
}
