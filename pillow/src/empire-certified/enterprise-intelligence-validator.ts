import type { ModuleCertificationResult, ModulePassStatus } from "./types.js";

/** Validates enterprise intelligence readiness from Empire Intelligence modules. */
export class EnterpriseIntelligenceValidator {
  validate(moduleResults: ModuleCertificationResult[], validated: boolean): ModulePassStatus {
    if (!validated) return "fail";
    return moduleResults.every((r) => r.status === "pass") ? "pass" : "fail";
  }
}
