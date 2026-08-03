import { FEW_METADATA_VERSION } from "./paths.js";
import type { FrontendBuildReport, FrontendWorkerInput, FrontendWorkerValidationReport } from "./types.js";
const forbidden = ["implementBackendBusinessLogic", "designDatabases", "deployApplications", "overridePillow", "overrideGrandKing", "implementQ605OrLater"] as const;
export class FrontendValidator {
  validateFrontendBuildReports(reports: FrontendBuildReport[] | null, input: FrontendWorkerInput, started: number, incomplete = false): FrontendWorkerValidationReport {
    const errors: string[] = []; const warnings: string[] = [];
    for (const key of forbidden) if (input[key]) errors.push(`Frontend Worker must never ${key}`);
    if (input.validated === false) errors.push("Frontend Worker requires validated=true");
    for (const r of reports ?? []) {
      if (!r.buildId.startsWith("few-bld-")) errors.push("Build ID must start with few-bld-");
      if (!r.neverImplementBackendBusinessLogic || !r.neverDesignDatabases || !r.neverDeployApplications || !r.neverImplementQ605OrLater) errors.push("Frontend Worker boundary locks missing");
      if (!incomplete && (!r.requirementsReportId || !r.architectureReportId || !r.layouts.length || !r.dashboardsCreated.length || !r.pagesCreated.length || !r.formsCreated.length || !r.workflowScreens.length || !r.apiIntegrations.length)) errors.push("Incomplete frontend build report");
      if (!r.selfReviewPassed) warnings.push(`Report ${r.buildId} self-review incomplete`);
    }
    return this.finalize(errors.length ? "fail" : warnings.length ? "partial" : "pass", errors, warnings, started);
  }
  finalize(decision: "pass" | "partial" | "fail", errors: string[], warnings: string[], started: number): FrontendWorkerValidationReport { return { validationReportId: `few-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: errors.length ? "fail" : decision, errors, warnings, durationMs: Date.now() - started, metadataVersion: FEW_METADATA_VERSION }; }
}
export class HealthMonitor { status(decision: "pass" | "partial" | "fail", enabled: boolean) { return !enabled ? "standby" as const : decision === "fail" ? "failed" as const : decision === "partial" ? "degraded" as const : "healthy" as const; } }
export class RecoveryManager { private failures = 0; recordFailure() { this.failures++; } reset() { this.failures = 0; } getFailureCount() { return this.failures; } }
