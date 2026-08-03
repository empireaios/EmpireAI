import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EXECUTIVE_COMMAND_TYPES, ROUTED_SERVICES } from "./paths.js";
import type {
  ApprovalView,
  BusinessStateView,
  ExecutiveCommandRecord,
  ExecutiveReportView,
  MemoryView,
  RegisteredMission,
  RegisteredTool,
  RegisteredWorker,
} from "./types.js";

export type ExecutiveCommandCenterConfiguration = {
  enabled: boolean;
  routingRulesEnabled: boolean;
  aggregationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  commandTypes: string[];
  routedServices: string[];
  seedWorkers: RegisteredWorker[];
  seedTools: RegisteredTool[];
  seedMissions: RegisteredMission[];
  seedBusinessStates: BusinessStateView[];
  seedApprovals: ApprovalView[];
  seedExecutionMemory: MemoryView[];
  seedDecisionMemory: MemoryView[];
  seedExecutiveReports: ExecutiveReportView[];
  seedCommands: ExecutiveCommandRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-18 hard boundaries — force-locked true. */
  neverExecuteWorkerLogic: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplaceWorkers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveCommandTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_WORKERS: RegisteredWorker[] = [
  { workerId: "wcr-wkr-strategy-01", department: "strategy", status: "available" },
  { workerId: "wcr-wkr-ops-02", department: "operations", status: "busy" },
  { workerId: "wcr-wkr-support-03", department: "operations", status: "available" },
];

export const DEFAULT_SEED_TOOLS: RegisteredTool[] = [
  { toolId: "tool-router-str", name: "Skill Tool Router", approved: true },
  { toolId: "tool-audit-exa", name: "Executive Audit Probe", approved: true },
  { toolId: "tool-draft-unapproved", name: "Draft Experimental Tool", approved: false },
];

export const DEFAULT_SEED_MISSIONS: RegisteredMission[] = [
  { missionId: "Q0-16", title: "Decision Memory", status: "completed" },
  { missionId: "Q0-17", title: "Adaptive Workforce Optimizer", status: "completed" },
  { missionId: "Q0-18", title: "Pillow Executive Command Center", status: "active" },
];

export const DEFAULT_SEED_BUSINESS_STATES: BusinessStateView[] = [
  { businessId: "biz-marketplace-alpha", state: "operating", health: "healthy" },
  { businessId: "biz-finance-beta", state: "operating", health: "degraded" },
];

export const DEFAULT_SEED_APPROVALS: ApprovalView[] = [
  { approvalId: "apr-001", status: "approved", subject: "phased_marketplace_expansion" },
  { approvalId: "apr-002", status: "pending", subject: "budget_reallocation" },
];

export const DEFAULT_SEED_EXECUTION_MEMORY: MemoryView[] = [
  {
    memoryId: "exm-001",
    kind: "execution",
    summary: "Marketplace routing dry-run completed without worker execution",
  },
];

export const DEFAULT_SEED_DECISION_MEMORY: MemoryView[] = [
  {
    memoryId: "dmem-001",
    kind: "decision",
    summary: "Adopted phased marketplace expansion with compliance gates",
  },
];

export const DEFAULT_SEED_EXECUTIVE_REPORTS: ExecutiveReportView[] = [
  {
    reportId: "rpt-workforce-01",
    title: "Workforce Utilization Snapshot",
    generatedAt: "2026-07-24T08:00:00.000Z",
  },
  {
    reportId: "rpt-approvals-01",
    title: "Pending Approvals Digest",
    generatedAt: "2026-07-24T09:00:00.000Z",
  },
];

export const DEFAULT_SEED_COMMANDS: ExecutiveCommandRecord[] = [];

export const DEFAULT_EXECUTIVE_COMMAND_CENTER_CONFIGURATION: ExecutiveCommandCenterConfiguration = {
  enabled: true,
  routingRulesEnabled: true,
  aggregationRulesEnabled: true,
  validationRulesEnabled: true,
  commandTypes: [...EXECUTIVE_COMMAND_TYPES],
  routedServices: [...ROUTED_SERVICES],
  seedWorkers: DEFAULT_SEED_WORKERS.map((w) => ({ ...w })),
  seedTools: DEFAULT_SEED_TOOLS.map((t) => ({ ...t })),
  seedMissions: DEFAULT_SEED_MISSIONS.map((m) => ({ ...m })),
  seedBusinessStates: DEFAULT_SEED_BUSINESS_STATES.map((b) => ({ ...b })),
  seedApprovals: DEFAULT_SEED_APPROVALS.map((a) => ({ ...a })),
  seedExecutionMemory: DEFAULT_SEED_EXECUTION_MEMORY.map((m) => ({ ...m })),
  seedDecisionMemory: DEFAULT_SEED_DECISION_MEMORY.map((m) => ({ ...m })),
  seedExecutiveReports: DEFAULT_SEED_EXECUTIVE_REPORTS.map((r) => ({ ...r })),
  seedCommands: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerLogic: true,
  neverReplaceWorkforceOrchestrator: true,
  neverReplaceWorkers: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveCommandTraceability: true,
  preserveAuditability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildExecutiveCommandCenterConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutiveCommandCenterConfiguration> = {},
): ExecutiveCommandCenterConfiguration {
  let file: Partial<ExecutiveCommandCenterConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "executive-command-center.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.EXECUTIVE_COMMAND_CENTER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.EXECUTIVE_COMMAND_CENTER_RETRY_ATTEMPTS ?? "", 10);

  const mergedCommandTypes = Array.from(
    new Set([
      ...DEFAULT_EXECUTIVE_COMMAND_CENTER_CONFIGURATION.commandTypes,
      ...(file.commandTypes ?? []),
      ...(overrides.commandTypes ?? []),
    ]),
  );
  const mergedServices = Array.from(
    new Set([
      ...DEFAULT_EXECUTIVE_COMMAND_CENTER_CONFIGURATION.routedServices,
      ...(file.routedServices ?? []),
      ...(overrides.routedServices ?? []),
    ]),
  );

  return {
    ...DEFAULT_EXECUTIVE_COMMAND_CENTER_CONFIGURATION,
    ...file,
    ...overrides,
    commandTypes: mergedCommandTypes,
    routedServices: mergedServices,
    seedWorkers: (overrides.seedWorkers ?? file.seedWorkers ?? DEFAULT_SEED_WORKERS).map((w) => ({
      ...w,
    })),
    seedTools: (overrides.seedTools ?? file.seedTools ?? DEFAULT_SEED_TOOLS).map((t) => ({ ...t })),
    seedMissions: (overrides.seedMissions ?? file.seedMissions ?? DEFAULT_SEED_MISSIONS).map(
      (m) => ({ ...m }),
    ),
    seedBusinessStates: (
      overrides.seedBusinessStates ??
      file.seedBusinessStates ??
      DEFAULT_SEED_BUSINESS_STATES
    ).map((b) => ({ ...b })),
    seedApprovals: (overrides.seedApprovals ?? file.seedApprovals ?? DEFAULT_SEED_APPROVALS).map(
      (a) => ({ ...a }),
    ),
    seedExecutionMemory: (
      overrides.seedExecutionMemory ??
      file.seedExecutionMemory ??
      DEFAULT_SEED_EXECUTION_MEMORY
    ).map((m) => ({ ...m })),
    seedDecisionMemory: (
      overrides.seedDecisionMemory ??
      file.seedDecisionMemory ??
      DEFAULT_SEED_DECISION_MEMORY
    ).map((m) => ({ ...m })),
    seedExecutiveReports: (
      overrides.seedExecutiveReports ??
      file.seedExecutiveReports ??
      DEFAULT_SEED_EXECUTIVE_REPORTS
    ).map((r) => ({ ...r })),
    seedCommands: (overrides.seedCommands ?? file.seedCommands ?? []).map((c) => ({
      ...c,
      relatedWorkers: [...c.relatedWorkers],
      relatedTools: [...c.relatedTools],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerLogic: true,
    neverReplaceWorkforceOrchestrator: true,
    neverReplaceWorkers: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveCommandTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
