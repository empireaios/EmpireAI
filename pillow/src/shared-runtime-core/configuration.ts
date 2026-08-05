import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FACTORY_KEYS,
  INTEGRATION_TARGETS,
  RUNTIME_SERVICES,
  SHARED_RUNTIME_CORE_IDENTITY,
  SRTC_METADATA_VERSION,
} from "./paths.js";
import type { FactoryRegistration, WorkerRegistration } from "./types.js";

export type SharedRuntimeCoreConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  registryRulesEnabled: boolean;
  routingRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  runtimeServices: string[];
  factoryKeys: string[];
  integrationTargets: string[];
  defaultFactories: FactoryRegistration[];
  seedWorkers: WorkerRegistration[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-01 hard boundaries — force-locked true. */
  neverReplaceFactoryLogic: true;
  neverReplaceWorkerLogic: true;
  neverExecuteBusinessSpecificDecisions: true;
  neverFabricateRuntimeState: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1002OrLater: true;
  preserveCompleteTraceability: true;
  preserveRuntimeHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_SHARED_RUNTIME_CORE_CONFIGURATION: SharedRuntimeCoreConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  registryRulesEnabled: true,
  routingRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  runtimeServices: [...RUNTIME_SERVICES],
  factoryKeys: [...FACTORY_KEYS],
  integrationTargets: [...INTEGRATION_TARGETS],
  defaultFactories: buildDefaultFactoryCatalog(),
  seedWorkers: buildDefaultSeedWorkers(),
  workerId: SHARED_RUNTIME_CORE_IDENTITY.workerId,
  workerName: SHARED_RUNTIME_CORE_IDENTITY.workerName,
  factory: SHARED_RUNTIME_CORE_IDENTITY.factory,
  department: SHARED_RUNTIME_CORE_IDENTITY.department,
  role: SHARED_RUNTIME_CORE_IDENTITY.role,
  reportingLine: [...SHARED_RUNTIME_CORE_IDENTITY.reportingLine],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverReplaceFactoryLogic: true,
  neverReplaceWorkerLogic: true,
  neverExecuteBusinessSpecificDecisions: true,
  neverFabricateRuntimeState: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ1002OrLater: true,
  preserveCompleteTraceability: true,
  preserveRuntimeHistory: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

function buildDefaultFactoryCatalog(): FactoryRegistration[] {
  const now = new Date().toISOString();
  return [
    { factoryKey: "workforce-os", factoryName: "Workforce (Q0/Q1)", series: "workforce", missionId: "Q0-01", registeredAt: now, healthStatus: "unknown", fabricated: false, evidencePresent: true },
    { factoryKey: "empire-builder-factory", factoryName: "Empire Builder", series: "Q2", missionId: "Q2-01", registeredAt: now, healthStatus: "unknown", fabricated: false, evidencePresent: true },
    { factoryKey: "commerce-factory", factoryName: "Commerce", series: "Q3", missionId: "Q3-01", registeredAt: now, healthStatus: "unknown", fabricated: false, evidencePresent: true },
    { factoryKey: "media-factory", factoryName: "Media", series: "Q4", missionId: "Q4-01", registeredAt: now, healthStatus: "unknown", fabricated: false, evidencePresent: true },
    { factoryKey: "digital-products-factory", factoryName: "Digital Products", series: "Q5", missionId: "Q5-01", registeredAt: now, healthStatus: "unknown", fabricated: false, evidencePresent: true },
    { factoryKey: "enterprise-platform-factory", factoryName: "Enterprise Platform", series: "Q6", missionId: "Q6-01", registeredAt: now, healthStatus: "unknown", fabricated: false, evidencePresent: true },
    { factoryKey: "local-business-factory", factoryName: "Local Business", series: "Q7", missionId: "Q7-01", registeredAt: now, healthStatus: "unknown", fabricated: false, evidencePresent: true },
    { factoryKey: "affiliate-factory", factoryName: "Affiliate", series: "Q8", missionId: "Q8-01", registeredAt: now, healthStatus: "unknown", fabricated: false, evidencePresent: true },
    { factoryKey: "capital-factory", factoryName: "Capital", series: "Q9", missionId: "Q9-01", registeredAt: now, healthStatus: "unknown", fabricated: false, evidencePresent: true },
  ];
}

function buildDefaultSeedWorkers(): WorkerRegistration[] {
  const now = new Date().toISOString();
  return [
    { workerId: "wkr-capital-factory-core-01", workerName: "Capital Factory Core", factoryKey: "capital-factory", missionId: "Q9-01", registeredAt: now, healthStatus: "unknown", fabricated: false, evidencePresent: true },
    { workerId: "wkr-affiliate-factory-core-01", workerName: "Affiliate Factory Core", factoryKey: "affiliate-factory", missionId: "Q8-01", registeredAt: now, healthStatus: "unknown", fabricated: false, evidencePresent: true },
    { workerId: "wkr-empire-builder-factory-core-01", workerName: "Empire Builder Factory Core", factoryKey: "empire-builder-factory", missionId: "Q2-01", registeredAt: now, healthStatus: "unknown", fabricated: false, evidencePresent: true },
  ];
}

export function buildSharedRuntimeCoreConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SharedRuntimeCoreConfiguration> = {},
): SharedRuntimeCoreConfiguration {
  let file: Partial<SharedRuntimeCoreConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "shared-runtime-core.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.SHARED_RUNTIME_CORE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.SHARED_RUNTIME_CORE_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (
    key: "runtimeServices" | "factoryKeys" | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_SHARED_RUNTIME_CORE_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_SHARED_RUNTIME_CORE_CONFIGURATION,
    ...file,
    ...overrides,
    runtimeServices: mergeList("runtimeServices"),
    factoryKeys: mergeList("factoryKeys"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_SHARED_RUNTIME_CORE_CONFIGURATION.reportingLine),
    ],
    defaultFactories: (overrides.defaultFactories ?? file.defaultFactories ?? DEFAULT_SHARED_RUNTIME_CORE_CONFIGURATION.defaultFactories).map(lockFactory),
    seedWorkers: (overrides.seedWorkers ?? file.seedWorkers ?? DEFAULT_SHARED_RUNTIME_CORE_CONFIGURATION.seedWorkers).map(lockWorker),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverReplaceFactoryLogic: true,
    neverReplaceWorkerLogic: true,
    neverExecuteBusinessSpecificDecisions: true,
    neverFabricateRuntimeState: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ1002OrLater: true,
    preserveCompleteTraceability: true,
    preserveRuntimeHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockFactory(factory: FactoryRegistration): FactoryRegistration {
  return {
    ...factory,
    metadataVersion: factory.metadataVersion || SRTC_METADATA_VERSION,
    fabricated: false,
    neverReplaceFactoryLogic: true,
    neverReplaceWorkerLogic: true,
    neverExecuteBusinessSpecificDecisions: true,
    neverFabricateRuntimeState: true,
    neverImplementQ1002OrLater: true,
    structuralSignalOnly: true,
  };
}

function lockWorker(worker: WorkerRegistration): WorkerRegistration {
  return {
    ...worker,
    metadataVersion: worker.metadataVersion || SRTC_METADATA_VERSION,
    fabricated: false,
    neverReplaceFactoryLogic: true,
    neverReplaceWorkerLogic: true,
    neverExecuteBusinessSpecificDecisions: true,
    neverFabricateRuntimeState: true,
    neverImplementQ1002OrLater: true,
    structuralSignalOnly: true,
  };
}
