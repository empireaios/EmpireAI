/** R4-04 — Externalized Email Communication Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EMAIL_CATEGORIES } from "./paths.js";

export type DeliveryRule = {
  ruleId: string;
  label: string;
  emailCategory: (typeof EMAIL_CATEGORIES)[number];
  enabled: boolean;
  maxRetries: number;
};

export type TemplateRule = {
  ruleId: string;
  label: string;
  requireTemplate: boolean;
  enabled: boolean;
};

export type QueueRule = {
  ruleId: string;
  label: string;
  maxQueueSize: number;
  batchSize: number;
  enabled: boolean;
};

export type EmailCommunicationEngineConfiguration = {
  enabled: boolean;
  deliveryRulesEnabled: boolean;
  templateRulesEnabled: boolean;
  queueRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  deliveryRules: DeliveryRule[];
  templateRules: TemplateRule[];
  queueRules: QueueRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_EMAIL_COMMUNICATION_ENGINE_CONFIGURATION: EmailCommunicationEngineConfiguration =
  {
    enabled: true,
    deliveryRulesEnabled: true,
    templateRulesEnabled: true,
    queueRulesEnabled: true,
    validationRulesEnabled: true,
    duplicateDetectionEnabled: true,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    deliveryRules: [
      { ruleId: "transactional", label: "Transactional delivery", emailCategory: "transactional", enabled: true, maxRetries: 3 },
      { ruleId: "marketing", label: "Marketing delivery", emailCategory: "marketing", enabled: true, maxRetries: 2 },
      { ruleId: "notification", label: "Notification delivery", emailCategory: "notification", enabled: true, maxRetries: 3 },
      { ruleId: "support", label: "Support delivery", emailCategory: "support", enabled: true, maxRetries: 3 },
    ],
    templateRules: [
      { ruleId: "require_template", label: "Require template for send", requireTemplate: false, enabled: true },
    ],
    queueRules: [
      { ruleId: "default_queue", label: "Default queue", maxQueueSize: 10000, batchSize: 50, enabled: true },
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

export function loadEmailCommunicationEngineConfigFile(
  repositoryRoot: string,
): Partial<EmailCommunicationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "email-communication-engine.config.json"),
    join(repositoryRoot, "config", "email-communication-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<EmailCommunicationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildEmailCommunicationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EmailCommunicationEngineConfiguration> = {},
): EmailCommunicationEngineConfiguration {
  const fileConfig = repositoryRoot ? loadEmailCommunicationEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<EmailCommunicationEngineConfiguration> = {
    enabled: envBool(
      "EMAIL_COMMUNICATION_ENGINE_ENABLED",
      DEFAULT_EMAIL_COMMUNICATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "EMAIL_COMMUNICATION_ENGINE_TIMEOUT_MS",
      DEFAULT_EMAIL_COMMUNICATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "EMAIL_COMMUNICATION_ENGINE_MAX_RETRIES",
      DEFAULT_EMAIL_COMMUNICATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "EMAIL_COMMUNICATION_ENGINE_LOG_LEVEL",
      DEFAULT_EMAIL_COMMUNICATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as EmailCommunicationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "EMAIL_COMMUNICATION_ENGINE_AUTO_RECOVER",
      DEFAULT_EMAIL_COMMUNICATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_EMAIL_COMMUNICATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
