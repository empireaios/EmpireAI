/** E5-08 — Exception lifecycle management. */

import { logLifecycleTransition } from "./audit-logging.js";
import { findPolicyForDomain } from "./exception-policy-registry.js";
import type { ExceptionManagerConfiguration } from "./configuration.js";
import type {
  ExceptionLifecycleState,
  ExceptionPolicyRecord,
  ExceptionRecord,
  ExceptionRegistrationRequest,
  ExceptionRegistrationResponse,
  ExceptionApprovalRequest,
  GovernedExceptionDomain,
} from "./types.js";

const managedExceptions = new Map<string, ExceptionRecord>();

export function getManagedExceptions(): ExceptionRecord[] {
  return [...managedExceptions.values()];
}

export function registerException(
  request: ExceptionRegistrationRequest,
  policies: ExceptionPolicyRecord[],
  config: ExceptionManagerConfiguration,
): ExceptionRegistrationResponse {
  const policy = findPolicyForDomain(policies, request.category);
  const durationDays = Math.min(
    request.durationDays ?? config.defaultMaxDurationDays,
    policy?.maxDurationDays ?? config.defaultMaxDurationDays,
  );
  const start = new Date();
  const exp = new Date(start);
  exp.setDate(exp.getDate() + durationDays);

  const exceptionId = `eexc-reg-${Date.now()}`;
  const requiresApproval = policy?.requiresExecutiveApproval ?? config.executiveApprovalRequired;
  const status: ExceptionLifecycleState = requiresApproval ? "pending_approval" : "active";

  const record: ExceptionRecord = {
    exceptionId,
    exceptionTitle: request.title,
    category: request.category,
    origin: `Registered by ${request.requestedBy}`,
    reason: request.reason,
    businessJustification: request.businessJustification,
    applicablePolicy: policy?.title ?? "Default Exception Policy",
    applicableConstitution: "Constitution Hierarchy · E5-08",
    approvingAuthority: requiresApproval ? "Pending Executive Approval" : request.requestedBy,
    businessImpact: "Pending assessment",
    strategicImpact: "Controlled exception under governance",
    riskLevel: request.riskLevel ?? config.defaultSeverity,
    classification: "temporary_exception",
    startDate: start.toISOString().slice(0, 10),
    expirationDate: exp.toISOString().slice(0, 10),
    currentStatus: status,
    confidence: 85,
    evidence: [`Registered by ${request.requestedBy}`, policy ? `Policy: ${policy.policyId}` : "Default policy"],
  };

  managedExceptions.set(exceptionId, record);
  logLifecycleTransition({
    exceptionId,
    actor: request.requestedBy,
    previousStatus: "detected",
    newStatus: status,
    details: `Exception registered: ${request.title}`,
  });

  return {
    exceptionId,
    status,
    requiresApproval,
    expirationDate: record.expirationDate,
    message: requiresApproval
      ? "Exception registered — pending executive approval"
      : "Exception registered and active",
  };
}

export function approveException(request: ExceptionApprovalRequest): ExceptionRecord | null {
  const record = managedExceptions.get(request.exceptionId);
  if (!record) return null;

  const previous = record.currentStatus;
  record.currentStatus = request.approved ? "active" : "rejected";
  record.approvingAuthority = request.approvedBy;
  if (request.notes) record.evidence.push(`Approval notes: ${request.notes}`);

  logLifecycleTransition({
    exceptionId: request.exceptionId,
    actor: request.approvedBy,
    previousStatus: previous,
    newStatus: record.currentStatus,
    details: request.approved ? "Exception approved" : "Exception rejected",
  });

  return { ...record };
}

export function resolveException(exceptionId: string, actor: string): ExceptionRecord | null {
  const record = managedExceptions.get(exceptionId);
  if (!record) return null;

  const previous = record.currentStatus;
  record.currentStatus = "resolved";
  logLifecycleTransition({
    exceptionId,
    actor,
    previousStatus: previous,
    newStatus: "resolved",
    details: "Exception resolved",
  });
  return { ...record };
}

export function seedManagedExceptions(records: ExceptionRecord[]): void {
  for (const r of records) {
    if (!managedExceptions.has(r.exceptionId)) {
      managedExceptions.set(r.exceptionId, { ...r });
    }
  }
}

export function resetManagedExceptionsForTesting(): void {
  managedExceptions.clear();
}
