import {
  assembleExecutiveExceptionManager,
  buildFallbackExecutiveExceptionManager,
  runExceptionRegistration,
  runExceptionApproval,
  runExceptionResolution,
  getExceptionPolicyRegistry,
  getExceptionConfiguration,
  getExceptionAuditHistory,
} from "@empireai/pillow";
import type { ExceptionRegistrationRequest, ExceptionApprovalRequest, ExceptionPolicyRecord, ExceptionManagerConfiguration } from "@empireai/pillow";

/** Fallback Executive Exception Manager when Pillow session is unavailable. */
export function collectExecutiveExceptionManagerSnapshot() {
  const engine = buildFallbackExecutiveExceptionManager();
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-08",
    live: false,
    executiveExceptionManager: engine,
  };
}

export function registerExecutiveException(request: ExceptionRegistrationRequest) {
  const response = runExceptionRegistration(request);
  return {
    computedAt: new Date().toISOString(),
    registration: response,
  };
}

export function approveExecutiveException(request: ExceptionApprovalRequest) {
  const result = runExceptionApproval(request);
  if (!result) return { error: "Exception not found", exceptionId: request.exceptionId };
  return {
    computedAt: new Date().toISOString(),
    exception: result,
  };
}

export function resolveExecutiveException(exceptionId: string, actor: string) {
  const result = runExceptionResolution(exceptionId, actor);
  if (!result) return { error: "Exception not found", exceptionId };
  return {
    computedAt: new Date().toISOString(),
    exception: result,
  };
}

export function getExecutiveExceptionPolicies(): {
  computedAt: string;
  policies: ExceptionPolicyRecord[];
  configuration: ExceptionManagerConfiguration;
} {
  return {
    computedAt: new Date().toISOString(),
    policies: getExceptionPolicyRegistry(),
    configuration: getExceptionConfiguration(),
  };
}

export function getExecutiveExceptionReport() {
  const engine = buildFallbackExecutiveExceptionManager();
  return {
    computedAt: new Date().toISOString(),
    report: engine.executiveReport,
    metrics: engine.metrics,
    monitoring: engine.monitoringStatus,
  };
}

export function getExecutiveExceptionHistory() {
  return {
    computedAt: new Date().toISOString(),
    auditHistory: getExceptionAuditHistory(100),
  };
}

export function getExecutiveExceptionHealth() {
  const engine = buildFallbackExecutiveExceptionManager();
  return {
    computedAt: new Date().toISOString(),
    health: engine.healthStatus,
    metrics: engine.metrics,
    engineHealth: engine.engineHealth,
    exceptionHealth: engine.exceptionHealth,
  };
}

export { assembleExecutiveExceptionManager, buildFallbackExecutiveExceptionManager };
