/** R5-18 — Externalized Cross-Channel Orchestrator configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CrossChannelOrchestratorConfiguration = {
  enabled: boolean;
  channelSynchronizationRulesEnabled: boolean;
  campaignCoordinationRulesEnabled: boolean;
  journeyCoordinationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverLaunchCoordinatedCampaignsWithoutValidation: true;
  maskSensitiveValues: true;
  conflictSeverityThreshold: number;
  maxChannelsPerOrchestration: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_CROSS_CHANNEL_ORCHESTRATOR_CONFIGURATION: CrossChannelOrchestratorConfiguration =
  {
    enabled: true,
    channelSynchronizationRulesEnabled: true,
    campaignCoordinationRulesEnabled: true,
    journeyCoordinationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverLaunchCoordinatedCampaignsWithoutValidation: true,
    maskSensitiveValues: true,
    conflictSeverityThreshold: 1,
    maxChannelsPerOrchestration: 6,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
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

export function loadCrossChannelOrchestratorConfigFile(
  repositoryRoot: string,
): Partial<CrossChannelOrchestratorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "cross-channel-orchestrator.config.json"),
    join(repositoryRoot, "config", "cross-channel-orchestrator.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CrossChannelOrchestratorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCrossChannelOrchestratorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CrossChannelOrchestratorConfiguration> = {},
): CrossChannelOrchestratorConfiguration {
  const fileConfig = repositoryRoot
    ? loadCrossChannelOrchestratorConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CrossChannelOrchestratorConfiguration> = {
    enabled: envBool(
      "CROSS_CHANNEL_ORCHESTRATOR_ENABLED",
      DEFAULT_CROSS_CHANNEL_ORCHESTRATOR_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CROSS_CHANNEL_ORCHESTRATOR_TIMEOUT_MS",
      DEFAULT_CROSS_CHANNEL_ORCHESTRATOR_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CROSS_CHANNEL_ORCHESTRATOR_MAX_RETRIES",
      DEFAULT_CROSS_CHANNEL_ORCHESTRATOR_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "CROSS_CHANNEL_ORCHESTRATOR_LOG_LEVEL",
      DEFAULT_CROSS_CHANNEL_ORCHESTRATOR_CONFIGURATION.loggingLevel,
    ) as CrossChannelOrchestratorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CROSS_CHANNEL_ORCHESTRATOR_AUTO_RECOVER",
      DEFAULT_CROSS_CHANNEL_ORCHESTRATOR_CONFIGURATION.autoRecover,
    ),
    conflictSeverityThreshold: envInt(
      "CROSS_CHANNEL_ORCHESTRATOR_CONFLICT_THRESHOLD",
      DEFAULT_CROSS_CHANNEL_ORCHESTRATOR_CONFIGURATION.conflictSeverityThreshold,
    ),
    maxChannelsPerOrchestration: envInt(
      "CROSS_CHANNEL_ORCHESTRATOR_MAX_CHANNELS",
      DEFAULT_CROSS_CHANNEL_ORCHESTRATOR_CONFIGURATION.maxChannelsPerOrchestration,
    ),
  };

  return {
    ...DEFAULT_CROSS_CHANNEL_ORCHESTRATOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverLaunchCoordinatedCampaignsWithoutValidation: true,
    maskSensitiveValues: true,
  };
}
