import { architectureValidator, type ArchitectureValidationReport } from "./architecture-validator.js";
import type { GuardianHealthReport } from "./types.js";

/** Guardian self-check framework — extends health monitoring with architecture validation. */
export class GuardianSelfCheckFramework {
  runArchitectureValidation(workspaceId?: string): ArchitectureValidationReport {
    return architectureValidator.validate(workspaceId ?? "system");
  }

  mergeIntoHealthReport(
    base: GuardianHealthReport,
    architectureReport: ArchitectureValidationReport,
  ): GuardianHealthReport {
    const overall =
      base.overall === "failed" || architectureReport.overall === "failed"
        ? "failed"
        : base.overall === "degraded" || architectureReport.overall === "degraded"
          ? "degraded"
          : "healthy";

    return {
      ...base,
      overall,
      summary: `${base.summary}; ${architectureReport.summary}`,
    };
  }
}

export const guardianSelfCheck = new GuardianSelfCheckFramework();
