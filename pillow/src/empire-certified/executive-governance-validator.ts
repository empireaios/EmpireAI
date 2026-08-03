import type { ModulePassStatus, ProgrammeCertificationResult } from "./types.js";

/** Validates executive governance readiness for Empire certification. */
export class ExecutiveGovernanceValidator {
  validate(programmeResults: ProgrammeCertificationResult[], validated: boolean): ModulePassStatus {
    if (!validated) return "fail";
    const critical = programmeResults.filter((r) => r.programmeId === "X4" || r.programmeId === "X5");
    return critical.every((r) => r.status === "pass") && programmeResults.every((r) => r.status === "pass")
      ? "pass"
      : "fail";
  }
}
