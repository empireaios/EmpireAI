import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FRONTEND_WORKER_IDENTITY, INTEGRATION_TARGETS, UI_COMPONENTS } from "./paths.js";
import type { FrontendBuildReport } from "./types.js";

export type FrontendWorkerConfiguration = {
  enabled: boolean; frontendRulesEnabled: boolean; validationRulesEnabled: boolean; executiveReportingEnabled: boolean;
  integrationTargets: string[]; supportedUiComponents: string[]; workerId: string; workerName: string; factory: string;
  department: string; role: string; reportingLine: string[]; seedFrontendBuildReports: FrontendBuildReport[]; timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverImplementBackendBusinessLogic: true; neverDesignDatabases: true; neverDeployApplications: true; neverOverridePillow: true; neverOverrideGrandKing: true; neverImplementQ605OrLater: true; followApprovedRequirementsAndArchitecture: true; preserveCompleteTraceability: true; buildReusableComponents: true; validateAccessibilityAndResponsiveness: true; preserveAuditHistory: true; structuralSignalOnly: true; maskSensitiveValues: true;
};
export const DEFAULT_FRONTEND_WORKER_CONFIGURATION: FrontendWorkerConfiguration = {
  enabled: true,
  frontendRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  supportedUiComponents: [...UI_COMPONENTS],
  workerId: FRONTEND_WORKER_IDENTITY.workerId,
  workerName: FRONTEND_WORKER_IDENTITY.workerName,
  factory: FRONTEND_WORKER_IDENTITY.factory,
  department: FRONTEND_WORKER_IDENTITY.department,
  role: FRONTEND_WORKER_IDENTITY.role,
  reportingLine: [...FRONTEND_WORKER_IDENTITY.reportingLine],
  seedFrontendBuildReports: [],
  timeoutMs: 5000,
  loggingLevel: "info",
  neverImplementBackendBusinessLogic: true,
  neverDesignDatabases: true,
  neverDeployApplications: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ605OrLater: true,
  followApprovedRequirementsAndArchitecture: true,
  preserveCompleteTraceability: true,
  buildReusableComponents: true,
  validateAccessibilityAndResponsiveness: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildFrontendWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<FrontendWorkerConfiguration> = {},
): FrontendWorkerConfiguration {
  let file: Partial<FrontendWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "frontend-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.FRONTEND_WORKER_TIMEOUT_MS ?? "", 10);
  return {
    ...DEFAULT_FRONTEND_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: [
      ...new Set([
        ...INTEGRATION_TARGETS,
        ...(file.integrationTargets ?? []),
        ...(overrides.integrationTargets ?? []),
      ]),
    ],
    supportedUiComponents: [
      ...new Set([
        ...UI_COMPONENTS,
        ...(file.supportedUiComponents ?? []),
        ...(overrides.supportedUiComponents ?? []),
      ]),
    ],
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_FRONTEND_WORKER_CONFIGURATION.reportingLine),
    ],
    seedFrontendBuildReports: [
      ...(overrides.seedFrontendBuildReports ?? file.seedFrontendBuildReports ?? []),
    ],
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    neverImplementBackendBusinessLogic: true,
    neverDesignDatabases: true,
    neverDeployApplications: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ605OrLater: true,
    followApprovedRequirementsAndArchitecture: true,
    preserveCompleteTraceability: true,
    buildReusableComponents: true,
    validateAccessibilityAndResponsiveness: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
