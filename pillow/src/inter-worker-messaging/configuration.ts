import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MESSAGE_PRIORITIES, MESSAGE_TYPES } from "./paths.js";
import type { MessageRecord } from "./types.js";

export type InterWorkerMessagingConfiguration = {
  enabled: boolean;
  routingRulesEnabled: boolean;
  deliveryTrackingEnabled: boolean;
  historyRulesEnabled: boolean;
  broadcastRulesEnabled: boolean;
  priorityRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  messageTypes: string[];
  messagePriorities: string[];
  defaultPriority: "critical" | "high" | "medium" | "low";
  seedMessages: MessageRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-24 hard boundaries — force-locked true. */
  neverExecuteWorkerLogic: true;
  neverModifyWorkerDecisions: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveMessageTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_MESSAGES: MessageRecord[] = [];

export const DEFAULT_INTER_WORKER_MESSAGING_CONFIGURATION: InterWorkerMessagingConfiguration = {
  enabled: true,
  routingRulesEnabled: true,
  deliveryTrackingEnabled: true,
  historyRulesEnabled: true,
  broadcastRulesEnabled: true,
  priorityRulesEnabled: true,
  validationRulesEnabled: true,
  messageTypes: [...MESSAGE_TYPES],
  messagePriorities: [...MESSAGE_PRIORITIES],
  defaultPriority: "medium",
  seedMessages: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerLogic: true,
  neverModifyWorkerDecisions: true,
  neverReplaceWorkforceOrchestrator: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveMessageTraceability: true,
  preserveAuditability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildInterWorkerMessagingConfiguration(
  repositoryRoot?: string,
  overrides: Partial<InterWorkerMessagingConfiguration> = {},
): InterWorkerMessagingConfiguration {
  let file: Partial<InterWorkerMessagingConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "inter-worker-messaging.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.INTER_WORKER_MESSAGING_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.INTER_WORKER_MESSAGING_RETRY_ATTEMPTS ?? "", 10);

  const mergedTypes = Array.from(
    new Set([
      ...DEFAULT_INTER_WORKER_MESSAGING_CONFIGURATION.messageTypes,
      ...(file.messageTypes ?? []),
      ...(overrides.messageTypes ?? []),
    ]),
  );
  const mergedPriorities = Array.from(
    new Set([
      ...DEFAULT_INTER_WORKER_MESSAGING_CONFIGURATION.messagePriorities,
      ...(file.messagePriorities ?? []),
      ...(overrides.messagePriorities ?? []),
    ]),
  );

  return {
    ...DEFAULT_INTER_WORKER_MESSAGING_CONFIGURATION,
    ...file,
    ...overrides,
    messageTypes: mergedTypes,
    messagePriorities: mergedPriorities,
    seedMessages: (overrides.seedMessages ?? file.seedMessages ?? []).map((r) => ({
      ...r,
      deliveryHistory: [...r.deliveryHistory],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerLogic: true,
    neverModifyWorkerDecisions: true,
    neverReplaceWorkforceOrchestrator: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveMessageTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
