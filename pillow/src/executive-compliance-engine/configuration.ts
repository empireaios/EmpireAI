/** E5-04 — Executive Compliance Engine configuration defaults. */

import type { ComplianceEnforcementMode } from "./types.js";

export type ComplianceEngineConfiguration = {
  defaultEnforcementMode: ComplianceEnforcementMode;
  policyGroups: string[];
  scanFrequencyMinutes: number;
  alertThresholdPercent: number;
  notificationRouting: string[];
  exemptionsEnabled: boolean;
  emergencyOverrideEnabled: boolean;
  realTimeValidationEnabled: boolean;
  driftDetectionEnabled: boolean;
};

export const DEFAULT_COMPLIANCE_CONFIGURATION: ComplianceEngineConfiguration = {
  defaultEnforcementMode: "warning",
  policyGroups: [
    "constitutional",
    "governance",
    "operational",
    "security",
    "financial",
    "ai_safety",
  ],
  scanFrequencyMinutes: 5,
  alertThresholdPercent: 85,
  notificationRouting: ["ecc", "supervisor", "guardian"],
  exemptionsEnabled: true,
  emergencyOverrideEnabled: true,
  realTimeValidationEnabled: true,
  driftDetectionEnabled: true,
};

export function buildComplianceConfiguration(
  overrides: Partial<ComplianceEngineConfiguration> = {},
): ComplianceEngineConfiguration {
  return { ...DEFAULT_COMPLIANCE_CONFIGURATION, ...overrides };
}
