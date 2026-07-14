/** E5-09 — Enterprise Risk Governance configuration. */

import type { RiskSeverityLevel } from "./types.js";

export type RiskGovernanceConfiguration = {
  criticalMitigationRequired: boolean;
  executiveReviewIntervalDays: number;
  scanFrequencyMinutes: number;
  alertThresholdScore: number;
  notificationRouting: string[];
  autoEscalationEnabled: boolean;
  defaultSeverity: RiskSeverityLevel;
  heatMapThreshold: number;
};

export const DEFAULT_RISK_CONFIGURATION: RiskGovernanceConfiguration = {
  criticalMitigationRequired: true,
  executiveReviewIntervalDays: 7,
  scanFrequencyMinutes: 5,
  alertThresholdScore: 75,
  notificationRouting: ["ecc", "supervisor", "guardian"],
  autoEscalationEnabled: true,
  defaultSeverity: "medium",
  heatMapThreshold: 60,
};

export function buildRiskConfiguration(
  overrides: Partial<RiskGovernanceConfiguration> = {},
): RiskGovernanceConfiguration {
  return { ...DEFAULT_RISK_CONFIGURATION, ...overrides };
}
