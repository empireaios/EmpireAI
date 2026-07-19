/** R4-08 — Externalized AI Customer Support configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { COMMUNICATION_CHANNELS } from "./paths.js";

export type EscalationRule = {
  ruleId: string;
  label: string;
  autoEscalateIntents: string[];
  enabled: boolean;
};

export type ResponseGenerationRule = {
  ruleId: string;
  label: string;
  maxResponseLength: number;
  requireContext: boolean;
  enabled: boolean;
};

export type ChannelRule = {
  ruleId: string;
  label: string;
  channel: (typeof COMMUNICATION_CHANNELS)[number];
  enabled: boolean;
};

export type AiCustomerSupportConfiguration = {
  enabled: boolean;
  escalationRulesEnabled: boolean;
  responseGenerationRulesEnabled: boolean;
  channelRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  escalationRules: EscalationRule[];
  responseGenerationRules: ResponseGenerationRule[];
  channelRules: ChannelRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_AI_CUSTOMER_SUPPORT_CONFIGURATION: AiCustomerSupportConfiguration = {
  enabled: true,
  escalationRulesEnabled: true,
  responseGenerationRulesEnabled: true,
  channelRulesEnabled: true,
  validationRulesEnabled: true,
  duplicateDetectionEnabled: true,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  escalationRules: [
    {
      ruleId: "complex_enquiry",
      label: "Auto-escalate complex enquiries",
      autoEscalateIntents: ["escalation_required", "account_issue"],
      enabled: true,
    },
  ],
  responseGenerationRules: [
    {
      ruleId: "default_response",
      label: "Default response generation",
      maxResponseLength: 2000,
      requireContext: true,
      enabled: true,
    },
  ],
  channelRules: [
    { ruleId: "live_chat", label: "Live chat channel", channel: "live_chat", enabled: true },
    { ruleId: "email", label: "Email channel", channel: "email", enabled: true },
    { ruleId: "sms", label: "SMS channel", channel: "sms", enabled: true },
    { ruleId: "whatsapp", label: "WhatsApp channel", channel: "whatsapp", enabled: true },
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

export function loadAiCustomerSupportConfigFile(
  repositoryRoot: string,
): Partial<AiCustomerSupportConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "ai-customer-support.config.json"),
    join(repositoryRoot, "config", "ai-customer-support.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<AiCustomerSupportConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAiCustomerSupportConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AiCustomerSupportConfiguration> = {},
): AiCustomerSupportConfiguration {
  const fileConfig = repositoryRoot ? loadAiCustomerSupportConfigFile(repositoryRoot) : null;
  const envConfig: Partial<AiCustomerSupportConfiguration> = {
    enabled: envBool(
      "AI_CUSTOMER_SUPPORT_ENABLED",
      DEFAULT_AI_CUSTOMER_SUPPORT_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "AI_CUSTOMER_SUPPORT_TIMEOUT_MS",
      DEFAULT_AI_CUSTOMER_SUPPORT_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "AI_CUSTOMER_SUPPORT_MAX_RETRIES",
      DEFAULT_AI_CUSTOMER_SUPPORT_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "AI_CUSTOMER_SUPPORT_LOG_LEVEL",
      DEFAULT_AI_CUSTOMER_SUPPORT_CONFIGURATION.loggingLevel,
    ) as AiCustomerSupportConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AI_CUSTOMER_SUPPORT_AUTO_RECOVER",
      DEFAULT_AI_CUSTOMER_SUPPORT_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_AI_CUSTOMER_SUPPORT_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
