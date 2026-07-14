/** E5-08 — Executive Exception Manager configuration. */

import type { ExceptionSeverityLevel } from "./types.js";

export type ExceptionManagerConfiguration = {
  defaultMaxDurationDays: number;
  autoEscalationHours: number;
  alertThresholdDays: number;
  scanFrequencyMinutes: number;
  notificationRouting: string[];
  manualInterventionEnabled: boolean;
  executiveApprovalRequired: boolean;
  retryAttempts: number;
  fallbackEnabled: boolean;
  defaultSeverity: ExceptionSeverityLevel;
};

export const DEFAULT_EXCEPTION_CONFIGURATION: ExceptionManagerConfiguration = {
  defaultMaxDurationDays: 30,
  autoEscalationHours: 48,
  alertThresholdDays: 14,
  scanFrequencyMinutes: 5,
  notificationRouting: ["ecc", "supervisor", "guardian"],
  manualInterventionEnabled: true,
  executiveApprovalRequired: true,
  retryAttempts: 3,
  fallbackEnabled: true,
  defaultSeverity: "medium",
};

export function buildExceptionConfiguration(
  overrides: Partial<ExceptionManagerConfiguration> = {},
): ExceptionManagerConfiguration {
  return { ...DEFAULT_EXCEPTION_CONFIGURATION, ...overrides };
}
