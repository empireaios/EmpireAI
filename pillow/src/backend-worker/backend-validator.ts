import { BEW_METADATA_VERSION } from "./paths.js";
import type { BackendBuildReport, BackendWorkerInput, BackendWorkerValidationReport } from "./types.js";
const forbidden = ["buildFrontendUi", "designNewRequirements", "overrideApprovedArchitecture", "overridePillow", "overrideGrandKing", "implementQ606OrLater"] as const;
export class BackendValidator {
  validateBackendBuildReports(reports: BackendBuildReport[] | null, input: BackendWorkerInput, started: number, incomplete = false): BackendWorkerValidationReport {
    const errors: string[] = []; const warnings: string[] = [];
    for (const key of forbidden) if (input[key]) errors.push(`Backend Worker must never ${key}`);
    if (input.validated === false) errors.push("Backend Worker requires validated=true");
    for (const report of reports ?? []) {
      if (!report.buildId.startsWith("bew-bld-")) errors.push("Build ID must start with bew-bld-");
      if (!report.neverBuildFrontendUi || !report.neverDesignNewRequirements || !report.neverOverrideApprovedArchitecture || !report.neverImplementQ606OrLater) errors.push("Backend Worker boundary locks missing");
      if (!incomplete && (!report.requirementsReportId || !report.architectureReportId || !report.apisImplemented.length || !report.businessLogicModules.length || !report.integrationsCompleted.length || !report.backgroundJobs.length || !report.validationRules.length)) errors.push("Incomplete backend build report");
      if (!report.selfReviewPassed) warnings.push(`Report ${report.buildId} self-review incomplete`);
    }
    return this.finalize(errors.length ? "fail" : warnings.length ? "partial" : "pass", errors, warnings, started);
  }
  finalize(decision: "pass" | "partial" | "fail", errors: string[], warnings: string[], started: number): BackendWorkerValidationReport { return { validationReportId: `bew-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: errors.length ? "fail" : decision, errors, warnings, durationMs: Date.now() - started, metadataVersion: BEW_METADATA_VERSION }; }
}
export class HealthMonitor { status(decision: "pass" | "partial" | "fail", enabled: boolean) { return !enabled ? "standby" as const : decision === "fail" ? "failed" as const : decision === "partial" ? "degraded" as const : "healthy" as const; } }
export class RecoveryManager { private failures = 0; recordFailure() { this.failures += 1; } reset() { this.failures = 0; } getFailureCount() { return this.failures; } }
