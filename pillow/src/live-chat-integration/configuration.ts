/** R4-07 — Externalized Live Chat Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ChatSessionRule = {
  ruleId: string;
  label: string;
  maxActiveSessions: number;
  sessionTimeoutMs: number;
  enabled: boolean;
};

export type ChatQueueRule = {
  ruleId: string;
  label: string;
  maxQueueSize: number;
  batchSize: number;
  enabled: boolean;
};

export type AssignmentRule = {
  ruleId: string;
  label: string;
  autoAssign: boolean;
  maxSessionsPerHandler: number;
  enabled: boolean;
};

export type TimeoutRule = {
  ruleId: string;
  label: string;
  responseTimeoutMs: number;
  sessionIdleTimeoutMs: number;
  enabled: boolean;
};

export type LiveChatIntegrationConfiguration = {
  enabled: boolean;
  sessionRulesEnabled: boolean;
  queueRulesEnabled: boolean;
  assignmentRulesEnabled: boolean;
  timeoutRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  sessionRules: ChatSessionRule[];
  queueRules: ChatQueueRule[];
  assignmentRules: AssignmentRule[];
  timeoutRules: TimeoutRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_LIVE_CHAT_INTEGRATION_CONFIGURATION: LiveChatIntegrationConfiguration = {
  enabled: true,
  sessionRulesEnabled: true,
  queueRulesEnabled: true,
  assignmentRulesEnabled: true,
  timeoutRulesEnabled: true,
  validationRulesEnabled: true,
  duplicateDetectionEnabled: true,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  sessionRules: [
    { ruleId: "default_session", label: "Default session", maxActiveSessions: 1000, sessionTimeoutMs: 3600000, enabled: true },
  ],
  queueRules: [
    { ruleId: "default_queue", label: "Default queue", maxQueueSize: 5000, batchSize: 25, enabled: true },
  ],
  assignmentRules: [
    { ruleId: "default_assignment", label: "Default assignment", autoAssign: false, maxSessionsPerHandler: 10, enabled: true },
  ],
  timeoutRules: [
    { ruleId: "default_timeout", label: "Default timeout", responseTimeoutMs: 120000, sessionIdleTimeoutMs: 600000, enabled: true },
  ],
  maskSensitiveValues: true,
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

export function loadLiveChatIntegrationConfigFile(
  repositoryRoot: string,
): Partial<LiveChatIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "live-chat-integration.config.json"),
    join(repositoryRoot, "config", "live-chat-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<LiveChatIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildLiveChatIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LiveChatIntegrationConfiguration> = {},
): LiveChatIntegrationConfiguration {
  const fileConfig = repositoryRoot ? loadLiveChatIntegrationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<LiveChatIntegrationConfiguration> = {
    enabled: envBool(
      "LIVE_CHAT_INTEGRATION_ENABLED",
      DEFAULT_LIVE_CHAT_INTEGRATION_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "LIVE_CHAT_INTEGRATION_TIMEOUT_MS",
      DEFAULT_LIVE_CHAT_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "LIVE_CHAT_INTEGRATION_MAX_RETRIES",
      DEFAULT_LIVE_CHAT_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "LIVE_CHAT_INTEGRATION_LOG_LEVEL",
      DEFAULT_LIVE_CHAT_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as LiveChatIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "LIVE_CHAT_INTEGRATION_AUTO_RECOVER",
      DEFAULT_LIVE_CHAT_INTEGRATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_LIVE_CHAT_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
