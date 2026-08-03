import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AUTHENTICATION_WORKER_IDENTITY, INTEGRATION_TARGETS } from "./paths.js";
export type AuthenticationWorkerConfiguration = {
  enabled: boolean; timeoutMs: number; sessionTtlSeconds: number; maxFailedAttempts: number; lockoutSeconds: number; integrationTargets: string[];
  workerId: string; workerName: string; factory: string; department: string; role: string;
  neverDefineRoles: true; neverDefinePermissions: true; neverBuildPolicyBasedAccessControl: true; neverImplementQ608OrLater: true; neverStorePlaintextPasswords: true; neverExposeSecretsInLogsOrReports: true; neverOverrideApprovedArchitecture: true; neverOverridePillow: true; neverOverrideGrandKing: true; keepAuthenticationSeparateFromAuthorization: true; failClosedWhenAuthStateUnverifiable: true; structuralSignalOnly: true; maskSensitiveValues: true;
};
export const DEFAULT_AUTHENTICATION_WORKER_CONFIGURATION: AuthenticationWorkerConfiguration = {
  enabled: true, timeoutMs: 5000, sessionTtlSeconds: 3600, maxFailedAttempts: 5, lockoutSeconds: 900, integrationTargets: [...INTEGRATION_TARGETS],
  workerId: AUTHENTICATION_WORKER_IDENTITY.workerId, workerName: AUTHENTICATION_WORKER_IDENTITY.workerName, factory: AUTHENTICATION_WORKER_IDENTITY.factory, department: AUTHENTICATION_WORKER_IDENTITY.department, role: AUTHENTICATION_WORKER_IDENTITY.role,
  neverDefineRoles: true, neverDefinePermissions: true, neverBuildPolicyBasedAccessControl: true, neverImplementQ608OrLater: true, neverStorePlaintextPasswords: true, neverExposeSecretsInLogsOrReports: true, neverOverrideApprovedArchitecture: true, neverOverridePillow: true, neverOverrideGrandKing: true, keepAuthenticationSeparateFromAuthorization: true, failClosedWhenAuthStateUnverifiable: true, structuralSignalOnly: true, maskSensitiveValues: true,
};
export function buildAuthenticationWorkerConfiguration(repositoryRoot?: string, overrides: Partial<AuthenticationWorkerConfiguration> = {}): AuthenticationWorkerConfiguration {
  let file: Partial<AuthenticationWorkerConfiguration> = {};
  const path = repositoryRoot ? join(repositoryRoot, "config", "authentication-worker.config.json") : "";
  if (path && existsSync(path)) try { file = JSON.parse(readFileSync(path, "utf8")); } catch { /* defaults are authoritative */ }
  const number = (name: string, fallback: number) => { const value = Number.parseInt(process.env[name] ?? "", 10); return Number.isFinite(value) && value > 0 ? value : fallback; };
  return { ...DEFAULT_AUTHENTICATION_WORKER_CONFIGURATION, ...file, ...overrides, integrationTargets: [...new Set([...INTEGRATION_TARGETS, ...(file.integrationTargets ?? []), ...(overrides.integrationTargets ?? [])])], timeoutMs: number("AUTHENTICATION_WORKER_TIMEOUT_MS", Number(overrides.timeoutMs ?? file.timeoutMs ?? 5000)), sessionTtlSeconds: number("AUTHENTICATION_WORKER_SESSION_TTL_SECONDS", Number(overrides.sessionTtlSeconds ?? file.sessionTtlSeconds ?? 3600)), maxFailedAttempts: number("AUTHENTICATION_WORKER_MAX_FAILED_ATTEMPTS", Number(overrides.maxFailedAttempts ?? file.maxFailedAttempts ?? 5)), lockoutSeconds: number("AUTHENTICATION_WORKER_LOCKOUT_SECONDS", Number(overrides.lockoutSeconds ?? file.lockoutSeconds ?? 900)), neverDefineRoles: true, neverDefinePermissions: true, neverBuildPolicyBasedAccessControl: true, neverImplementQ608OrLater: true, neverStorePlaintextPasswords: true, neverExposeSecretsInLogsOrReports: true, neverOverrideApprovedArchitecture: true, neverOverridePillow: true, neverOverrideGrandKing: true, keepAuthenticationSeparateFromAuthorization: true, failClosedWhenAuthStateUnverifiable: true, structuralSignalOnly: true, maskSensitiveValues: true };
}
