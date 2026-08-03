import type { ModulePassStatus, ProgrammeCertificationResult } from "./types.js";

/** Validates end-to-end enterprise workflow readiness across X1–X5. */
export class EndToEndWorkflowValidator {
  validate(programmeResults: ProgrammeCertificationResult[], validated: boolean): ModulePassStatus {
    if (!validated) return "fail";
    return programmeResults.every((r) => r.status === "pass") ? "pass" : "fail";
  }
}
