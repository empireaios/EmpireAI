import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { WORKER_CATEGORIES, WORKER_STATES } from "./paths.js";

export type RegisteredWorker = {
  workerId: string;
  category: string;
  capabilities: string[];
  initialState: (typeof WORKER_STATES)[number];
};

export type WorkforceOrchestratorConfiguration = {
  enabled: boolean;
  discoveryRulesEnabled: boolean;
  selectionRulesEnabled: boolean;
  coordinationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  registeredWorkers: RegisteredWorker[];
  workerStates: string[];
  defaultCoordinationMode: "sequential" | "parallel";
  minWorkers: number;
  maxWorkers: number;
  defaultTimeoutMs: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-09 hard boundaries — force-locked true. */
  neverPerformWorkerTasks: true;
  neverReplaceWorkerLogic: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverPerformStrategicPlanning: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveOrchestrationTraceability: true;
  preserveAuditability: true;
  preserveOrchestrationIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_REGISTERED_WORKERS: RegisteredWorker[] = [
  {
    workerId: "pwo-wkr-strategy-01",
    category: "strategy",
    capabilities: ["intent_decomposition", "priority_framing", "option_synthesis"],
    initialState: "available",
  },
  {
    workerId: "pwo-wkr-product-01",
    category: "product",
    capabilities: ["requirements_structuring", "roadmap_alignment", "experience_definition"],
    initialState: "available",
  },
  {
    workerId: "pwo-wkr-engineering-01",
    category: "engineering",
    capabilities: ["implementation_planning", "integration_coordination", "technical_delivery"],
    initialState: "available",
  },
  {
    workerId: "pwo-wkr-operations-01",
    category: "operations",
    capabilities: ["process_coordination", "handoff_management", "runtime_monitoring"],
    initialState: "available",
  },
  {
    workerId: "pwo-wkr-finance-01",
    category: "finance",
    capabilities: ["cost_estimation", "budget_alignment", "value_tracking"],
    initialState: "available",
  },
  {
    workerId: "pwo-wkr-compliance-01",
    category: "compliance",
    capabilities: ["policy_checks", "governance_alignment", "risk_controls"],
    initialState: "available",
  },
  {
    workerId: "pwo-wkr-security-01",
    category: "security",
    capabilities: ["threat_review", "control_verification", "secure_handoff"],
    initialState: "available",
  },
  {
    workerId: "pwo-wkr-data-01",
    category: "data_intelligence",
    capabilities: ["signal_analysis", "metric_aggregation", "insight_packaging"],
    initialState: "available",
  },
  {
    workerId: "pwo-wkr-marketing-01",
    category: "marketing",
    capabilities: ["message_framing", "channel_planning", "campaign_coordination"],
    initialState: "available",
  },
  {
    workerId: "pwo-wkr-governance-01",
    category: "executive_governance",
    capabilities: ["escalation_routing", "approval_alignment", "executive_reporting"],
    initialState: "available",
  },
];

export const DEFAULT_WORKFORCE_ORCHESTRATOR_CONFIGURATION: WorkforceOrchestratorConfiguration = {
  enabled: true,
  discoveryRulesEnabled: true,
  selectionRulesEnabled: true,
  coordinationRulesEnabled: true,
  validationRulesEnabled: true,
  registeredWorkers: DEFAULT_REGISTERED_WORKERS.map((w) => ({
    ...w,
    capabilities: [...w.capabilities],
  })),
  workerStates: [...WORKER_STATES],
  defaultCoordinationMode: "sequential",
  minWorkers: 1,
  maxWorkers: 6,
  defaultTimeoutMs: 5000,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverPerformWorkerTasks: true,
  neverReplaceWorkerLogic: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverPerformStrategicPlanning: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveOrchestrationTraceability: true,
  preserveAuditability: true,
  preserveOrchestrationIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildWorkforceOrchestratorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkforceOrchestratorConfiguration> = {},
): WorkforceOrchestratorConfiguration {
  let file: Partial<WorkforceOrchestratorConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "workforce-orchestrator.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKFORCE_ORCHESTRATOR_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.WORKFORCE_ORCHESTRATOR_RETRY_ATTEMPTS ?? "", 10);
  const maxWorkers = Number.parseInt(process.env.WORKFORCE_ORCHESTRATOR_MAX_WORKERS ?? "", 10);

  const workers =
    overrides.registeredWorkers ??
    file.registeredWorkers ??
    DEFAULT_WORKFORCE_ORCHESTRATOR_CONFIGURATION.registeredWorkers.map((w) => ({
      ...w,
      capabilities: [...w.capabilities],
    }));

  const states = Array.from(
    new Set([
      ...DEFAULT_WORKFORCE_ORCHESTRATOR_CONFIGURATION.workerStates,
      ...(file.workerStates ?? []),
      ...(overrides.workerStates ?? []),
    ]),
  );

  return {
    ...DEFAULT_WORKFORCE_ORCHESTRATOR_CONFIGURATION,
    ...file,
    ...overrides,
    registeredWorkers: workers.map((w) => ({
      ...w,
      capabilities: [...w.capabilities],
      category: w.category || WORKER_CATEGORIES[0]!,
    })),
    workerStates: states,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout, defaultTimeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(maxWorkers) ? { maxWorkers } : {}),
    neverPerformWorkerTasks: true,
    neverReplaceWorkerLogic: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverPerformStrategicPlanning: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveOrchestrationTraceability: true,
    preserveAuditability: true,
    preserveOrchestrationIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
