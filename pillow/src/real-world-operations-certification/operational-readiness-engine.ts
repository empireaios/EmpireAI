/** R5-20 — Operational Readiness Engine. */

import { appendRwocLog } from "./rwoc-logging.js";
import type { RealWorldOperationsCertificationConfiguration } from "./configuration.js";
import type { ProgrammeValidationResult } from "./types.js";

export class OperationalReadinessEngine {
  evaluate(input: {
    programmeResults: ProgrammeValidationResult[];
    endToEndWorkflowResult: "pass" | "partial" | "fail";
    crossProgrammeIntegrationResult: "pass" | "partial" | "fail";
    config: RealWorldOperationsCertificationConfiguration;
  }): {
    operationalReadinessScore: number;
    autonomousOperationalReadiness: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const programmes = input.programmeResults;
    if (programmes.length === 0) {
      return {
        operationalReadinessScore: 0,
        autonomousOperationalReadiness: false,
        warnings: ["No programmes evaluated"],
      };
    }

    const passWeight = programmes.filter((p) => p.status === "pass").length * 20;
    const partialWeight = programmes.filter((p) => p.status === "partial").length * 10;
    let score = passWeight + partialWeight;

    if (input.endToEndWorkflowResult === "pass") score += 10;
    else if (input.endToEndWorkflowResult === "partial") score += 5;
    else warnings.push("End-to-end workflow not fully ready");

    if (input.crossProgrammeIntegrationResult === "pass") score += 10;
    else if (input.crossProgrammeIntegrationResult === "partial") score += 5;
    else warnings.push("Cross-programme integration not fully ready");

    score = Math.max(0, Math.min(100, score));
    const autonomousOperationalReadiness =
      score >= input.config.operationalReadinessThreshold &&
      input.endToEndWorkflowResult !== "fail" &&
      input.crossProgrammeIntegrationResult !== "fail" &&
      programmes.every((p) => p.status !== "fail");

    appendRwocLog({
      event: "operational_readiness_validation",
      level: autonomousOperationalReadiness ? "info" : "warn",
      details: `Operational readiness score=${score} · autonomous=${autonomousOperationalReadiness}`,
    });

    return { operationalReadinessScore: score, autonomousOperationalReadiness, warnings };
  }
}
