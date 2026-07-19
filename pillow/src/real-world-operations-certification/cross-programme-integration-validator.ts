/** R5-20 — Cross-Programme Integration Validator. */

import { appendRwocLog } from "./rwoc-logging.js";
import type { RealWorldOperationsCertificationContext } from "./real-world-operations-certification-context.js";
import type { ProgrammeValidationResult } from "./types.js";

export class CrossProgrammeIntegrationValidator {
  validate(
    ctx: RealWorldOperationsCertificationContext,
    programmeResults: ProgrammeValidationResult[],
  ): {
    result: "pass" | "partial" | "fail";
    evidenceReferences: string[];
    warnings: string[];
    errors: string[];
  } {
    const evidenceReferences: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    const bridges: Array<[string, unknown]> = [
      ["marketplace↔supplier", ctx.marketplaceCertification && ctx.supplierOperationsCertification],
      ["supplier↔finance", ctx.supplierOperationsCertification && ctx.financialOperationsCertification],
      ["finance↔customer", ctx.financialOperationsCertification && ctx.customerOperationsCertification],
      ["customer↔marketing", ctx.customerOperationsCertification && ctx.marketingFramework],
      ["marketing↔autonomy", ctx.autonomousMarketingEngine && ctx.crossChannelOrchestrator],
    ];

    let connected = 0;
    for (const [name, present] of bridges) {
      if (present) {
        connected += 1;
        evidenceReferences.push(`bridge:${name}`);
      } else {
        warnings.push(`Integration bridge incomplete: ${name}`);
      }
    }

    const programmePasses = programmeResults.filter((r) => r.status !== "fail").length;
    if (programmePasses < 3) {
      errors.push("Insufficient programme readiness for cross-programme integration");
    }

    let result: "pass" | "partial" | "fail" = "fail";
    if (connected === bridges.length && errors.length === 0) result = "pass";
    else if (connected >= 3 && errors.length === 0) result = "partial";
    else if (connected >= 2) result = "partial";

    appendRwocLog({
      event: "cross_programme_validation",
      level: result === "fail" ? "warn" : "info",
      details: `Cross-programme integration result=${result} · bridges=${connected}/${bridges.length}`,
    });

    return { result, evidenceReferences, warnings, errors };
  }
}
