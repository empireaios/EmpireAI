/** R2-12 — Externalized Shipment Tracking Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ShipmentTrackingEngineConfiguration = {
  enabled: boolean;
  trackingRefreshFrequencyMs: number;
  carrierTrackingRulesEnabled: boolean;
  webhookProcessingRulesEnabled: boolean;
  delayDetectionRulesEnabled: boolean;
  delayThresholdDays: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveExistingOnValidationFailure: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_SHIPMENT_TRACKING_ENGINE_CONFIGURATION: ShipmentTrackingEngineConfiguration =
  {
    enabled: true,
    trackingRefreshFrequencyMs: 300000,
    carrierTrackingRulesEnabled: true,
    webhookProcessingRulesEnabled: true,
    delayDetectionRulesEnabled: true,
    delayThresholdDays: 3,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    requestTimeoutMs: 30000,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    preserveExistingOnValidationFailure: true,
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

export function loadShipmentTrackingEngineConfigFile(
  repositoryRoot: string,
): Partial<ShipmentTrackingEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "shipment-tracking-engine.config.json"),
    join(repositoryRoot, "config", "shipment-tracking-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ShipmentTrackingEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildShipmentTrackingEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ShipmentTrackingEngineConfiguration> = {},
): ShipmentTrackingEngineConfiguration {
  const fileConfig = repositoryRoot ? loadShipmentTrackingEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ShipmentTrackingEngineConfiguration> = {
    enabled: envBool(
      "SHIPMENT_TRACKING_ENGINE_ENABLED",
      DEFAULT_SHIPMENT_TRACKING_ENGINE_CONFIGURATION.enabled,
    ),
    delayThresholdDays: envInt(
      "SHIPMENT_TRACKING_ENGINE_DELAY_THRESHOLD_DAYS",
      DEFAULT_SHIPMENT_TRACKING_ENGINE_CONFIGURATION.delayThresholdDays,
    ),
    loggingLevel: envString(
      "SHIPMENT_TRACKING_ENGINE_LOG_LEVEL",
      DEFAULT_SHIPMENT_TRACKING_ENGINE_CONFIGURATION.loggingLevel,
    ) as ShipmentTrackingEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SHIPMENT_TRACKING_ENGINE_AUTO_RECOVER",
      DEFAULT_SHIPMENT_TRACKING_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SHIPMENT_TRACKING_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
