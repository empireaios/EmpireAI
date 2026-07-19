/** R4-05 — Externalized SMS Communication Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SMS_CATEGORIES } from "./paths.js";

export type SmsDeliveryRule = {
  ruleId: string;
  label: string;
  smsCategory: (typeof SMS_CATEGORIES)[number];
  enabled: boolean;
  maxRetries: number;
};

export type SmsTemplateRule = {
  ruleId: string;
  label: string;
  requireTemplate: boolean;
  enabled: boolean;
};

export type SmsQueueRule = {
  ruleId: string;
  label: string;
  maxQueueSize: number;
  batchSize: number;
  enabled: boolean;
};

export type SmsCommunicationEngineConfiguration = {
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
  deliveryRules: SmsDeliveryRule[];
  templateRules: SmsTemplateRule[];
  queueRules: SmsQueueRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_SMS_COMMUNICATION_ENGINE_CONFIGURATION: SmsCommunicationEngineConfiguration =
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
      { ruleId: "transactional", label: "Transactional SMS", smsCategory: "transactional", enabled: true, maxRetries: 3 },
      { ruleId: "notification", label: "Notification SMS", smsCategory: "notification", enabled: true, maxRetries: 2 },
      { ruleId: "verification", label: "Verification SMS", smsCategory: "verification", enabled: true, maxRetries: 1 },
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

export function loadSmsCommunicationEngineConfigFile(
  repositoryRoot: string,
): Partial<SmsCommunicationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "sms-communication-engine.config.json"),
    join(repositoryRoot, "config", "sms-communication-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<SmsCommunicationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSmsCommunicationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SmsCommunicationEngineConfiguration> = {},
): SmsCommunicationEngineConfiguration {
  const fileConfig = repositoryRoot ? loadSmsCommunicationEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<SmsCommunicationEngineConfiguration> = {
    enabled: envBool(
      "SMS_COMMUNICATION_ENGINE_ENABLED",
      DEFAULT_SMS_COMMUNICATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "SMS_COMMUNICATION_ENGINE_TIMEOUT_MS",
      DEFAULT_SMS_COMMUNICATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SMS_COMMUNICATION_ENGINE_MAX_RETRIES",
      DEFAULT_SMS_COMMUNICATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "SMS_COMMUNICATION_ENGINE_LOG_LEVEL",
      DEFAULT_SMS_COMMUNICATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as SmsCommunicationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SMS_COMMUNICATION_ENGINE_AUTO_RECOVER",
      DEFAULT_SMS_COMMUNICATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SMS_COMMUNICATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
