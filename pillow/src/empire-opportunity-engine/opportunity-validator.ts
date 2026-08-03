import type { EmpireOpportunityInput, OpportunityValidationReport } from "./types.js";
import { EOP_METADATA_VERSION } from "./paths.js";
export class OpportunityValidator {
  validate(input: EmpireOpportunityInput): OpportunityValidationReport { const passed = input.validated === true; return { validationReportId: `eop-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: passed ? "pass" : "partial", errors: [], warnings: passed ? [] : ["Validated intelligence is required before recommendation."], durationMs: 0, metadataVersion: EOP_METADATA_VERSION }; }
}
