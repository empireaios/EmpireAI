import { ECA_METADATA_VERSION } from "./paths.js";
import type { CapitalValidationReport, EmpireCapitalAllocationInput } from "./types.js";
export class CapitalValidator {
  validate(input: EmpireCapitalAllocationInput): CapitalValidationReport {
    const valid = input.validated === true;
    return { validationReportId: `eca-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: valid ? "pass" : "partial", errors: [], warnings: valid ? [] : ["Unvalidated structural financial signal retained"], durationMs: 0, metadataVersion: ECA_METADATA_VERSION };
  }
}
