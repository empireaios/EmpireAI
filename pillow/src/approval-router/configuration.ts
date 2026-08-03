import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { APPROVAL_LEVELS } from "./paths.js";

export type ApprovalPolicyRule = {
  ruleId: string;
  level: (typeof APPROVAL_LEVELS)[number];
  /** Match if any pattern appears in action/summary/hints (case-insensitive). */
  matchPatterns: string[];
  reason: string;
  priority: number;
};

export type ApprovalRouterConfiguration = {
  enabled: boolean;
  routingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  defaultApprovalLevel: (typeof APPROVAL_LEVELS)[number];
  policyRules: ApprovalPolicyRule[];
  pendingQueueLimit: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-06 hard boundaries — force-locked true. */
  neverApproveRequests: true;
  neverExecuteRequests: true;
  neverAssignWorkers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveApprovalTraceability: true;
  preserveAuditability: true;
  preserveApprovalIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_APPROVAL_POLICY_RULES: ApprovalPolicyRule[] = [
  {
    ruleId: "ar-policy-grand-king-capital",
    level: "grand_king_approval",
    matchPatterns: [
      "grand king",
      "capital allocation",
      "acquire",
      "acquisition",
      "merge",
      "shutdown",
      "close business",
      "constitutional",
      "override",
    ],
    reason: "Strategic or capital action requires Grand King approval",
    priority: 100,
  },
  {
    ruleId: "ar-policy-multi-stage",
    level: "multi_stage_approval",
    matchPatterns: [
      "multi-stage",
      "multi stage",
      "cross-business",
      "cross business",
      "portfolio restructure",
      "regulated launch",
    ],
    reason: "Cross-domain or multi-gate action requires multi-stage approval",
    priority: 90,
  },
  {
    ruleId: "ar-policy-pillow",
    level: "pillow_approval",
    matchPatterns: [
      "deploy",
      "launch",
      "expand",
      "hire",
      "budget",
      "contract",
      "vendor",
      "policy change",
      "mission start",
    ],
    reason: "Operationally significant action requires Pillow approval",
    priority: 50,
  },
  {
    ruleId: "ar-policy-autonomous",
    level: "autonomous",
    matchPatterns: [
      "status check",
      "read only",
      "readonly",
      "diagnostics",
      "health check",
      "log retention",
      "cache refresh",
      "routine sync",
    ],
    reason: "Low-risk routine action may proceed autonomously",
    priority: 20,
  },
];

export const DEFAULT_APPROVAL_ROUTER_CONFIGURATION: ApprovalRouterConfiguration = {
  enabled: true,
  routingRulesEnabled: true,
  validationRulesEnabled: true,
  defaultApprovalLevel: "pillow_approval",
  policyRules: DEFAULT_APPROVAL_POLICY_RULES.map((r) => ({
    ...r,
    matchPatterns: [...r.matchPatterns],
  })),
  pendingQueueLimit: 5_000,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverApproveRequests: true,
  neverExecuteRequests: true,
  neverAssignWorkers: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveApprovalTraceability: true,
  preserveAuditability: true,
  preserveApprovalIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildApprovalRouterConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ApprovalRouterConfiguration> = {},
): ApprovalRouterConfiguration {
  let file: Partial<ApprovalRouterConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "approval-router.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.APPROVAL_ROUTER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.APPROVAL_ROUTER_RETRY_ATTEMPTS ?? "", 10);
  const queueLimit = Number.parseInt(process.env.APPROVAL_ROUTER_PENDING_LIMIT ?? "", 10);

  const policyRules =
    overrides.policyRules ??
    file.policyRules ??
    DEFAULT_APPROVAL_ROUTER_CONFIGURATION.policyRules.map((r) => ({
      ...r,
      matchPatterns: [...r.matchPatterns],
    }));

  return {
    ...DEFAULT_APPROVAL_ROUTER_CONFIGURATION,
    ...file,
    ...overrides,
    policyRules: policyRules.map((r) => ({ ...r, matchPatterns: [...r.matchPatterns] })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(queueLimit) ? { pendingQueueLimit: queueLimit } : {}),
    neverApproveRequests: true,
    neverExecuteRequests: true,
    neverAssignWorkers: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveApprovalTraceability: true,
    preserveAuditability: true,
    preserveApprovalIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
