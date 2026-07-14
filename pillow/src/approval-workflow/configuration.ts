/** T4-07 — Externalized Approval Workflow configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { APPROVAL_DECISIONS } from "./paths.js";
import type { ApprovalDecisionType } from "./types.js";

export type ApprovalWorkflowConfiguration = {
  enabled: boolean;
  approvalRequirementRulesEnabled: boolean;
  approvalDecisionRulesEnabled: boolean;
  approvedActionDispatchRulesEnabled: boolean;
  blockedActionRulesEnabled: boolean;
  confirmationRulesEnabled: boolean;
  recordRetentionRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  approvalTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  supportedApprovalDecisions: ApprovalDecisionType[];
  outputValidationEnabled: boolean;
  maxHistoryApprovals: number;
  requireExplanationBeforeApproval: boolean;
  requireComparisonBeforeApproval: boolean;
  confidenceThreshold: number;
};

export const DEFAULT_APPROVAL_WORKFLOW_CONFIGURATION: ApprovalWorkflowConfiguration = {
  enabled: true,
  approvalRequirementRulesEnabled: true,
  approvalDecisionRulesEnabled: true,
  approvedActionDispatchRulesEnabled: true,
  blockedActionRulesEnabled: true,
  confirmationRulesEnabled: true,
  recordRetentionRulesEnabled: true,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  approvalTimeoutMs: 120000,
  loggingLevel: "info",
  autoRecover: true,
  supportedApprovalDecisions: [...APPROVAL_DECISIONS],
  outputValidationEnabled: true,
  maxHistoryApprovals: 50,
  requireExplanationBeforeApproval: false,
  requireComparisonBeforeApproval: false,
  confidenceThreshold: 0.4,
};

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export function loadApprovalWorkflowConfigFile(
  repositoryRoot: string,
): Partial<ApprovalWorkflowConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "approval-workflow.config.json"),
    join(repositoryRoot, "config", "approval-workflow.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ApprovalWorkflowConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildApprovalWorkflowConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ApprovalWorkflowConfiguration> = {},
): ApprovalWorkflowConfiguration {
  const fileConfig = repositoryRoot ? loadApprovalWorkflowConfigFile(repositoryRoot) : null;

  const envConfig: Partial<ApprovalWorkflowConfiguration> = {
    enabled: envBool("APPROVAL_WORKFLOW_ENABLED", DEFAULT_APPROVAL_WORKFLOW_CONFIGURATION.enabled),
    maxRetryAttempts: envInt(
      "APPROVAL_WORKFLOW_MAX_RETRIES",
      DEFAULT_APPROVAL_WORKFLOW_CONFIGURATION.maxRetryAttempts,
    ),
    approvalTimeoutMs: envInt(
      "APPROVAL_WORKFLOW_TIMEOUT_MS",
      DEFAULT_APPROVAL_WORKFLOW_CONFIGURATION.approvalTimeoutMs,
    ),
    loggingLevel: envString(
      "APPROVAL_WORKFLOW_LOG_LEVEL",
      DEFAULT_APPROVAL_WORKFLOW_CONFIGURATION.loggingLevel,
    ) as ApprovalWorkflowConfiguration["loggingLevel"],
    autoRecover: envBool(
      "APPROVAL_WORKFLOW_AUTO_RECOVER",
      DEFAULT_APPROVAL_WORKFLOW_CONFIGURATION.autoRecover,
    ),
    confidenceThreshold: envFloat(
      "APPROVAL_WORKFLOW_CONFIDENCE_THRESHOLD",
      DEFAULT_APPROVAL_WORKFLOW_CONFIGURATION.confidenceThreshold,
    ),
  };

  return {
    ...DEFAULT_APPROVAL_WORKFLOW_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
