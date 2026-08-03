import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { WORKFORCE_OS_SERVICES } from "./paths.js";
import type {
  RegisteredDepartment,
  RegisteredFactory,
  RegisteredMission,
  RegisteredWorker,
  WorkforceOsRecord,
} from "./types.js";

export type WorkforceOperatingSystemConfiguration = {
  enabled: boolean;
  registrationRulesEnabled: boolean;
  sessionRulesEnabled: boolean;
  communicationRulesEnabled: boolean;
  synchronizationRulesEnabled: boolean;
  monitoringRulesEnabled: boolean;
  recoveryRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  services: string[];
  seedDepartments: RegisteredDepartment[];
  seedFactories: RegisteredFactory[];
  seedWorkers: RegisteredWorker[];
  seedMissions: RegisteredMission[];
  seedRecords: WorkforceOsRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-19 hard boundaries — force-locked true. */
  neverReplacePillow: true;
  neverReplaceWorkforceOrchestrator: true;
  neverExecuteWorkerTasks: true;
  neverMakeStrategicDecisions: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveRuntimeTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_DEPARTMENTS: RegisteredDepartment[] = [
  { departmentId: "dept-strategy", name: "Strategy", status: "active" },
  { departmentId: "dept-operations", name: "Operations", status: "active" },
];

export const DEFAULT_SEED_FACTORIES: RegisteredFactory[] = [
  {
    factoryId: "fac-exec-intel",
    name: "Executive Intelligence Factory",
    departmentId: "dept-strategy",
    status: "active",
  },
  {
    factoryId: "fac-ops-runtime",
    name: "Operations Runtime Factory",
    departmentId: "dept-operations",
    status: "active",
  },
];

export const DEFAULT_SEED_WORKERS: RegisteredWorker[] = [
  {
    workerId: "wcr-wkr-strategy-01",
    departmentId: "dept-strategy",
    factoryId: "fac-exec-intel",
    lifecycle: "active",
  },
  {
    workerId: "wcr-wkr-ops-02",
    departmentId: "dept-operations",
    factoryId: "fac-ops-runtime",
    lifecycle: "registered",
  },
];

export const DEFAULT_SEED_MISSIONS: RegisteredMission[] = [
  { missionId: "Q0-18", title: "Pillow Executive Command Center", status: "completed" },
  { missionId: "Q0-19", title: "Workforce Operating System", status: "active" },
];

export const DEFAULT_SEED_RECORDS: WorkforceOsRecord[] = [];

export const DEFAULT_WORKFORCE_OPERATING_SYSTEM_CONFIGURATION: WorkforceOperatingSystemConfiguration =
  {
    enabled: true,
    registrationRulesEnabled: true,
    sessionRulesEnabled: true,
    communicationRulesEnabled: true,
    synchronizationRulesEnabled: true,
    monitoringRulesEnabled: true,
    recoveryRulesEnabled: true,
    validationRulesEnabled: true,
    services: [...WORKFORCE_OS_SERVICES],
    seedDepartments: DEFAULT_SEED_DEPARTMENTS.map((d) => ({ ...d })),
    seedFactories: DEFAULT_SEED_FACTORIES.map((f) => ({ ...f })),
    seedWorkers: DEFAULT_SEED_WORKERS.map((w) => ({ ...w })),
    seedMissions: DEFAULT_SEED_MISSIONS.map((m) => ({ ...m })),
    seedRecords: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverReplacePillow: true,
    neverReplaceWorkforceOrchestrator: true,
    neverExecuteWorkerTasks: true,
    neverMakeStrategicDecisions: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveRuntimeTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildWorkforceOperatingSystemConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkforceOperatingSystemConfiguration> = {},
): WorkforceOperatingSystemConfiguration {
  let file: Partial<WorkforceOperatingSystemConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "workforce-operating-system.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKFORCE_OPERATING_SYSTEM_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.WORKFORCE_OPERATING_SYSTEM_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergedServices = Array.from(
    new Set([
      ...DEFAULT_WORKFORCE_OPERATING_SYSTEM_CONFIGURATION.services,
      ...(file.services ?? []),
      ...(overrides.services ?? []),
    ]),
  );

  return {
    ...DEFAULT_WORKFORCE_OPERATING_SYSTEM_CONFIGURATION,
    ...file,
    ...overrides,
    services: mergedServices,
    seedDepartments: (
      overrides.seedDepartments ??
      file.seedDepartments ??
      DEFAULT_SEED_DEPARTMENTS
    ).map((d) => ({ ...d })),
    seedFactories: (overrides.seedFactories ?? file.seedFactories ?? DEFAULT_SEED_FACTORIES).map(
      (f) => ({ ...f }),
    ),
    seedWorkers: (overrides.seedWorkers ?? file.seedWorkers ?? DEFAULT_SEED_WORKERS).map((w) => ({
      ...w,
    })),
    seedMissions: (overrides.seedMissions ?? file.seedMissions ?? DEFAULT_SEED_MISSIONS).map(
      (m) => ({ ...m }),
    ),
    seedRecords: (overrides.seedRecords ?? file.seedRecords ?? []).map((r) => ({
      ...r,
      activeDepartments: [...r.activeDepartments],
      activeFactories: [...r.activeFactories],
      activeWorkers: [...r.activeWorkers],
      activeMissions: [...r.activeMissions],
      runtimeEvents: r.runtimeEvents.map((e) => ({ ...e })),
      openSessions: [...r.openSessions],
      servicesInvoked: [...r.servicesInvoked],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverReplacePillow: true,
    neverReplaceWorkforceOrchestrator: true,
    neverExecuteWorkerTasks: true,
    neverMakeStrategicDecisions: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveRuntimeTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
