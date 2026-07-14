/** E5-13 — Enterprise Constitutional Guardian configuration. */

export type ConstitutionalGuardianConfiguration = {
  monitoringIntervalMinutes: number;
  scanFrequencyMinutes: number;
  violationEscalationMinutes: number;
  notificationRouting: string[];
  immediateInterventionEnabled: boolean;
  driftDetectionEnabled: boolean;
  repositoryProtectionRequired: boolean;
  minimumEvidenceCount: number;
};

export const DEFAULT_GUARDIAN_CONFIGURATION: ConstitutionalGuardianConfiguration = {
  monitoringIntervalMinutes: 5,
  scanFrequencyMinutes: 5,
  violationEscalationMinutes: 15,
  notificationRouting: ["ecc", "supervisor", "guardian", "vie"],
  immediateInterventionEnabled: true,
  driftDetectionEnabled: true,
  repositoryProtectionRequired: true,
  minimumEvidenceCount: 1,
};

export function buildGuardianConfiguration(
  overrides: Partial<ConstitutionalGuardianConfiguration> = {},
): ConstitutionalGuardianConfiguration {
  return { ...DEFAULT_GUARDIAN_CONFIGURATION, ...overrides };
}
