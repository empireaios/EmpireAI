import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type AutonomousInvestmentEngineConfiguration = {
  enabled: boolean;
  investmentEvaluationRulesEnabled: boolean;
  investmentExecutionRulesEnabled: boolean;
  riskThreshold: number;
  recommendationPriorityThreshold: number;
  validationRulesEnabled: boolean;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverExecuteInvestmentsWithoutGovernanceApproval: true;
  preserveInvestmentTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveFinancialInformation: true;
};

export const DEFAULT_AUTONOMOUS_INVESTMENT_ENGINE_CONFIGURATION: AutonomousInvestmentEngineConfiguration = {
  enabled: true,
  investmentEvaluationRulesEnabled: true,
  investmentExecutionRulesEnabled: true,
  riskThreshold: 70,
  recommendationPriorityThreshold: 55,
  validationRulesEnabled: true,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverExecuteInvestmentsWithoutGovernanceApproval: true,
  preserveInvestmentTraceability: true,
  preserveAuditability: true,
  preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveFinancialInformation: true,
};

export function buildAutonomousInvestmentEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AutonomousInvestmentEngineConfiguration> = {},
): AutonomousInvestmentEngineConfiguration {
  let file: Partial<AutonomousInvestmentEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "autonomous-investment-engine.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const risk = Number.parseInt(process.env.AUTONOMOUS_INVESTMENT_RISK_THRESHOLD ?? "", 10);
  const timeout = Number.parseInt(process.env.AUTONOMOUS_INVESTMENT_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.AUTONOMOUS_INVESTMENT_RETRY_ATTEMPTS ?? "", 10);
  const priority = Number.parseInt(process.env.AUTONOMOUS_INVESTMENT_PRIORITY_THRESHOLD ?? "", 10);
  return {
    ...DEFAULT_AUTONOMOUS_INVESTMENT_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    ...(Number.isFinite(risk) ? { riskThreshold: risk } : {}),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(priority) ? { recommendationPriorityThreshold: priority } : {}),
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverExecuteInvestmentsWithoutGovernanceApproval: true,
    preserveInvestmentTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveFinancialInformation: true,
  };
}
