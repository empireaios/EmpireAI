import type { DatabaseWorkerConfiguration } from "./configuration.js";
import type { DatabaseWorkerDependencies } from "./integrations.js";
import { DatabaseManager } from "./database-manager.js";
import type { DatabaseWorkerInput, DatabaseWorkerRunReport, DbwEngineStatus } from "./types.js";
export class DatabaseWorkerController {
  private status: DbwEngineStatus = "idle";
  private latest: DatabaseWorkerRunReport | null = null;
  constructor(private readonly manager: DatabaseManager, private readonly config: DatabaseWorkerConfiguration) {}
  initialize() { this.manager.ensureSeeded(this.config); this.status = "active"; }
  bindIntegrations(deps: DatabaseWorkerDependencies = {}) { this.manager.bindIntegrations(deps); }
  getStatus() { return this.status; } getManager() { return this.manager; } getConfiguration() { return structuredClone(this.config); } getLatestReport() { return this.latest; }
  connect(input: Record<string, unknown> = {}) { this.status = "connecting"; return this.finish(this.manager.connect(input, this.config)); }
  receiveApprovedRequirementsReports(input: DatabaseWorkerInput = {}) { this.status = "receiving_requirements"; return this.finish(this.manager.receiveApprovedRequirementsReports(input, this.config)); }
  receiveApprovedRequirementsReport(input: DatabaseWorkerInput = {}) { return this.receiveApprovedRequirementsReports(input); }
  receiveApprovedArchitectureReports(input: DatabaseWorkerInput = {}) { this.status = "receiving_architecture"; return this.finish(this.manager.receiveApprovedArchitectureReports(input, this.config)); }
  receiveApprovedArchitectureReport(input: DatabaseWorkerInput = {}) { return this.receiveApprovedArchitectureReports(input); }
  designRelationalAndNonRelationalSchemas(input: DatabaseWorkerInput = {}) { return this.finish(this.manager.designRelationalAndNonRelationalSchemas(input, this.config)); }
  createTablesRelationshipsAndConstraints(input: DatabaseWorkerInput = {}) { return this.finish(this.manager.createTablesRelationshipsAndConstraints(input, this.config)); }
  createIndexesForPerformance(input: DatabaseWorkerInput = {}) { return this.finish(this.manager.createIndexesForPerformance(input, this.config)); }
  generateDatabaseMigrations(input: DatabaseWorkerInput = {}) { return this.finish(this.manager.generateDatabaseMigrations(input, this.config)); }
  validateReferentialIntegrity(input: DatabaseWorkerInput = {}) { return this.finish(this.manager.validateReferentialIntegrity(input, this.config)); }
  supportBackupAndRecoveryPlanning(input: DatabaseWorkerInput = {}) { return this.finish(this.manager.supportBackupAndRecoveryPlanning(input, this.config)); }
  produceOptimizedProductionReadyDatabaseStructures(input: DatabaseWorkerInput = {}) { return this.finish(this.manager.produceOptimizedProductionReadyDatabaseStructures(input, this.config)); }
  produceDatabaseBuildReport(input: DatabaseWorkerInput = {}) { return this.finish(this.manager.produceDatabaseBuildReport(input, this.config)); }
  submitReport(input: DatabaseWorkerInput = {}) { return this.finish(this.manager.submitReport(input, this.config)); }
  list() { return this.finish(this.manager.list(this.config)); } validate(input: DatabaseWorkerInput = {}) { return this.finish(this.manager.validate(input, this.config)); } diagnostics() { return this.finish(this.manager.diagnostics(this.config)); }
  private finish(report: DatabaseWorkerRunReport) { this.latest = report; this.status = report.validation.decision === "fail" ? "failed" : "active"; return report; }
}
