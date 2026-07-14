/** E5-12 — Executive Trust Engine configuration. */

export type TrustEngineConfiguration = {
  trustEvaluationIntervalDays: number;
  scanFrequencyMinutes: number;
  minimumEvidenceCount: number;
  lowTrustThreshold: number;
  criticalTrustThreshold: number;
  notificationRouting: string[];
  explainabilityRequired: boolean;
  unsupportedRatingBlocked: boolean;
};

export const DEFAULT_TRUST_CONFIGURATION: TrustEngineConfiguration = {
  trustEvaluationIntervalDays: 7,
  scanFrequencyMinutes: 5,
  minimumEvidenceCount: 1,
  lowTrustThreshold: 50,
  criticalTrustThreshold: 30,
  notificationRouting: ["ecc", "supervisor", "guardian", "vie"],
  explainabilityRequired: true,
  unsupportedRatingBlocked: true,
};

export function buildTrustConfiguration(
  overrides: Partial<TrustEngineConfiguration> = {},
): TrustEngineConfiguration {
  return { ...DEFAULT_TRUST_CONFIGURATION, ...overrides };
}
