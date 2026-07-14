/** E5-14 — Executive Resilience Engine configuration. */

export type ResilienceEngineConfiguration = {
  healthCheckIntervalMinutes: number;
  scanFrequencyMinutes: number;
  recoveryEscalationMinutes: number;
  notificationRouting: string[];
  automaticRecoveryEnabled: boolean;
  continuityValidationRequired: boolean;
  minimumEvidenceCount: number;
};

export const DEFAULT_RESILIENCE_CONFIGURATION: ResilienceEngineConfiguration = {
  healthCheckIntervalMinutes: 5,
  scanFrequencyMinutes: 5,
  recoveryEscalationMinutes: 15,
  notificationRouting: ["ecc", "supervisor", "guardian", "vie"],
  automaticRecoveryEnabled: true,
  continuityValidationRequired: true,
  minimumEvidenceCount: 1,
};

export function buildResilienceConfiguration(
  overrides: Partial<ResilienceEngineConfiguration> = {},
): ResilienceEngineConfiguration {
  return { ...DEFAULT_RESILIENCE_CONFIGURATION, ...overrides };
}
