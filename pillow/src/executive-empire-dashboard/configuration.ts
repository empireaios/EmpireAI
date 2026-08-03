import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ExecutiveEmpireDashboardConfiguration = {
  enabled: boolean; dashboardRefreshFrequencyMs: number; executiveAlertRulesEnabled: boolean;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true;
  neverExposeRestrictedEnterpriseInformationToUnauthorizedUsers: true;
  preserveDashboardTraceability: true; preserveAuditability: true; preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true; maskSensitiveValues: true; neverLogSensitiveEnterpriseInformation: true;
  requireAuthorizedAccess: true;
};
export const DEFAULT_EXECUTIVE_EMPIRE_DASHBOARD_CONFIGURATION: ExecutiveEmpireDashboardConfiguration = {
  enabled: true, dashboardRefreshFrequencyMs: 60000, executiveAlertRulesEnabled: true,
  neverExposeCredentials: true, neverExposeAuthenticationTokens: true,
  neverExposeRestrictedEnterpriseInformationToUnauthorizedUsers: true,
  preserveDashboardTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
  requireAuthorizedAccess: true,
};
export function buildExecutiveEmpireDashboardConfiguration(repositoryRoot?: string, overrides: Partial<ExecutiveEmpireDashboardConfiguration> = {}): ExecutiveEmpireDashboardConfiguration {
  let fileConfig: Partial<ExecutiveEmpireDashboardConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "executive-empire-dashboard.config.json") : "";
  if (candidate && existsSync(candidate)) try { fileConfig = JSON.parse(readFileSync(candidate, "utf8")); } catch { /* safe defaults */ }
  const refresh = Number.parseInt(process.env.EXECUTIVE_EMPIRE_DASHBOARD_REFRESH_MS ?? "", 10);
  return { ...DEFAULT_EXECUTIVE_EMPIRE_DASHBOARD_CONFIGURATION, ...fileConfig, ...overrides,
    ...(Number.isFinite(refresh) ? { dashboardRefreshFrequencyMs: refresh } : {}),
    neverExposeCredentials: true, neverExposeAuthenticationTokens: true,
    neverExposeRestrictedEnterpriseInformationToUnauthorizedUsers: true,
    preserveDashboardTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
    requireAuthorizedAccess: true };
}
