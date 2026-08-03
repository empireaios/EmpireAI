import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DATABASE_COMPONENTS, DATABASE_WORKER_IDENTITY, INTEGRATION_TARGETS } from "./paths.js";
import type { DatabaseBuildReport } from "./types.js";

export type DatabaseWorkerConfiguration = {
  enabled: boolean; databaseRulesEnabled: boolean; validationRulesEnabled: boolean; executiveReportingEnabled: boolean;
  integrationTargets: string[]; supportedDatabaseComponents: string[]; workerId: string; workerName: string; factory: string; department: string; role: string; reportingLine: string[];
  seedDatabaseBuildReports: DatabaseBuildReport[]; timeoutMs: number; loggingLevel: "error" | "warn" | "info" | "debug";
  neverBuildFrontend: true; neverBuildBackendBusinessLogic: true; neverOverrideApprovedArchitecture: true; neverOverridePillow: true; neverOverrideGrandKing: true; neverImplementQ607OrLater: true;
  neverImplementApplicationBusinessLogic: true; followApprovedRequirementsAndArchitecture: true; preserveCompleteTraceability: true; maintainDataIntegrity: true; optimizePerformance: true; preserveAuditHistory: true; structuralSignalOnly: true; maskSensitiveValues: true;
};
export const DEFAULT_DATABASE_WORKER_CONFIGURATION: DatabaseWorkerConfiguration = {
  enabled: true, databaseRulesEnabled: true, validationRulesEnabled: true, executiveReportingEnabled: true, integrationTargets: [...INTEGRATION_TARGETS], supportedDatabaseComponents: [...DATABASE_COMPONENTS],
  workerId: DATABASE_WORKER_IDENTITY.workerId, workerName: DATABASE_WORKER_IDENTITY.workerName, factory: DATABASE_WORKER_IDENTITY.factory, department: DATABASE_WORKER_IDENTITY.department, role: DATABASE_WORKER_IDENTITY.role, reportingLine: [...DATABASE_WORKER_IDENTITY.reportingLine], seedDatabaseBuildReports: [], timeoutMs: 5000, loggingLevel: "info",
  neverBuildFrontend: true, neverBuildBackendBusinessLogic: true, neverOverrideApprovedArchitecture: true, neverOverridePillow: true, neverOverrideGrandKing: true, neverImplementQ607OrLater: true,
  neverImplementApplicationBusinessLogic: true, followApprovedRequirementsAndArchitecture: true, preserveCompleteTraceability: true, maintainDataIntegrity: true, optimizePerformance: true, preserveAuditHistory: true, structuralSignalOnly: true, maskSensitiveValues: true,
};
export function buildDatabaseWorkerConfiguration(repositoryRoot?: string, overrides: Partial<DatabaseWorkerConfiguration> = {}): DatabaseWorkerConfiguration {
  let file: Partial<DatabaseWorkerConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "database-worker.config.json") : "";
  if (candidate && existsSync(candidate)) try { file = JSON.parse(readFileSync(candidate, "utf8")); } catch { /* defaults remain authoritative */ }
  const timeout = Number.parseInt(process.env.DATABASE_WORKER_TIMEOUT_MS ?? "", 10);
  return {
    ...DEFAULT_DATABASE_WORKER_CONFIGURATION, ...file, ...overrides,
    integrationTargets: [...new Set([...INTEGRATION_TARGETS, ...(file.integrationTargets ?? []), ...(overrides.integrationTargets ?? [])])],
    supportedDatabaseComponents: [...new Set([...DATABASE_COMPONENTS, ...(file.supportedDatabaseComponents ?? []), ...(overrides.supportedDatabaseComponents ?? [])])],
    reportingLine: [...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_DATABASE_WORKER_CONFIGURATION.reportingLine)],
    seedDatabaseBuildReports: [...(overrides.seedDatabaseBuildReports ?? file.seedDatabaseBuildReports ?? [])],
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    neverBuildFrontend: true, neverBuildBackendBusinessLogic: true, neverOverrideApprovedArchitecture: true, neverOverridePillow: true, neverOverrideGrandKing: true, neverImplementQ607OrLater: true,
    neverImplementApplicationBusinessLogic: true, followApprovedRequirementsAndArchitecture: true, preserveCompleteTraceability: true, maintainDataIntegrity: true, optimizePerformance: true, preserveAuditHistory: true, structuralSignalOnly: true, maskSensitiveValues: true,
  };
}
