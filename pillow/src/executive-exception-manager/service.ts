/** E5-08 — Executive Exception Manager service orchestrator. */

import { getExceptionAuditHistory } from "./audit-logging.js";
import { buildExceptionConfiguration, type ExceptionManagerConfiguration } from "./configuration.js";
import {
  buildExceptionPolicyRegistry,
  getEnabledExceptionPolicies,
} from "./exception-policy-registry.js";
import {
  registerException,
  approveException,
  resolveException,
  getManagedExceptions,
  seedManagedExceptions,
  resetManagedExceptionsForTesting,
} from "./lifecycle.js";
import { buildExceptionMonitoringStatus } from "./monitoring.js";
import { buildExceptionExecutiveReport, buildExceptionMetrics } from "./reporting.js";
import { buildEscalationWorkflows } from "./escalation.js";
import { buildRecoveryWorkflows } from "./recovery.js";
import { resetExceptionAuditForTesting } from "./audit-logging.js";
import type {
  ExceptionPolicyRecord,
  ExceptionRegistrationRequest,
  ExceptionApprovalRequest,
  ExceptionHealthStatus,
  ExceptionRecord,
} from "./types.js";

let policyRegistry = buildExceptionPolicyRegistry();
let configuration = buildExceptionConfiguration();

export function getExceptionPolicyRegistry(): ExceptionPolicyRecord[] {
  return [...policyRegistry];
}

export function getExceptionConfiguration(): ExceptionManagerConfiguration {
  return { ...configuration };
}

export function updateExceptionConfiguration(
  overrides: Partial<ExceptionManagerConfiguration>,
): ExceptionManagerConfiguration {
  configuration = buildExceptionConfiguration({ ...configuration, ...overrides });
  return { ...configuration };
}

export function runExceptionRegistration(request: ExceptionRegistrationRequest) {
  return registerException(request, policyRegistry, configuration);
}

export function runExceptionApproval(request: ExceptionApprovalRequest) {
  return approveException(request);
}

export function runExceptionResolution(exceptionId: string, actor: string) {
  return resolveException(exceptionId, actor);
}

export function initializeExceptionRegistry(records: ExceptionRecord[]): void {
  seedManagedExceptions(records);
  for (const r of records) {
    if (r.currentStatus === "active" || r.currentStatus === "pending_approval") {
      // audit seed handled by assembler lifecycle
    }
  }
}

export function getExceptionHealthStatus(input: { healthScore: number }): ExceptionHealthStatus {
  const history = getExceptionAuditHistory(1);
  return {
    status: input.healthScore >= 85 ? "healthy" : input.healthScore >= 70 ? "stable" : "attention",
    healthScore: input.healthScore,
    policyCount: policyRegistry.length,
    enabledPolicyCount: getEnabledExceptionPolicies(policyRegistry).length,
    auditEventCount: getExceptionAuditHistory(1000).length,
    lastEventAt: history[0]?.timestamp ?? null,
  };
}

export function buildExceptionSubsystems(input: {
  exceptionRecords: ExceptionRecord[];
  exceptionHealth: string;
  healthScore: number;
  activeCount: number;
  pendingCount: number;
  expiringSoonCount: number;
  computedAt: string;
}) {
  initializeExceptionRegistry(input.exceptionRecords);
  const allRecords = [...input.exceptionRecords, ...getManagedExceptions().filter(
    (m) => !input.exceptionRecords.some((r) => r.exceptionId === m.exceptionId),
  )];
  const auditHistory = getExceptionAuditHistory(100);
  const escalationWorkflows = buildEscalationWorkflows(allRecords);
  const recoveryWorkflows = buildRecoveryWorkflows(allRecords, configuration);

  return {
    exceptionPolicies: getExceptionPolicyRegistry(),
    escalationWorkflows,
    recoveryWorkflows,
    exceptionAuditHistory: auditHistory,
    monitoringStatus: buildExceptionMonitoringStatus({
      config: configuration,
      activeCount: input.activeCount,
      pendingCount: input.pendingCount,
      expiringSoonCount: input.expiringSoonCount,
      escalationPendingCount: escalationWorkflows.filter((e) => e.status === "pending").length,
      lastScanAt: input.computedAt,
    }),
    executiveReport: buildExceptionExecutiveReport({
      exceptionHealth: input.exceptionHealth,
      activeCount: input.activeCount,
      pendingCount: input.pendingCount,
      auditHistory,
    }),
    metrics: buildExceptionMetrics({ records: allRecords, auditHistory }),
    healthStatus: getExceptionHealthStatus({ healthScore: input.healthScore }),
  };
}

export function resetExceptionServiceForTesting(): void {
  policyRegistry = buildExceptionPolicyRegistry();
  configuration = buildExceptionConfiguration();
  resetManagedExceptionsForTesting();
  resetExceptionAuditForTesting();
}

export {
  getExceptionAuditHistory,
  buildEscalationWorkflows,
  buildRecoveryWorkflows,
  getEnabledExceptionPolicies,
};
