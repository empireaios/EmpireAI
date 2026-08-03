import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REASONING_MODES } from "./paths.js";
import type { ReasoningParticipant } from "./types.js";

export type CollectiveReasoningEngineConfiguration = {
  enabled: boolean;
  reasoningRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  supportedModes: string[];
  expertCatalog: ReasoningParticipant[];
  expertiseKeywords: Record<string, string[]>;
  defaultPanelSize: number;
  minPanelSize: number;
  maxPanelSize: number;
  consensusThreshold: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-13 hard boundaries — force-locked true. */
  neverExecuteWork: true;
  neverAssignWorkersPermanently: true;
  neverReplacePillow: true;
  neverOverrideGrandKing: true;
  neverApproveActions: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveReasoningTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

/** WCR-aligned reasoning panel catalog. */
export const DEFAULT_EXPERT_CATALOG: ReasoningParticipant[] = [
  {
    workerId: "wcr-wkr-strategy-01",
    workerName: "Strategy Specialist",
    expertise: ["strategy", "priority", "option_framing", "intent"],
    stanceBias: "supportive",
    authorityWeight: 70,
  },
  {
    workerId: "wcr-wkr-engineering-01",
    workerName: "Engineering Specialist",
    expertise: ["engineering", "implementation", "integration", "technical"],
    stanceBias: "neutral",
    authorityWeight: 65,
  },
  {
    workerId: "wcr-wkr-product-01",
    workerName: "Product Specialist",
    expertise: ["product", "requirements", "roadmap", "experience"],
    stanceBias: "supportive",
    authorityWeight: 60,
  },
  {
    workerId: "wcr-wkr-operations-01",
    workerName: "Operations Coordinator",
    expertise: ["operations", "coordination", "runtime", "handoff"],
    stanceBias: "neutral",
    authorityWeight: 55,
  },
  {
    workerId: "wcr-wkr-compliance-01",
    workerName: "Compliance Reviewer",
    expertise: ["compliance", "policy", "governance", "risk_controls"],
    stanceBias: "challenging",
    authorityWeight: 85,
  },
  {
    workerId: "wcr-wkr-security-01",
    workerName: "Security Specialist",
    expertise: ["security", "threat", "controls", "secure_handoff"],
    stanceBias: "challenging",
    authorityWeight: 90,
  },
  {
    workerId: "wcr-wkr-finance-01",
    workerName: "Finance Analyst",
    expertise: ["finance", "cost", "budget", "value"],
    stanceBias: "challenging",
    authorityWeight: 70,
  },
  {
    workerId: "wcr-wkr-data-01",
    workerName: "Data Intelligence Operator",
    expertise: ["data", "metrics", "signals", "insights"],
    stanceBias: "neutral",
    authorityWeight: 55,
  },
];

export const DEFAULT_EXPERTISE_KEYWORDS: Record<string, string[]> = {
  strategy: ["strategy", "priority", "option", "direction", "intent"],
  engineering: ["engineering", "implement", "build", "technical", "integrate", "code"],
  product: ["product", "requirement", "roadmap", "experience", "user"],
  operations: ["operations", "coordinate", "runtime", "handoff", "process"],
  compliance: ["compliance", "policy", "governance", "audit", "regulation"],
  security: ["security", "threat", "vulnerability", "secure", "breach"],
  finance: ["finance", "cost", "budget", "spend", "roi", "value"],
  data: ["data", "metric", "signal", "insight", "analytics"],
};

export const DEFAULT_COLLECTIVE_REASONING_ENGINE_CONFIGURATION: CollectiveReasoningEngineConfiguration = {
  enabled: true,
  reasoningRulesEnabled: true,
  validationRulesEnabled: true,
  supportedModes: [...REASONING_MODES],
  expertCatalog: DEFAULT_EXPERT_CATALOG.map((p) => ({
    ...p,
    expertise: [...p.expertise],
  })),
  expertiseKeywords: { ...DEFAULT_EXPERTISE_KEYWORDS },
  defaultPanelSize: 4,
  minPanelSize: 2,
  maxPanelSize: 6,
  consensusThreshold: 0.6,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWork: true,
  neverAssignWorkersPermanently: true,
  neverReplacePillow: true,
  neverOverrideGrandKing: true,
  neverApproveActions: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveReasoningTraceability: true,
  preserveAuditability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildCollectiveReasoningEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CollectiveReasoningEngineConfiguration> = {},
): CollectiveReasoningEngineConfiguration {
  let file: Partial<CollectiveReasoningEngineConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "collective-reasoning-engine.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.COLLECTIVE_REASONING_ENGINE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.COLLECTIVE_REASONING_ENGINE_RETRY_ATTEMPTS ?? "", 10);

  const mergedModes = Array.from(
    new Set([
      ...DEFAULT_COLLECTIVE_REASONING_ENGINE_CONFIGURATION.supportedModes,
      ...(file.supportedModes ?? []),
      ...(overrides.supportedModes ?? []),
    ]),
  );

  return {
    ...DEFAULT_COLLECTIVE_REASONING_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    supportedModes: mergedModes,
    expertCatalog: (overrides.expertCatalog ??
      file.expertCatalog ??
      DEFAULT_COLLECTIVE_REASONING_ENGINE_CONFIGURATION.expertCatalog).map((p) => ({
      ...p,
      expertise: [...p.expertise],
    })),
    expertiseKeywords: {
      ...DEFAULT_COLLECTIVE_REASONING_ENGINE_CONFIGURATION.expertiseKeywords,
      ...(file.expertiseKeywords ?? {}),
      ...(overrides.expertiseKeywords ?? {}),
    },
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWork: true,
    neverAssignWorkersPermanently: true,
    neverReplacePillow: true,
    neverOverrideGrandKing: true,
    neverApproveActions: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveReasoningTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
