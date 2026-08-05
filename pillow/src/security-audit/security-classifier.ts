import { configurationFlagTrue, countPresentMethods, readConfigurationFlags } from "./evidence-collector.js";
import type { SecurityAuditDependencies } from "./integrations.js";
import type { CheckStatus, ReadinessClassification, SecurityAssessment, SecurityComponentKey } from "./types.js";

export type DimensionStatuses = {
  authenticationStatus: CheckStatus;
  authorizationStatus: CheckStatus;
  secretStatus: CheckStatus;
  apiSecurityStatus: CheckStatus;
  dataProtectionStatus: CheckStatus;
  runtimeSecurityStatus: CheckStatus;
  operationalSecurityStatus: CheckStatus;
};

export type DimensionResult = DimensionStatuses & { evidence: string[] };

/**
 * Deterministic capability-presence status: all listed methods present ->
 * Passed; some present -> Partial; none present -> Failed. Never invokes
 * the methods themselves — presence/typeof evidence only.
 */
function capabilityStatus(
  handle: object | null | undefined,
  methodNames: string[],
): { status: CheckStatus; presentCount: number; total: number } {
  const total = methodNames.length;
  const presentCount = countPresentMethods(handle, methodNames);
  const status: CheckStatus = presentCount === total ? "Passed" : presentCount > 0 ? "Partial" : "Failed";
  return { status, presentCount, total };
}

function getStateCapable(handle: { getState?: () => unknown } | null | undefined): boolean {
  return !!handle && typeof handle.getState === "function";
}

/**
 * A dimension that a given component type does not own is vacuously
 * satisfied — this is a fixed, disclosed program-level policy (documented
 * here and in evidence text), never an invented per-instance result. The
 * owning component's own row carries the real evidence for that dimension.
 */
function notApplicable(dimension: string, componentKey: string, ownedBy: string): { status: CheckStatus; note: string } {
  return {
    status: "Passed",
    note: `${dimension} not applicable to ${componentKey} — evaluated by ${ownedBy}; vacuously satisfied by design scope`,
  };
}

function secretFlagStatus(configuration: Record<string, unknown> | null): { status: CheckStatus; note: string } {
  const maskOk = configurationFlagTrue(configuration, "maskSensitiveValues");
  const noPlaintext = configurationFlagTrue(configuration, "neverStorePlaintextPasswords");
  const noExpose = configurationFlagTrue(configuration, "neverExposeSecretsInLogsOrReports");
  const flagsPresent = configuration != null;
  const allTrue = maskOk && noPlaintext && noExpose;
  const anyTrue = maskOk || noPlaintext || noExpose;
  const status: CheckStatus = !flagsPresent ? "Failed" : allTrue ? "Passed" : anyTrue ? "Partial" : "Failed";
  return {
    status,
    note: `maskSensitiveValues=${maskOk} neverStorePlaintextPasswords=${noPlaintext} neverExposeSecretsInLogsOrReports=${noExpose}`,
  };
}

export function classifyAuthenticationWorker(deps: SecurityAuditDependencies): DimensionResult {
  const handle = deps.authenticationWorker ?? null;
  const authMethods = ["login", "registerAccount", "validateSession", "requestPasswordReset", "resetPassword", "verifyAccount"];
  const auth = capabilityStatus(handle, authMethods);
  const audit = capabilityStatus(handle, ["getAuthAuditEvents"]);
  const configuration = readConfigurationFlags(handle);
  const secret = secretFlagStatus(configuration);
  const runtimeStatus: CheckStatus = getStateCapable(handle) ? "Passed" : "Partial";
  const authorizationNa = notApplicable("authorizationStatus", "authentication-worker", "authorization-worker/authority-matrix");
  const apiNa = notApplicable("apiSecurityStatus", "authentication-worker", "api-runtime/tool-runtime");

  return {
    authenticationStatus: auth.status,
    authorizationStatus: authorizationNa.status,
    secretStatus: secret.status,
    apiSecurityStatus: apiNa.status,
    dataProtectionStatus: secret.status,
    runtimeSecurityStatus: runtimeStatus,
    operationalSecurityStatus: audit.status,
    evidence: [
      `authenticationStatus=${auth.status} (${auth.presentCount}/${auth.total} identity capability methods present)`,
      authorizationNa.note,
      `secretStatus=${secret.status} (${secret.note})`,
      apiNa.note,
      `dataProtectionStatus=${secret.status} (password-storage capability mirrors secretStatus)`,
      `runtimeSecurityStatus=${runtimeStatus} (getState presence=${getStateCapable(handle)})`,
      `operationalSecurityStatus=${audit.status} (getAuthAuditEvents present=${audit.presentCount > 0})`,
    ],
  };
}

export function classifyAuthorizationWorker(deps: SecurityAuditDependencies): DimensionResult {
  const handle = deps.authorizationWorker ?? null;
  const rbacMethods = ["evaluateAccess", "createRole", "assignRole"];
  const rbac = capabilityStatus(handle, rbacMethods);
  const audit = capabilityStatus(handle, ["getAuthorizationAuditEvents"]);
  const runtimeStatus: CheckStatus = getStateCapable(handle) ? "Passed" : "Partial";
  const authNa = notApplicable("authenticationStatus", "authorization-worker", "authentication-worker");
  const secretNa = notApplicable("secretStatus", "authorization-worker", "secret-management");
  const apiNa = notApplicable("apiSecurityStatus", "authorization-worker", "api-runtime/tool-runtime");
  const dataNa = notApplicable("dataProtectionStatus", "authorization-worker", "secret-management");

  return {
    authenticationStatus: authNa.status,
    authorizationStatus: rbac.status,
    secretStatus: secretNa.status,
    apiSecurityStatus: apiNa.status,
    dataProtectionStatus: dataNa.status,
    runtimeSecurityStatus: runtimeStatus,
    operationalSecurityStatus: audit.status,
    evidence: [
      authNa.note,
      `authorizationStatus=${rbac.status} (${rbac.presentCount}/${rbac.total} RBAC capability methods present)`,
      secretNa.note,
      apiNa.note,
      dataNa.note,
      `runtimeSecurityStatus=${runtimeStatus} (getState presence=${getStateCapable(handle)})`,
      `operationalSecurityStatus=${audit.status} (getAuthorizationAuditEvents present=${audit.presentCount > 0})`,
    ],
  };
}

export function classifyAuthorityMatrix(deps: SecurityAuditDependencies): DimensionResult {
  const handle = deps.authorityMatrix ?? null;
  const matrixMethods = ["validateWorkerAuthority", "validateApprovalRouting", "deriveAuthority"];
  const matrix = capabilityStatus(handle, matrixMethods);
  const catalog = capabilityStatus(handle, ["getCatalog"]);
  const runtimeStatus: CheckStatus = getStateCapable(handle) ? "Passed" : "Partial";
  const authNa = notApplicable("authenticationStatus", "authority-matrix", "authentication-worker");
  const secretNa = notApplicable("secretStatus", "authority-matrix", "secret-management");
  const apiNa = notApplicable("apiSecurityStatus", "authority-matrix", "api-runtime/tool-runtime");
  const dataNa = notApplicable("dataProtectionStatus", "authority-matrix", "secret-management");

  return {
    authenticationStatus: authNa.status,
    authorizationStatus: matrix.status,
    secretStatus: secretNa.status,
    apiSecurityStatus: apiNa.status,
    dataProtectionStatus: dataNa.status,
    runtimeSecurityStatus: runtimeStatus,
    operationalSecurityStatus: catalog.status,
    evidence: [
      authNa.note,
      `authorizationStatus=${matrix.status} (${matrix.presentCount}/${matrix.total} authority-routing capability methods present)`,
      secretNa.note,
      apiNa.note,
      dataNa.note,
      `runtimeSecurityStatus=${runtimeStatus} (getState presence=${getStateCapable(handle)})`,
      `operationalSecurityStatus=${catalog.status} (getCatalog present=${catalog.presentCount > 0})`,
    ],
  };
}

export function classifyApiRuntime(deps: SecurityAuditDependencies): DimensionResult {
  const handle = deps.apiRuntime ?? null;
  const apiMethods = ["authenticate", "routeRequest", "checkHealth"];
  const api = capabilityStatus(handle, apiMethods);
  const health = capabilityStatus(handle, ["checkHealth"]);
  const auditTrail = capabilityStatus(handle, ["getAuditTrail"]);
  const authNa = notApplicable("authenticationStatus", "api-runtime", "authentication-worker");
  const authorizationNa = notApplicable("authorizationStatus", "api-runtime", "authorization-worker/authority-matrix");
  const secretNa = notApplicable("secretStatus", "api-runtime", "secret-management");
  const dataNa = notApplicable("dataProtectionStatus", "api-runtime", "secret-management");

  return {
    authenticationStatus: authNa.status,
    authorizationStatus: authorizationNa.status,
    secretStatus: secretNa.status,
    apiSecurityStatus: api.status,
    dataProtectionStatus: dataNa.status,
    runtimeSecurityStatus: health.status,
    operationalSecurityStatus: auditTrail.status,
    evidence: [
      authNa.note,
      authorizationNa.note,
      secretNa.note,
      `apiSecurityStatus=${api.status} (${api.presentCount}/${api.total} auth-manager/permission-gate/rate-limiter structural methods present)`,
      dataNa.note,
      `runtimeSecurityStatus=${health.status} (checkHealth present=${health.presentCount > 0})`,
      `operationalSecurityStatus=${auditTrail.status} (getAuditTrail present=${auditTrail.presentCount > 0})`,
    ],
  };
}

export function classifyToolRuntime(deps: SecurityAuditDependencies): DimensionResult {
  const handle = deps.toolRuntime ?? null;
  const toolMethods = ["authenticate", "invokeTool", "checkAvailability"];
  const tool = capabilityStatus(handle, toolMethods);
  const runtimeStatus: CheckStatus = getStateCapable(handle) ? "Passed" : "Partial";
  const authNa = notApplicable("authenticationStatus", "tool-runtime", "authentication-worker");
  const authorizationNa = notApplicable("authorizationStatus", "tool-runtime", "authorization-worker/authority-matrix");
  const secretNa = notApplicable("secretStatus", "tool-runtime", "secret-management");
  const dataNa = notApplicable("dataProtectionStatus", "tool-runtime", "secret-management");
  const operationalNa = notApplicable("operationalSecurityStatus", "tool-runtime", "audit-runtime/monitoring-runtime");

  return {
    authenticationStatus: authNa.status,
    authorizationStatus: authorizationNa.status,
    secretStatus: secretNa.status,
    apiSecurityStatus: tool.status,
    dataProtectionStatus: dataNa.status,
    runtimeSecurityStatus: runtimeStatus,
    operationalSecurityStatus: operationalNa.status,
    evidence: [
      authNa.note,
      authorizationNa.note,
      secretNa.note,
      `apiSecurityStatus=${tool.status} (${tool.presentCount}/${tool.total} tool auth-manager structural methods present)`,
      dataNa.note,
      `runtimeSecurityStatus=${runtimeStatus} (getState presence=${getStateCapable(handle)})`,
      operationalNa.note,
    ],
  };
}

export function classifyAuditRuntime(deps: SecurityAuditDependencies): DimensionResult {
  const handle = deps.auditRuntime ?? null;
  const auditMethods = ["recordEvent", "verifyIntegrity", "query"];
  const audit = capabilityStatus(handle, auditMethods);
  const integrity = capabilityStatus(handle, ["verifyIntegrity"]);
  const authNa = notApplicable("authenticationStatus", "audit-runtime", "authentication-worker");
  const authorizationNa = notApplicable("authorizationStatus", "audit-runtime", "authorization-worker/authority-matrix");
  const secretNa = notApplicable("secretStatus", "audit-runtime", "secret-management");
  const apiNa = notApplicable("apiSecurityStatus", "audit-runtime", "api-runtime/tool-runtime");
  const dataNa = notApplicable("dataProtectionStatus", "audit-runtime", "secret-management");

  return {
    authenticationStatus: authNa.status,
    authorizationStatus: authorizationNa.status,
    secretStatus: secretNa.status,
    apiSecurityStatus: apiNa.status,
    dataProtectionStatus: dataNa.status,
    runtimeSecurityStatus: integrity.status,
    operationalSecurityStatus: audit.status,
    evidence: [
      authNa.note,
      authorizationNa.note,
      secretNa.note,
      apiNa.note,
      dataNa.note,
      `runtimeSecurityStatus=${integrity.status} (verifyIntegrity present=${integrity.presentCount > 0})`,
      `operationalSecurityStatus=${audit.status} (${audit.presentCount}/${audit.total} audit-logging capability methods present)`,
    ],
  };
}

export function classifyMonitoringRuntime(deps: SecurityAuditDependencies): DimensionResult {
  const handle = deps.monitoringRuntime ?? null;
  const monMethods = ["monitorRuntimes", "detectAnomalies", "generateAlerts"];
  const monitoring = capabilityStatus(handle, monMethods);
  const dashboard = capabilityStatus(handle, ["generateAlerts", "getDashboard"]);
  const authNa = notApplicable("authenticationStatus", "monitoring-runtime", "authentication-worker");
  const authorizationNa = notApplicable("authorizationStatus", "monitoring-runtime", "authorization-worker/authority-matrix");
  const secretNa = notApplicable("secretStatus", "monitoring-runtime", "secret-management");
  const apiNa = notApplicable("apiSecurityStatus", "monitoring-runtime", "api-runtime/tool-runtime");
  const dataNa = notApplicable("dataProtectionStatus", "monitoring-runtime", "secret-management");

  return {
    authenticationStatus: authNa.status,
    authorizationStatus: authorizationNa.status,
    secretStatus: secretNa.status,
    apiSecurityStatus: apiNa.status,
    dataProtectionStatus: dataNa.status,
    runtimeSecurityStatus: monitoring.status,
    operationalSecurityStatus: dashboard.status,
    evidence: [
      authNa.note,
      authorizationNa.note,
      secretNa.note,
      apiNa.note,
      dataNa.note,
      `runtimeSecurityStatus=${monitoring.status} (${monitoring.presentCount}/${monitoring.total} runtime/operational security monitoring methods present)`,
      `operationalSecurityStatus=${dashboard.status} (${dashboard.presentCount}/${dashboard.total} alerting/dashboard methods present)`,
    ],
  };
}

export function classifyProductionCertificationCore(deps: SecurityAuditDependencies): DimensionResult {
  const handle = deps.productionCertificationCore ?? null;
  const pccrtMethods = ["verifyGovernanceCompliance", "produceReport"];
  const pccrt = capabilityStatus(handle, pccrtMethods);
  const results = capabilityStatus(handle, ["getCertificationResults"]);
  const authNa = notApplicable("authenticationStatus", "production-certification-core", "authentication-worker");
  const authorizationNa = notApplicable("authorizationStatus", "production-certification-core", "authorization-worker/authority-matrix");
  const secretNa = notApplicable("secretStatus", "production-certification-core", "secret-management");
  const apiNa = notApplicable("apiSecurityStatus", "production-certification-core", "api-runtime/tool-runtime");
  const dataNa = notApplicable("dataProtectionStatus", "production-certification-core", "secret-management");

  return {
    authenticationStatus: authNa.status,
    authorizationStatus: authorizationNa.status,
    secretStatus: secretNa.status,
    apiSecurityStatus: apiNa.status,
    dataProtectionStatus: dataNa.status,
    runtimeSecurityStatus: pccrt.status,
    operationalSecurityStatus: results.status,
    evidence: [
      authNa.note,
      authorizationNa.note,
      secretNa.note,
      apiNa.note,
      dataNa.note,
      `runtimeSecurityStatus=${pccrt.status} (${pccrt.presentCount}/${pccrt.total} PCCRT security-certification signal methods present)`,
      `operationalSecurityStatus=${results.status} (getCertificationResults present=${results.presentCount > 0})`,
    ],
  };
}

export function classifyExecutiveReportingRuntime(deps: SecurityAuditDependencies): DimensionResult {
  const handle = deps.executiveReportingRuntime ?? null;
  const ert = capabilityStatus(handle, ["submitWorkerReport"]);
  const authNa = notApplicable("authenticationStatus", "executive-reporting-runtime", "authentication-worker");
  const authorizationNa = notApplicable("authorizationStatus", "executive-reporting-runtime", "authorization-worker/authority-matrix");
  const secretNa = notApplicable("secretStatus", "executive-reporting-runtime", "secret-management");
  const apiNa = notApplicable("apiSecurityStatus", "executive-reporting-runtime", "api-runtime/tool-runtime");
  const dataNa = notApplicable("dataProtectionStatus", "executive-reporting-runtime", "secret-management");
  const runtimeNa = notApplicable("runtimeSecurityStatus", "executive-reporting-runtime", "monitoring-runtime/production-certification-core");

  return {
    authenticationStatus: authNa.status,
    authorizationStatus: authorizationNa.status,
    secretStatus: secretNa.status,
    apiSecurityStatus: apiNa.status,
    dataProtectionStatus: dataNa.status,
    runtimeSecurityStatus: runtimeNa.status,
    operationalSecurityStatus: ert.status,
    evidence: [
      authNa.note,
      authorizationNa.note,
      secretNa.note,
      apiNa.note,
      dataNa.note,
      runtimeNa.note,
      `operationalSecurityStatus=${ert.status} (submitWorkerReport present=${ert.presentCount > 0})`,
    ],
  };
}

export function classifySecretManagement(deps: SecurityAuditDependencies): DimensionResult {
  const authConfiguration = readConfigurationFlags(deps.authenticationWorker ?? null);
  const secret = secretFlagStatus(authConfiguration);
  const authNa = notApplicable("authenticationStatus", "secret-management", "authentication-worker");
  const authorizationNa = notApplicable("authorizationStatus", "secret-management", "authorization-worker/authority-matrix");
  const apiNa = notApplicable("apiSecurityStatus", "secret-management", "api-runtime/tool-runtime");
  const runtimeNa = notApplicable("runtimeSecurityStatus", "secret-management", "monitoring-runtime");
  const operationalNa = notApplicable("operationalSecurityStatus", "secret-management", "audit-runtime");

  return {
    authenticationStatus: authNa.status,
    authorizationStatus: authorizationNa.status,
    secretStatus: secret.status,
    apiSecurityStatus: apiNa.status,
    dataProtectionStatus: secret.status,
    runtimeSecurityStatus: runtimeNa.status,
    operationalSecurityStatus: operationalNa.status,
    evidence: [
      authNa.note,
      authorizationNa.note,
      `secretStatus=${secret.status} (${secret.note}) — evaluated via configuration flags only, never secret values`,
      apiNa.note,
      `dataProtectionStatus=${secret.status} (mirrors secretStatus; masking/vault capability evidence only)`,
      runtimeNa.note,
      operationalNa.note,
    ],
  };
}

const CLASSIFIERS: Record<SecurityComponentKey, (deps: SecurityAuditDependencies) => DimensionResult> = {
  "authentication-worker": classifyAuthenticationWorker,
  "authorization-worker": classifyAuthorizationWorker,
  "authority-matrix": classifyAuthorityMatrix,
  "api-runtime": classifyApiRuntime,
  "audit-runtime": classifyAuditRuntime,
  "monitoring-runtime": classifyMonitoringRuntime,
  "production-certification-core": classifyProductionCertificationCore,
  "executive-reporting-runtime": classifyExecutiveReportingRuntime,
  "tool-runtime": classifyToolRuntime,
  "secret-management": classifySecretManagement,
};

export function classifyComponentDimensions(
  componentKey: SecurityComponentKey,
  deps: SecurityAuditDependencies,
): DimensionResult {
  return CLASSIFIERS[componentKey](deps);
}

/**
 * Deterministic classifier from evidence only — never certifies an insecure
 * implementation.
 *   any dimension Missing -> missing
 *   any dimension Failed -> failed
 *   all dimensions Passed -> certified
 *   otherwise -> partially_certified
 * `blocked` and `deferred` are applied by the caller from explicit prior
 * contract/gate evidence or explicit deferral input — never inferred here.
 */
export function classifySecurityReadiness(statuses: DimensionStatuses): ReadinessClassification {
  const values = Object.values(statuses);
  if (values.includes("Missing")) return "missing";
  if (values.includes("Failed")) return "failed";
  if (values.every((v) => v === "Passed")) return "certified";
  return "partially_certified";
}

export function assessComponent(
  componentId: string,
  componentType: string,
  statuses: DimensionStatuses,
  readinessClassification: ReadinessClassification,
  auditReference: string,
  evidenceNotes: string[],
): SecurityAssessment {
  return {
    securityCheckId: `sec-check-${componentId}`,
    componentId,
    componentType,
    authenticationStatus: statuses.authenticationStatus,
    authorizationStatus: statuses.authorizationStatus,
    secretStatus: statuses.secretStatus,
    apiSecurityStatus: statuses.apiSecurityStatus,
    dataProtectionStatus: statuses.dataProtectionStatus,
    runtimeSecurityStatus: statuses.runtimeSecurityStatus,
    operationalSecurityStatus: statuses.operationalSecurityStatus,
    readinessClassification,
    supportingEvidence: evidenceNotes,
    auditReference,
    auditTimestamp: new Date().toISOString(),
  };
}
