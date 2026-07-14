/** E5-11 — Executive Policy Evolution configuration. */

export type PolicyEvolutionConfiguration = {
  evolutionCycleDays: number;
  executiveReviewIntervalDays: number;
  scanFrequencyMinutes: number;
  approvalDueDays: number;
  notificationRouting: string[];
  constitutionValidationRequired: boolean;
  backwardCompatibilityRequired: boolean;
  autoEscalationEnabled: boolean;
};

export const DEFAULT_POLICY_EVOLUTION_CONFIGURATION: PolicyEvolutionConfiguration = {
  evolutionCycleDays: 14,
  executiveReviewIntervalDays: 21,
  scanFrequencyMinutes: 5,
  approvalDueDays: 7,
  notificationRouting: ["ecc", "supervisor", "guardian", "vie"],
  constitutionValidationRequired: true,
  backwardCompatibilityRequired: true,
  autoEscalationEnabled: true,
};

export function buildPolicyEvolutionConfiguration(
  overrides: Partial<PolicyEvolutionConfiguration> = {},
): PolicyEvolutionConfiguration {
  return { ...DEFAULT_POLICY_EVOLUTION_CONFIGURATION, ...overrides };
}
