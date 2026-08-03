import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPROVED_SUPPLIER_APIS,
  APPROVED_SUPPLIER_PLATFORMS,
  DISCOVERY_CHANNELS,
  INTEGRATION_TARGETS,
  SDW_METADATA_VERSION,
  SUPPLIER_DISCOVERY_WORKER_IDENTITY,
} from "./paths.js";
import type { SupplierDiscoveryReport } from "./types.js";

export type SupplierDiscoveryWorkerConfiguration = {
  enabled: boolean;
  discoveryRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  approvedSupplierPlatforms: string[];
  approvedSupplierApis: string[];
  discoveryChannels: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedDiscoveries: SupplierDiscoveryReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-04 hard boundaries — force-locked true. */
  neverEvaluateSuppliers: true;
  neverNegotiateSuppliers: true;
  neverSelectSuppliers: true;
  neverPlaceOrders: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ305OrLater: true;
  useOnlyApprovedSupplierPlatformsAndApis: true;
  neverModifySupplierData: true;
  preserveSupplierTraceability: true;
  preserveAuditHistory: true;
  distinguishUnavailableFromMissing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SUPPLIER_DISCOVERY_WORKER_CONFIGURATION: SupplierDiscoveryWorkerConfiguration =
  {
    enabled: true,
    discoveryRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    approvedSupplierPlatforms: [...APPROVED_SUPPLIER_PLATFORMS],
    approvedSupplierApis: [...APPROVED_SUPPLIER_APIS],
    discoveryChannels: [...DISCOVERY_CHANNELS],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: SUPPLIER_DISCOVERY_WORKER_IDENTITY.workerId,
    workerName: SUPPLIER_DISCOVERY_WORKER_IDENTITY.workerName,
    factory: SUPPLIER_DISCOVERY_WORKER_IDENTITY.factory,
    department: SUPPLIER_DISCOVERY_WORKER_IDENTITY.department,
    role: SUPPLIER_DISCOVERY_WORKER_IDENTITY.role,
    reportingLine: [...SUPPLIER_DISCOVERY_WORKER_IDENTITY.reportingLine],
    seedDiscoveries: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverEvaluateSuppliers: true,
    neverNegotiateSuppliers: true,
    neverSelectSuppliers: true,
    neverPlaceOrders: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ305OrLater: true,
    useOnlyApprovedSupplierPlatformsAndApis: true,
    neverModifySupplierData: true,
    preserveSupplierTraceability: true,
    preserveAuditHistory: true,
    distinguishUnavailableFromMissing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildSupplierDiscoveryWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SupplierDiscoveryWorkerConfiguration> = {},
): SupplierDiscoveryWorkerConfiguration {
  let file: Partial<SupplierDiscoveryWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "supplier-discovery-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.SUPPLIER_DISCOVERY_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.SUPPLIER_DISCOVERY_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key:
      | "approvedSupplierPlatforms"
      | "approvedSupplierApis"
      | "discoveryChannels"
      | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_SUPPLIER_DISCOVERY_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_SUPPLIER_DISCOVERY_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    approvedSupplierPlatforms: mergeList("approvedSupplierPlatforms"),
    approvedSupplierApis: mergeList("approvedSupplierApis"),
    discoveryChannels: mergeList("discoveryChannels"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_SUPPLIER_DISCOVERY_WORKER_CONFIGURATION.reportingLine),
    ],
    seedDiscoveries: (overrides.seedDiscoveries ?? file.seedDiscoveries ?? []).map((d) =>
      lockDiscovery(d),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverEvaluateSuppliers: true,
    neverNegotiateSuppliers: true,
    neverSelectSuppliers: true,
    neverPlaceOrders: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ305OrLater: true,
    useOnlyApprovedSupplierPlatformsAndApis: true,
    neverModifySupplierData: true,
    preserveSupplierTraceability: true,
    preserveAuditHistory: true,
    distinguishUnavailableFromMissing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockDiscovery(discovery: SupplierDiscoveryReport): SupplierDiscoveryReport {
  return {
    ...discovery,
    fieldAvailability: { ...discovery.fieldAvailability },
    metadataVersion: discovery.metadataVersion || SDW_METADATA_VERSION,
    neverEvaluateSuppliers: true,
    neverNegotiateSuppliers: true,
    neverSelectSuppliers: true,
    neverPlaceOrders: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ305OrLater: true,
    neverModifySupplierData: true,
    preserveSupplierTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
