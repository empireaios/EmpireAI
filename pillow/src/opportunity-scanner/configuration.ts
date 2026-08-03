import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_OPPORTUNITY_DOMAINS } from "./paths.js";

export type OpportunityScannerConfiguration = {
  enabled: boolean;
  opportunityDomains: string[];
  scanningRulesEnabled: boolean;
  scoringRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxOpportunitiesPerScan: number;
  minConfidenceScore: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-02 hard boundaries — force-locked true. */
  neverExecuteOpportunities: true;
  neverApproveOpportunities: true;
  neverAssignWorkers: true;
  neverCreateBusinesses: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveOpportunityTraceability: true;
  preserveAuditability: true;
  preserveScanningIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_OPPORTUNITY_SCANNER_CONFIGURATION: OpportunityScannerConfiguration = {
  enabled: true,
  opportunityDomains: [...DEFAULT_OPPORTUNITY_DOMAINS],
  scanningRulesEnabled: true,
  scoringRulesEnabled: true,
  validationRulesEnabled: true,
  maxOpportunitiesPerScan: 12,
  minConfidenceScore: 40,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteOpportunities: true,
  neverApproveOpportunities: true,
  neverAssignWorkers: true,
  neverCreateBusinesses: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveOpportunityTraceability: true,
  preserveAuditability: true,
  preserveScanningIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildOpportunityScannerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<OpportunityScannerConfiguration> = {},
): OpportunityScannerConfiguration {
  let file: Partial<OpportunityScannerConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "opportunity-scanner.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.OPPORTUNITY_SCANNER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.OPPORTUNITY_SCANNER_RETRY_ATTEMPTS ?? "", 10);
  const maxOps = Number.parseInt(process.env.OPPORTUNITY_SCANNER_MAX_OPPORTUNITIES ?? "", 10);
  return {
    ...DEFAULT_OPPORTUNITY_SCANNER_CONFIGURATION,
    ...file,
    ...overrides,
    opportunityDomains:
      overrides.opportunityDomains ??
      file.opportunityDomains ??
      [...DEFAULT_OPPORTUNITY_DOMAINS],
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(maxOps) ? { maxOpportunitiesPerScan: maxOps } : {}),
    neverExecuteOpportunities: true,
    neverApproveOpportunities: true,
    neverAssignWorkers: true,
    neverCreateBusinesses: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveOpportunityTraceability: true,
    preserveAuditability: true,
    preserveScanningIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
