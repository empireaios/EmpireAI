import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EXECUTIVE_ACTIONS, WORKER_RUNTIME_STATUSES } from "./paths.js";
import type { AccessibleWorker } from "./types.js";

export type WorkforceAccessManagerConfiguration = {
  enabled: boolean;
  accessRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  supportedActions: string[];
  workerDirectory: AccessibleWorker[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-11 hard boundaries — force-locked true. */
  neverExecuteWorkerLogic: true;
  neverReplaceWorkerImplementations: true;
  neverPerformOrchestration: true;
  neverMakeStrategicDecisions: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveAccessTraceability: true;
  preserveAuditability: true;
  preserveAccessIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_WORKER_DIRECTORY: AccessibleWorker[] = [
  {
    workerId: "wcr-wkr-strategy-01",
    workerName: "Strategy Specialist",
    department: "strategy",
    capabilities: ["intent_decomposition", "priority_framing", "option_synthesis"],
    runtimeStatus: "available",
    connectedToPillow: false,
  },
  {
    workerId: "wcr-wkr-engineering-01",
    workerName: "Engineering Specialist",
    department: "engineering",
    capabilities: ["implementation_planning", "integration_coordination", "technical_delivery"],
    runtimeStatus: "available",
    connectedToPillow: false,
  },
  {
    workerId: "wcr-wkr-product-01",
    workerName: "Product Specialist",
    department: "product",
    capabilities: ["requirements_structuring", "roadmap_alignment", "experience_definition"],
    runtimeStatus: "available",
    connectedToPillow: false,
  },
  {
    workerId: "wcr-wkr-operations-01",
    workerName: "Operations Coordinator",
    department: "operations",
    capabilities: ["process_coordination", "handoff_management", "runtime_monitoring"],
    runtimeStatus: "available",
    connectedToPillow: false,
  },
  {
    workerId: "wcr-wkr-compliance-01",
    workerName: "Compliance Reviewer",
    department: "compliance",
    capabilities: ["policy_checks", "governance_alignment", "risk_controls"],
    runtimeStatus: "available",
    connectedToPillow: false,
  },
  {
    workerId: "wcr-wkr-security-01",
    workerName: "Security Specialist",
    department: "security",
    capabilities: ["threat_review", "control_verification", "secure_handoff"],
    runtimeStatus: "available",
    connectedToPillow: false,
  },
  {
    workerId: "wcr-wkr-finance-01",
    workerName: "Finance Analyst",
    department: "finance",
    capabilities: ["cost_estimation", "budget_alignment", "value_tracking"],
    runtimeStatus: "available",
    connectedToPillow: false,
  },
  {
    workerId: "wcr-wkr-data-01",
    workerName: "Data Intelligence Operator",
    department: "data_intelligence",
    capabilities: ["signal_analysis", "metric_aggregation", "insight_packaging"],
    runtimeStatus: "available",
    connectedToPillow: false,
  },
];

export const DEFAULT_WORKFORCE_ACCESS_MANAGER_CONFIGURATION: WorkforceAccessManagerConfiguration = {
  enabled: true,
  accessRulesEnabled: true,
  validationRulesEnabled: true,
  supportedActions: [...EXECUTIVE_ACTIONS],
  workerDirectory: DEFAULT_WORKER_DIRECTORY.map((w) => ({
    ...w,
    capabilities: [...w.capabilities],
  })),
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerLogic: true,
  neverReplaceWorkerImplementations: true,
  neverPerformOrchestration: true,
  neverMakeStrategicDecisions: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveAccessTraceability: true,
  preserveAuditability: true,
  preserveAccessIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildWorkforceAccessManagerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkforceAccessManagerConfiguration> = {},
): WorkforceAccessManagerConfiguration {
  let file: Partial<WorkforceAccessManagerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "workforce-access-manager.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKFORCE_ACCESS_MANAGER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.WORKFORCE_ACCESS_MANAGER_RETRY_ATTEMPTS ?? "", 10);

  const mergedActions = Array.from(
    new Set([
      ...DEFAULT_WORKFORCE_ACCESS_MANAGER_CONFIGURATION.supportedActions,
      ...(file.supportedActions ?? []),
      ...(overrides.supportedActions ?? []),
    ]),
  );

  const workers =
    overrides.workerDirectory ??
    file.workerDirectory ??
    DEFAULT_WORKFORCE_ACCESS_MANAGER_CONFIGURATION.workerDirectory.map((w) => ({
      ...w,
      capabilities: [...w.capabilities],
    }));

  return {
    ...DEFAULT_WORKFORCE_ACCESS_MANAGER_CONFIGURATION,
    ...file,
    ...overrides,
    supportedActions: mergedActions,
    workerDirectory: workers.map((w) => ({
      ...w,
      capabilities: [...w.capabilities],
      runtimeStatus: (WORKER_RUNTIME_STATUSES as readonly string[]).includes(w.runtimeStatus)
        ? w.runtimeStatus
        : "available",
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerLogic: true,
    neverReplaceWorkerImplementations: true,
    neverPerformOrchestration: true,
    neverMakeStrategicDecisions: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveAccessTraceability: true,
    preserveAuditability: true,
    preserveAccessIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
