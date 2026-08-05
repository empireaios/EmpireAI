import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  API_RUNTIME_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";

export type ApiRuntimeConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  apiRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  defaultMaxRetries: number;
  defaultTimeoutMs: number;
  defaultBackoffMs: number;
  maxRequestsPerWindow: number;
  rateLimitWindowMs: number;
  circuitFailureThreshold: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-06 hard boundaries — force-locked true. */
  neverExposeSecrets: true;
  neverExposeCredentials: true;
  neverFabricateApiResponses: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1007OrLater: true;
  preserveCompleteTraceability: true;
  preserveRequestTraces: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  credentialReferenceOnly: true;
};

export const DEFAULT_API_RUNTIME_CONFIGURATION: ApiRuntimeConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  apiRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: API_RUNTIME_IDENTITY.workerId,
  workerName: API_RUNTIME_IDENTITY.workerName,
  factory: API_RUNTIME_IDENTITY.factory,
  department: API_RUNTIME_IDENTITY.department,
  role: API_RUNTIME_IDENTITY.role,
  reportingLine: [...API_RUNTIME_IDENTITY.reportingLine],
  defaultMaxRetries: 3,
  defaultTimeoutMs: 5000,
  defaultBackoffMs: 100,
  maxRequestsPerWindow: 5,
  rateLimitWindowMs: 60000,
  circuitFailureThreshold: 3,
  loggingLevel: "info",
  neverExposeSecrets: true,
  neverExposeCredentials: true,
  neverFabricateApiResponses: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1007OrLater: true,
  preserveCompleteTraceability: true,
  preserveRequestTraces: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  credentialReferenceOnly: true,
};

export function buildApiRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ApiRuntimeConfiguration> = {},
): ApiRuntimeConfiguration {
  let file: Partial<ApiRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "api-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.API_RUNTIME_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.API_RUNTIME_DEFAULT_MAX_RETRIES ?? "", 10);
  const maxReq = Number.parseInt(process.env.API_RUNTIME_MAX_REQUESTS_PER_WINDOW ?? "", 10);
  const windowMs = Number.parseInt(process.env.API_RUNTIME_RATE_LIMIT_WINDOW_MS ?? "", 10);

  const mergeList = () =>
    Array.from(
      new Set([
        ...DEFAULT_API_RUNTIME_CONFIGURATION.integrationTargets,
        ...(file.integrationTargets ?? []),
        ...(overrides.integrationTargets ?? []),
      ]),
    );

  return {
    ...DEFAULT_API_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList(),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_API_RUNTIME_CONFIGURATION.reportingLine),
    ],
    ...(Number.isFinite(timeout) ? { defaultTimeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { defaultMaxRetries: retries } : {}),
    ...(Number.isFinite(maxReq) ? { maxRequestsPerWindow: maxReq } : {}),
    ...(Number.isFinite(windowMs) ? { rateLimitWindowMs: windowMs } : {}),
    neverExposeSecrets: true,
    neverExposeCredentials: true,
    neverFabricateApiResponses: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1007OrLater: true,
    preserveCompleteTraceability: true,
    preserveRequestTraces: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    credentialReferenceOnly: true,
  };
}
