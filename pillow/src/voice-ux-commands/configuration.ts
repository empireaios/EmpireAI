/** T4-02 — Externalized Voice UX Commands configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SPEECH_TO_TEXT_PROVIDERS, VOICE_COMMAND_TYPES } from "./paths.js";
import type { SpeechToTextProvider, VoiceCommandType } from "./types.js";

export type VoiceUxCommandsConfiguration = {
  enabled: boolean;
  speechToTextProvider: SpeechToTextProvider;
  audioInputRulesEnabled: boolean;
  transcriptionConfidenceThreshold: number;
  voiceCommandParsingRulesEnabled: boolean;
  screenReferenceRulesEnabled: boolean;
  uxFindingLinkageRulesEnabled: boolean;
  builderCapabilityLinkageRulesEnabled: boolean;
  clarificationRulesEnabled: boolean;
  clarificationConfidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  commandTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  supportedVoiceCommandTypes: VoiceCommandType[];
  outputValidationEnabled: boolean;
  maxHistoryCommands: number;
};

export const DEFAULT_VOICE_UX_COMMANDS_CONFIGURATION: VoiceUxCommandsConfiguration = {
  enabled: true,
  speechToTextProvider: "local_adapter",
  audioInputRulesEnabled: true,
  transcriptionConfidenceThreshold: 0.55,
  voiceCommandParsingRulesEnabled: true,
  screenReferenceRulesEnabled: true,
  uxFindingLinkageRulesEnabled: true,
  builderCapabilityLinkageRulesEnabled: true,
  clarificationRulesEnabled: true,
  clarificationConfidenceThreshold: 0.45,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  commandTimeoutMs: 120000,
  loggingLevel: "info",
  autoRecover: true,
  supportedVoiceCommandTypes: [...VOICE_COMMAND_TYPES],
  outputValidationEnabled: true,
  maxHistoryCommands: 50,
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

export function loadVoiceUxCommandsConfigFile(
  repositoryRoot: string,
): Partial<VoiceUxCommandsConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "voice-ux-commands.config.json"),
    join(repositoryRoot, "config", "voice-ux-commands.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<VoiceUxCommandsConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildVoiceUxCommandsConfiguration(
  repositoryRoot?: string,
  overrides: Partial<VoiceUxCommandsConfiguration> = {},
): VoiceUxCommandsConfiguration {
  const fileConfig = repositoryRoot ? loadVoiceUxCommandsConfigFile(repositoryRoot) : null;
  const provider = envString(
    "VOICE_UX_COMMANDS_STT_PROVIDER",
    DEFAULT_VOICE_UX_COMMANDS_CONFIGURATION.speechToTextProvider,
  ) as SpeechToTextProvider;

  const envConfig: Partial<VoiceUxCommandsConfiguration> = {
    enabled: envBool(
      "VOICE_UX_COMMANDS_ENABLED",
      DEFAULT_VOICE_UX_COMMANDS_CONFIGURATION.enabled,
    ),
    speechToTextProvider: SPEECH_TO_TEXT_PROVIDERS.includes(provider)
      ? provider
      : DEFAULT_VOICE_UX_COMMANDS_CONFIGURATION.speechToTextProvider,
    transcriptionConfidenceThreshold: envFloat(
      "VOICE_UX_COMMANDS_TRANSCRIPTION_THRESHOLD",
      DEFAULT_VOICE_UX_COMMANDS_CONFIGURATION.transcriptionConfidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "VOICE_UX_COMMANDS_MAX_RETRIES",
      DEFAULT_VOICE_UX_COMMANDS_CONFIGURATION.maxRetryAttempts,
    ),
    commandTimeoutMs: envInt(
      "VOICE_UX_COMMANDS_TIMEOUT_MS",
      DEFAULT_VOICE_UX_COMMANDS_CONFIGURATION.commandTimeoutMs,
    ),
    loggingLevel: envString(
      "VOICE_UX_COMMANDS_LOG_LEVEL",
      DEFAULT_VOICE_UX_COMMANDS_CONFIGURATION.loggingLevel,
    ) as VoiceUxCommandsConfiguration["loggingLevel"],
    autoRecover: envBool(
      "VOICE_UX_COMMANDS_AUTO_RECOVER",
      DEFAULT_VOICE_UX_COMMANDS_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_VOICE_UX_COMMANDS_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
