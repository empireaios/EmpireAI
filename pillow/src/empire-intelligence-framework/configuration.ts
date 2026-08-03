import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type EmpireIntelligenceFrameworkConfiguration = {
  enabled: boolean; moduleRegistrationRulesEnabled: boolean; lifecycleRulesEnabled: boolean;
  validationRulesEnabled: boolean; healthMonitoringRulesEnabled: boolean; eventRoutingRulesEnabled: boolean;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true; neverBypassValidation: true;
  preserveModuleIsolation: true; preserveAuditability: true; preserveRecoveryCapability: true;
  structuralSignalsOnly: true; maskSensitiveValues: true; neverLogSensitiveOperationalInformation: true;
  maxRegisteredModules: number; loggingLevel: "debug" | "info" | "warn" | "error"; autoRecover: boolean;
};
export const DEFAULT_EMPIRE_INTELLIGENCE_FRAMEWORK_CONFIGURATION: EmpireIntelligenceFrameworkConfiguration = {
  enabled: true, moduleRegistrationRulesEnabled: true, lifecycleRulesEnabled: true, validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true, eventRoutingRulesEnabled: true, neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true, neverBypassValidation: true, preserveModuleIsolation: true,
  preserveAuditability: true, preserveRecoveryCapability: true, structuralSignalsOnly: true, maskSensitiveValues: true,
  neverLogSensitiveOperationalInformation: true, maxRegisteredModules: 50, loggingLevel: "info", autoRecover: true,
};
export function buildEmpireIntelligenceFrameworkConfiguration(
  repositoryRoot?: string, overrides: Partial<EmpireIntelligenceFrameworkConfiguration> = {},
): EmpireIntelligenceFrameworkConfiguration {
  let fileConfig: Partial<EmpireIntelligenceFrameworkConfiguration> = {};
  if (repositoryRoot) {
    const path = join(repositoryRoot, "config", "empire-intelligence-framework.config.json");
    if (existsSync(path)) try { fileConfig = JSON.parse(readFileSync(path, "utf8")); } catch { /* defaults remain safe */ }
  }
  return { ...DEFAULT_EMPIRE_INTELLIGENCE_FRAMEWORK_CONFIGURATION, ...fileConfig, ...overrides,
    neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverBypassValidation: true,
    preserveModuleIsolation: true, preserveAuditability: true, preserveRecoveryCapability: true,
    structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveOperationalInformation: true };
}
