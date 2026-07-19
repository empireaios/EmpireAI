/** R5-20 — End-to-End Workflow Validator. */

import { appendRwocLog } from "./rwoc-logging.js";
import type { ProgrammeValidationResult } from "./types.js";

export class EndToEndWorkflowValidator {
  validate(programmeResults: ProgrammeValidationResult[]): {
    result: "pass" | "partial" | "fail";
    evidenceReferences: string[];
    warnings: string[];
    errors: string[];
  } {
    const required = ["R1", "R2", "R3", "R4", "R5"];
    const byId = new Map(programmeResults.map((r) => [r.programmeId, r]));
    const evidenceReferences: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    let passes = 0;
    let partials = 0;
    for (const id of required) {
      const result = byId.get(id);
      if (!result) {
        errors.push(`Missing programme result for ${id}`);
        continue;
      }
      evidenceReferences.push(...result.evidenceReferences);
      if (result.status === "pass") passes += 1;
      else if (result.status === "partial") partials += 1;
      else errors.push(`${id} failed end-to-end contribution`);
    }

    let result: "pass" | "partial" | "fail" = "fail";
    if (passes === required.length) result = "pass";
    else if (passes + partials === required.length && errors.length === 0) result = "partial";
    else if (passes + partials >= 3) {
      result = "partial";
      warnings.push("End-to-end workflow partially validated across programmes");
    }

    appendRwocLog({
      event: "end_to_end_workflow_validation",
      level: result === "fail" ? "warn" : "info",
      details: `End-to-end workflow result=${result} · pass=${passes} partial=${partials}`,
    });

    return { result, evidenceReferences, warnings, errors };
  }
}
