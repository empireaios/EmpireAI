import type { AuthenticationBuildReport, AuthenticationWorkerInput } from "./types.js";
const forbidden = ["defineRoles", "definePermissions", "buildPolicyBasedAccessControl", "overrideApprovedArchitecture", "overridePillow", "overrideGrandKing", "implementQ608OrLater", "storePlaintextPassword", "exposeSecrets"] as const;
export class AuthenticationValidator {
  validate(reports: AuthenticationBuildReport[] | null, input: AuthenticationWorkerInput = {}, complete = false) {
    const errors: string[] = []; const warnings: string[] = [];
    for (const key of forbidden) if (input[key]) errors.push(`Authentication Worker must never ${key}`);
    if (input.validated === false) errors.push("Authentication Worker requires validated=true");
    for (const report of reports ?? []) { if (!report.buildId.startsWith("atw-bld-")) errors.push("Build ID must start with atw-bld-"); if (!report.neverDefineRoles || !report.neverDefinePermissions || !report.neverBuildPolicyBasedAccessControl || !report.neverImplementQ608OrLater) errors.push("Authentication boundaries missing"); if (complete && (!report.requirementsReportId || !report.architectureReportId || !report.selfReviewPassed)) errors.push("Incomplete authentication build report"); }
    return { decision: errors.length ? "fail" as const : warnings.length ? "partial" as const : "pass" as const, errors, warnings };
  }
}
export class HealthMonitor { status(decision: "pass" | "partial" | "fail") { return decision === "fail" ? "failed" as const : decision === "partial" ? "degraded" as const : "healthy" as const; } }
export { RecoveryManager } from "./recovery-manager.js";
