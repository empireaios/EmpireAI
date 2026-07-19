/** R4-06 — Externalized WhatsApp Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MESSAGE_CATEGORIES } from "./paths.js";

export type MessagingRule = {
  ruleId: string;
  label: string;
  messageCategory: (typeof MESSAGE_CATEGORIES)[number];
  enabled: boolean;
  maxRetries: number;
};

export type TemplateRule = {
  ruleId: string;
  label: string;
  requireTemplate: boolean;
  enabled: boolean;
};

export type ConversationRule = {
  ruleId: string;
  label: string;
  maxConversations: number;
  autoCloseAfterDays: number;
  enabled: boolean;
};

export type WhatsAppIntegrationConfiguration = {
  enabled: boolean;
  messagingRulesEnabled: boolean;
  templateRulesEnabled: boolean;
  conversationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  messagingRules: MessagingRule[];
  templateRules: TemplateRule[];
  conversationRules: ConversationRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_WHATSAPP_INTEGRATION_CONFIGURATION: WhatsAppIntegrationConfiguration = {
  enabled: true,
  messagingRulesEnabled: true,
  templateRulesEnabled: true,
  conversationRulesEnabled: true,
  validationRulesEnabled: true,
  duplicateDetectionEnabled: true,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  messagingRules: [
    { ruleId: "transactional", label: "Transactional WhatsApp", messageCategory: "transactional", enabled: true, maxRetries: 3 },
    { ruleId: "notification", label: "Notification WhatsApp", messageCategory: "notification", enabled: true, maxRetries: 2 },
    { ruleId: "template", label: "Template WhatsApp", messageCategory: "template", enabled: true, maxRetries: 3 },
    { ruleId: "inbound", label: "Inbound WhatsApp", messageCategory: "inbound", enabled: true, maxRetries: 1 },
  ],
  templateRules: [
    { ruleId: "require_template", label: "Require template for send", requireTemplate: false, enabled: true },
  ],
  conversationRules: [
    { ruleId: "default_conversation", label: "Default conversation", maxConversations: 10000, autoCloseAfterDays: 30, enabled: true },
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

export function loadWhatsAppIntegrationConfigFile(
  repositoryRoot: string,
): Partial<WhatsAppIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "whatsapp-integration.config.json"),
    join(repositoryRoot, "config", "whatsapp-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<WhatsAppIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildWhatsAppIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WhatsAppIntegrationConfiguration> = {},
): WhatsAppIntegrationConfiguration {
  const fileConfig = repositoryRoot ? loadWhatsAppIntegrationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<WhatsAppIntegrationConfiguration> = {
    enabled: envBool(
      "WHATSAPP_INTEGRATION_ENABLED",
      DEFAULT_WHATSAPP_INTEGRATION_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "WHATSAPP_INTEGRATION_TIMEOUT_MS",
      DEFAULT_WHATSAPP_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "WHATSAPP_INTEGRATION_MAX_RETRIES",
      DEFAULT_WHATSAPP_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "WHATSAPP_INTEGRATION_LOG_LEVEL",
      DEFAULT_WHATSAPP_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as WhatsAppIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "WHATSAPP_INTEGRATION_AUTO_RECOVER",
      DEFAULT_WHATSAPP_INTEGRATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_WHATSAPP_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
