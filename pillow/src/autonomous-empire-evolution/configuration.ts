import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type AutonomousEmpireEvolutionConfiguration = {
  enabled: boolean;
  evolutionEvaluationRulesEnabled: boolean;
  simulationRulesEnabled: boolean;
  priorityThreshold: number;
  validationRulesEnabled: boolean;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverModifyGovernanceApprovedEnterpriseArchitectureAutomatically: true;
  neverBypassConstitutionalGovernance: true;
  preserveEvolutionTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_AUTONOMOUS_EMPIRE_EVOLUTION_CONFIGURATION: AutonomousEmpireEvolutionConfiguration = {
  enabled: true,
  evolutionEvaluationRulesEnabled: true,
  simulationRulesEnabled: true,
  priorityThreshold: 55,
  validationRulesEnabled: true,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverModifyGovernanceApprovedEnterpriseArchitectureAutomatically: true,
  neverBypassConstitutionalGovernance: true,
  preserveEvolutionTraceability: true,
  preserveAuditability: true,
  preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildAutonomousEmpireEvolutionConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AutonomousEmpireEvolutionConfiguration> = {},
): AutonomousEmpireEvolutionConfiguration {
  let file: Partial<AutonomousEmpireEvolutionConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "autonomous-empire-evolution.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.AUTONOMOUS_EMPIRE_EVOLUTION_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.AUTONOMOUS_EMPIRE_EVOLUTION_RETRY_ATTEMPTS ?? "", 10);
  const threshold = Number.parseInt(process.env.AUTONOMOUS_EMPIRE_EVOLUTION_PRIORITY_THRESHOLD ?? "", 10);
  return {
    ...DEFAULT_AUTONOMOUS_EMPIRE_EVOLUTION_CONFIGURATION,
    ...file,
    ...overrides,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(threshold) ? { priorityThreshold: threshold } : {}),
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverModifyGovernanceApprovedEnterpriseArchitectureAutomatically: true,
    neverBypassConstitutionalGovernance: true,
    preserveEvolutionTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
