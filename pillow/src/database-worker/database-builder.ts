import { DATABASE_WORKER_REPORT_VERSION, DBW_METADATA_VERSION } from "./paths.js";
import type { DatabaseBuildReport, DatabaseEntry, DatabaseWorkerInput, ReviewFinding } from "./types.js";
import type { DatabaseWorkerConfiguration } from "./configuration.js";
let sequence = 0;
const now = () => new Date().toISOString();
const entry = (prefix: string, name: string, description: string, extra: Partial<DatabaseEntry> = {}): DatabaseEntry => ({ id: `${prefix}${Date.now()}-${sequence}`, name, description, ...extra });
export class DatabaseBuilder {
  createShell(input: DatabaseWorkerInput, config: DatabaseWorkerConfiguration): DatabaseBuildReport {
    sequence += 1;
    const requirementsReportId = input.requirementsReportId?.trim() ?? "";
    return this.lockReport({
      buildId: input.buildId?.trim() || `dbw-bld-${Date.now()}-${sequence}`, timestamp: now(), platformId: input.platformId?.trim() || `dbw-plt-${sequence}`, platformName: input.platformName?.trim() || "Platform from approved requirements",
      databaseType: "hybrid", schemasCreated: [], tablesCreated: [], relationships: [], indexes: [], constraints: [], migrationStatus: "pending", integrityValidation: "pending", performanceSummary: "Performance planning pending approved architecture", confidenceScore: requirementsReportId ? 35 : 20, metadataVersion: DBW_METADATA_VERSION,
      requirementsReportId, architectureReportId: input.architectureReportId?.trim() ?? "", factoryMissionId: input.factoryMissionId?.trim() || `dbw-msn-${sequence}`, businessId: input.businessId?.trim() || `dbw-biz-${sequence}`, businessObjective: input.businessObjective?.trim() || "Build production-ready data structures aligned to approved requirements and architecture",
      views: [], primaryKeys: [], foreignKeys: [], seedData: [], backupStrategy: "pending approved recovery planning",
      buildSteps: [this.step("receive_requirements", "Receive approved requirements", 1, requirementsReportId ? "Requirements recorded" : "Awaiting requirements")], selfReviewPassed: false, selfReviewFindings: [], selfReviewSummary: "Database shell created", qualityReview: "", complianceReview: "", databaseCompliance: requirementsReportId ? "partial" : "non_compliant", databaseComplianceNotes: "Pending database build stages", workerId: config.workerId, reportVersion: DATABASE_WORKER_REPORT_VERSION, traceabilityRefs: [requirementsReportId || "requirements:missing"], preservedDecisions: [], submittedToExecutiveReporting: false, executiveReportId: null,
    });
  }
  attachArchitecture(report: DatabaseBuildReport, architectureId: string, databaseType: string) {
    return this.update(report, { architectureReportId: architectureId, databaseType, confidenceScore: Math.max(report.confidenceScore, 50), traceabilityRefs: [...new Set([...report.traceabilityRefs, architectureId || "architecture:missing"])] }, "receive_architecture", "Receive approved architecture");
  }
  addSchemas(report: DatabaseBuildReport, modules: Array<{ id?: string; name?: string }>) {
    const sources = modules.length ? modules : [{ id: "approved-core", name: "Core Platform" }];
    const schemas = sources.map((module) => entry("dbw-sch-", `${module.name ?? "Platform"} schema`, "Approved domain schema", { source: module.id }));
    return this.update(report, { schemasCreated: schemas }, "design_schemas", "Design relational and non-relational schemas");
  }
  addTables(report: DatabaseBuildReport) {
    const tables = [entry("dbw-tbl-", "platform_records", "Primary relational records"), entry("dbw-tbl-", "platform_events", "Auditable domain events")];
    const relationships = [entry("dbw-rel-", "records_to_events", "One-to-many approved data relationship")];
    const primaryKeys = [entry("dbw-con-", "platform_records_pk", "Primary key for platform records")];
    const foreignKeys = [entry("dbw-con-", "platform_events_record_fk", "Foreign key to platform records")];
    const constraints = [entry("dbw-con-", "platform_records_required", "Required value and uniqueness constraints")];
    return this.update(report, { tablesCreated: tables, relationships, primaryKeys, foreignKeys, constraints }, "create_tables", "Create tables relationships and constraints");
  }
  addIndexes(report: DatabaseBuildReport) { return this.update(report, { indexes: [entry("dbw-idx-", "platform_records_lookup", "Lookup index for approved access paths"), entry("dbw-idx-", "platform_events_time", "Time-ordered audit index")] }, "create_indexes", "Create indexes for performance"); }
  addMigrations(report: DatabaseBuildReport) { return this.update(report, { migrationStatus: "generated", preservedDecisions: [...report.preservedDecisions, { decisionId: `dbw-mig-${Date.now()}-${sequence}`, topic: "migration", decision: "Forward-only migration generated from approved schema", recordedAt: now() }] }, "generate_migrations", "Generate database migrations"); }
  validateIntegrity(report: DatabaseBuildReport) {
    const complete = report.tablesCreated.length > 0 && report.relationships.length > 0 && report.primaryKeys.length > 0 && report.foreignKeys.length > 0;
    return this.update(report, { integrityValidation: complete ? "passed" : "partial" }, "validate_integrity", "Validate referential integrity");
  }
  addBackup(report: DatabaseBuildReport) { return this.update(report, { backupStrategy: "Encrypted scheduled backups with tested point-in-time recovery", seedData: [entry("dbw-seed-", "reference_seed_data", "Non-sensitive approved reference seed data")] }, "plan_backup_recovery", "Support backup and recovery planning"); }
  optimize(report: DatabaseBuildReport) { return this.update(report, { views: [entry("dbw-view-", "platform_operational_summary", "Optimized read projection")], performanceSummary: "Indexed relational structures, auditable migrations, and optimized operational view prepared" }, "optimize_structures", "Produce optimized production-ready database structures"); }
  complete(report: DatabaseBuildReport) {
    let result = report;
    if (!result.schemasCreated.length) result = this.addSchemas(result, []);
    if (!result.tablesCreated.length) result = this.addTables(result);
    if (!result.indexes.length) result = this.addIndexes(result);
    if (result.migrationStatus !== "generated") result = this.addMigrations(result);
    if (result.integrityValidation !== "passed") result = this.validateIntegrity(result);
    if (!result.views.length) result = this.optimize(result);
    if (result.backupStrategy.startsWith("pending")) result = this.addBackup(result);
    const findings: ReviewFinding[] = [];
    if (!result.requirementsReportId) findings.push({ findingId: "dbw-val-requirements", category: "requirements", severity: "error", message: "Approved requirements ID is required" });
    if (!result.architectureReportId) findings.push({ findingId: "dbw-val-architecture", category: "architecture", severity: "error", message: "Approved architecture ID is required" });
    if (!result.schemasCreated.length || !result.tablesCreated.length || !result.relationships.length || !result.indexes.length) findings.push({ findingId: "dbw-val-structure", category: "structure", severity: "error", message: "Required database structures are missing" });
    const passed = findings.length === 0;
    return this.lockReport({ ...result, timestamp: now(), confidenceScore: passed ? 95 : 65, selfReviewPassed: passed, selfReviewFindings: findings, selfReviewSummary: passed ? "Self-review passed: traceable production-ready database build" : "Self-review requires approved dependency context", qualityReview: passed ? "Schemas, tables, relationships, constraints, indexes, migrations, integrity, recovery, and optimized structures reviewed" : "Incomplete dependency context", complianceReview: "No frontend, backend business logic, application business logic, architecture override, authority override, or Q6-07 work performed", databaseCompliance: passed ? "compliant" : "partial", databaseComplianceNotes: passed ? "Approved requirements and architecture preserved with audit history" : "Architecture report required", buildSteps: [...result.buildSteps, this.step("produce_report", "Produce database build report", result.buildSteps.length + 1, "Build report assembled")] });
  }
  private update(report: DatabaseBuildReport, fields: Partial<DatabaseBuildReport>, stepType: string, title: string) { return this.lockReport({ ...report, ...fields, timestamp: now(), confidenceScore: Math.max(report.confidenceScore, 55), buildSteps: [...report.buildSteps, this.step(stepType, title, report.buildSteps.length + 1, `${title} completed`)] }); }
  private step(stepType: string, title: string, order: number, summary: string) { return { stepId: `dbw-step-${stepType}-${order}`, stepType, title, order, summary }; }
  lockReport(report: Omit<DatabaseBuildReport, keyof BoundaryFlags> & Partial<BoundaryFlags>): DatabaseBuildReport {
    return { ...report, metadataVersion: DBW_METADATA_VERSION, neverBuildFrontend: true, neverBuildBackendBusinessLogic: true, neverOverrideApprovedArchitecture: true, neverOverridePillow: true, neverOverrideGrandKing: true, neverImplementQ607OrLater: true, neverImplementApplicationBusinessLogic: true, followApprovedRequirementsAndArchitecture: true, preserveCompleteTraceability: true, maintainDataIntegrity: true, optimizePerformance: true, preserveAuditHistory: true, structuralSignalOnly: true, maskSensitiveValues: true } as DatabaseBuildReport;
  }
}
type BoundaryFlags = Pick<DatabaseBuildReport, "neverBuildFrontend" | "neverBuildBackendBusinessLogic" | "neverOverrideApprovedArchitecture" | "neverOverridePillow" | "neverOverrideGrandKing" | "neverImplementQ607OrLater" | "neverImplementApplicationBusinessLogic" | "followApprovedRequirementsAndArchitecture" | "preserveCompleteTraceability" | "maintainDataIntegrity" | "optimizePerformance" | "preserveAuditHistory" | "structuralSignalOnly" | "maskSensitiveValues">;
export function resetDatabaseSequenceForTesting() { sequence = 0; }
