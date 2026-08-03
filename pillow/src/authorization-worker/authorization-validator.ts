import type { AuthorizationBuildReport, AuthorizationWorkerInput } from "./types.js";
const forbidden = ["authenticateUser", "replaceAuthenticationWorker", "implementQ609OrLater", "overridePillow", "overrideGrandKing", "overrideApprovedArchitecture"] as const;
export class AuthorizationValidator {
  validate(reports: AuthorizationBuildReport[] | null, input: AuthorizationWorkerInput = {}, complete = false) {
    const errors: string[] = []; const warnings: string[] = [];
    for (const key of forbidden) if (input[key]) errors.push(`Authorization Worker must never ${key}`);
    if (input.validated === false) errors.push("Authorization Worker requires validated=true");
    for (const report of reports ?? []) { if (!report.buildId.startsWith("azw-bld-")) errors.push("Build ID must start with azw-bld-"); if (!report.defaultDeny || !report.leastPrivilege || !report.neverAuthenticateUsers || !report.neverImplementQ609OrLater) errors.push("Authorization security boundaries missing"); if (complete && (!report.requirementsReportId || !report.architectureReportId || !report.selfReviewPassed)) errors.push("Incomplete authorization build report"); }
    return { decision: errors.length ? "fail" as const : warnings.length ? "partial" as const : "pass" as const, errors, warnings };
  }
}
