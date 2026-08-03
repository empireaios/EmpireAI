import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CERTIFIED_MODULE_IDS } from "./paths.js";
export type GlobalOperationsCertifiedConfiguration = {
  enabled: boolean; certificationScope: string[]; passThresholdPercent: number;
  safeTestMode: true; neverModifyProductionSystemsDuringCertificationUnlessExplicitSafeTestMode: true;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true;
  preserveOperationalTraceability: true; preserveAuditability: true; preserveCertificationIntegrity: true;
  structuralSignalsOnly: true; maskSensitiveValues: true; neverLogSensitiveEnterpriseInformation: true;
};
export const DEFAULT_GLOBAL_OPERATIONS_CERTIFIED_CONFIGURATION: GlobalOperationsCertifiedConfiguration = {
  enabled: true, certificationScope: [...CERTIFIED_MODULE_IDS], passThresholdPercent: 85,
  safeTestMode: true, neverModifyProductionSystemsDuringCertificationUnlessExplicitSafeTestMode: true,
  neverExposeCredentials: true, neverExposeAuthenticationTokens: true, preserveOperationalTraceability: true,
  preserveAuditability: true, preserveCertificationIntegrity: true, structuralSignalsOnly: true,
  maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
};
export function buildGlobalOperationsCertifiedConfiguration(root?: string, overrides: Partial<GlobalOperationsCertifiedConfiguration> = {}): GlobalOperationsCertifiedConfiguration {
  let file: Partial<GlobalOperationsCertifiedConfiguration> = {};
  const path = root && join(root, "config", "global-operations-certified.config.json");
  if (path && existsSync(path)) try { file = JSON.parse(readFileSync(path, "utf8")); } catch { /* retain safe defaults */ }
  return { ...DEFAULT_GLOBAL_OPERATIONS_CERTIFIED_CONFIGURATION, ...file, ...overrides,
    certificationScope: overrides.certificationScope ?? file.certificationScope ?? [...CERTIFIED_MODULE_IDS],
    safeTestMode: true, neverModifyProductionSystemsDuringCertificationUnlessExplicitSafeTestMode: true,
    neverExposeCredentials: true, neverExposeAuthenticationTokens: true, preserveOperationalTraceability: true,
    preserveAuditability: true, preserveCertificationIntegrity: true, structuralSignalsOnly: true,
    maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true };
}
