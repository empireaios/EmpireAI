import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PlatformCertificationConfiguration } from "./types.js";

export const DEFAULT_PLATFORM_CERTIFICATION_CONFIGURATION: PlatformCertificationConfiguration = {
  enabled: true, timeoutMs: 5_000, repositoryEvidenceScanEnabled: true,
  neverFabricateCertificationSuccess: true, neverAutoMarkIncompleteMissionsComplete: true,
  neverActivateRealProduction: true, neverConductRealCustomerBilling: true,
  neverOverridePillowGrandKing: true, neverImplementQ7OrLater: true,
};
export function buildPlatformCertificationConfiguration(root?: string, overrides: Partial<PlatformCertificationConfiguration> = {}): PlatformCertificationConfiguration {
  let file: Partial<PlatformCertificationConfiguration> = {};
  const config = root ? join(root, "config", "platform-certification.config.json") : "";
  if (config && existsSync(config)) try { file = JSON.parse(readFileSync(config, "utf8")); } catch { /* safe defaults remain authoritative */ }
  const envTimeout = Number.parseInt(process.env.PLATFORM_CERTIFICATION_TIMEOUT_MS ?? "", 10);
  return { ...DEFAULT_PLATFORM_CERTIFICATION_CONFIGURATION, ...file, ...overrides,
    ...(Number.isFinite(envTimeout) && envTimeout > 0 ? { timeoutMs: envTimeout } : {}),
    neverFabricateCertificationSuccess: true, neverAutoMarkIncompleteMissionsComplete: true,
    neverActivateRealProduction: true, neverConductRealCustomerBilling: true,
    neverOverridePillowGrandKing: true, neverImplementQ7OrLater: true };
}
