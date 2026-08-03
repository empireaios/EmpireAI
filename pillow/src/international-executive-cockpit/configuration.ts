import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
export type InternationalExecutiveCockpitConfiguration = {
  enabled: boolean; dashboardRefreshFrequencyMs: number; validationRulesEnabled: boolean; healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true; neverExposeRestrictedEnterpriseInformationToUnauthorizedUsers: true;
  preserveExecutiveTraceability: true; preserveAuditability: true; preserveEnterpriseIntegrity: true; structuralSignalsOnly: true; maskSensitiveValues: true; neverLogSensitiveEnterpriseInformation: true;
};
export const DEFAULT_INTERNATIONAL_EXECUTIVE_COCKPIT_CONFIGURATION: InternationalExecutiveCockpitConfiguration = { enabled: true, dashboardRefreshFrequencyMs: 30000, validationRulesEnabled: true, healthMonitoringRulesEnabled: true, neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverExposeRestrictedEnterpriseInformationToUnauthorizedUsers: true, preserveExecutiveTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true };
export function buildInternationalExecutiveCockpitConfiguration(repositoryRoot?: string, overrides: Partial<InternationalExecutiveCockpitConfiguration> = {}): InternationalExecutiveCockpitConfiguration {
  let file: Partial<InternationalExecutiveCockpitConfiguration> = {}; const candidate = repositoryRoot ? join(repositoryRoot, "config", "international-executive-cockpit.config.json") : "";
  if (candidate && existsSync(candidate)) try { file = JSON.parse(readFileSync(candidate, "utf8")); } catch { /* defaults remain authoritative */ }
  return { ...DEFAULT_INTERNATIONAL_EXECUTIVE_COCKPIT_CONFIGURATION, ...file, ...overrides, neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverExposeRestrictedEnterpriseInformationToUnauthorizedUsers: true, preserveExecutiveTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true };
}
