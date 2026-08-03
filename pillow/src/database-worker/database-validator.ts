import { DBW_METADATA_VERSION } from "./paths.js";
import type { DatabaseBuildReport, DatabaseWorkerInput, DatabaseWorkerValidationReport } from "./types.js";
const forbidden = ["buildFrontend", "buildBackendBusinessLogic", "overrideApprovedArchitecture", "overridePillow", "overrideGrandKing", "implementQ607OrLater", "implementApplicationBusinessLogic"] as const;
export class DatabaseValidator {
  validateDatabaseBuildReports(reports: DatabaseBuildReport[] | null, input: DatabaseWorkerInput, started: number, incomplete = false): DatabaseWorkerValidationReport {
    const errors: string[] = []; const warnings: string[] = [];
    for (const key of forbidden) if (input[key]) errors.push(`Database Worker must never ${key}`);
    if (input.validated === false) errors.push("Database Worker requires validated=true");
    for (const report of reports ?? []) {
      if (!report.buildId.startsWith("dbw-bld-")) errors.push("Build ID must start with dbw-bld-");
      if (!report.neverBuildFrontend || !report.neverBuildBackendBusinessLogic || !report.neverOverrideApprovedArchitecture || !report.neverImplementQ607OrLater) errors.push("Database Worker boundary locks missing");
      if (!incomplete && (!report.requirementsReportId || !report.architectureReportId || !report.schemasCreated.length || !report.tablesCreated.length || !report.relationships.length || !report.indexes.length || report.migrationStatus !== "generated" || report.integrityValidation !== "passed")) errors.push("Incomplete database build report");
      if (!report.selfReviewPassed) warnings.push(`Report ${report.buildId} self-review incomplete`);
    }
    return this.finalize(errors.length ? "fail" : warnings.length ? "partial" : "pass", errors, warnings, started);
  }
  finalize(decision: "pass" | "partial" | "fail", errors: string[], warnings: string[], started: number): DatabaseWorkerValidationReport { return { validationReportId: `dbw-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: errors.length ? "fail" : decision, errors, warnings, durationMs: Date.now() - started, metadataVersion: DBW_METADATA_VERSION }; }
}
export class HealthMonitor { status(decision: "pass" | "partial" | "fail", enabled: boolean) { return !enabled ? "standby" as const : decision === "fail" ? "failed" as const : decision === "partial" ? "degraded" as const : "healthy" as const; } }
export class RecoveryManager { private failures = 0; recordFailure() { this.failures += 1; } reset() { this.failures = 0; } getFailureCount() { return this.failures; } }
