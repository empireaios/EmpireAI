/** T4-01 — Externalized Natural UX Conversation configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { INTENT_CATEGORIES } from "./paths.js";
import type { IntentCategory } from "./types.js";

export type NaturalUxConversationConfiguration = {
  enabled: boolean;
  intentRecognitionRulesEnabled: boolean;
  contextRetentionEnabled: boolean;
  clarificationRulesEnabled: boolean;
  conversationTimeoutMs: number;
  conversationHistoryRetentionMs: number;
  maxHistoryTurns: number;
  builderRequestGenerationEnabled: boolean;
  confidenceThreshold: number;
  clarificationConfidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  conversationTimeoutMsHard: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  supportedIntentCategories: IntentCategory[];
  outputValidationEnabled: boolean;
};

export const DEFAULT_NATURAL_UX_CONVERSATION_CONFIGURATION: NaturalUxConversationConfiguration = {
  enabled: true,
  intentRecognitionRulesEnabled: true,
  contextRetentionEnabled: true,
  clarificationRulesEnabled: true,
  conversationTimeoutMs: 300000,
  conversationHistoryRetentionMs: 86400000,
  maxHistoryTurns: 50,
  builderRequestGenerationEnabled: true,
  confidenceThreshold: 0.55,
  clarificationConfidenceThreshold: 0.45,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  conversationTimeoutMsHard: 120000,
  loggingLevel: "info",
  autoRecover: true,
  supportedIntentCategories: [...INTENT_CATEGORIES],
  outputValidationEnabled: true,
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

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadNaturalUxConversationConfigFile(
  repositoryRoot: string,
): Partial<NaturalUxConversationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "natural-ux-conversation.config.json"),
    join(repositoryRoot, "config", "natural-ux-conversation.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<NaturalUxConversationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildNaturalUxConversationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<NaturalUxConversationConfiguration> = {},
): NaturalUxConversationConfiguration {
  const fileConfig = repositoryRoot ? loadNaturalUxConversationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<NaturalUxConversationConfiguration> = {
    enabled: envBool(
      "NATURAL_UX_CONVERSATION_ENABLED",
      DEFAULT_NATURAL_UX_CONVERSATION_CONFIGURATION.enabled,
    ),
    confidenceThreshold: envFloat(
      "NATURAL_UX_CONVERSATION_CONFIDENCE_THRESHOLD",
      DEFAULT_NATURAL_UX_CONVERSATION_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "NATURAL_UX_CONVERSATION_MAX_RETRIES",
      DEFAULT_NATURAL_UX_CONVERSATION_CONFIGURATION.maxRetryAttempts,
    ),
    conversationTimeoutMsHard: envInt(
      "NATURAL_UX_CONVERSATION_TIMEOUT_MS",
      DEFAULT_NATURAL_UX_CONVERSATION_CONFIGURATION.conversationTimeoutMsHard,
    ),
    loggingLevel: envString(
      "NATURAL_UX_CONVERSATION_LOG_LEVEL",
      DEFAULT_NATURAL_UX_CONVERSATION_CONFIGURATION.loggingLevel,
    ) as NaturalUxConversationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "NATURAL_UX_CONVERSATION_AUTO_RECOVER",
      DEFAULT_NATURAL_UX_CONVERSATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_NATURAL_UX_CONVERSATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
