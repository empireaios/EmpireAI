import {
  FACTORY_KEYS,
  GOVERNED_CERTIFICATION_STATUS,
  PARTIAL_CERTIFICATION_STATUS,
  REACHABLE_WORKER_STATES,
  PENDING_WORKER_STATES,
} from "./paths.js";
import type {
  CheckStatus,
  ReadinessClassification,
  RegisteredWorkerRecord,
  WorkerProbeResult,
  WorkerReadinessAssessment,
} from "./types.js";

/**
 * Verifies worker registration structurally: workerId present, factory set,
 * role/department present. Never fabricates a passing result.
 */
export function classifyRegistration(worker: RegisteredWorkerRecord): CheckStatus {
  if (!worker.workerId) return "Missing";
  const hasFactory = Boolean(worker.factory);
  const hasRoleOrDepartment = Boolean(worker.role) || Boolean(worker.department);
  if (hasFactory && hasRoleOrDepartment) return "Passed";
  if (hasFactory || hasRoleOrDepartment) return "Partial";
  return "Failed";
}

/**
 * Verifies worker reachability. When a runtime handle is injected, only a
 * successful read-only probe call counts as reachable. Otherwise falls back
 * to the registry-reported operationalStatus as structural evidence. Never
 * marks a worker ready when unreachable.
 */
export function classifyReachability(
  worker: RegisteredWorkerRecord,
  probe: WorkerProbeResult | undefined,
): CheckStatus {
  if (probe) {
    return probe.reachable ? "Passed" : "Failed";
  }
  const status = worker.operationalStatus ?? "";
  if ((REACHABLE_WORKER_STATES as readonly string[]).includes(status)) return "Passed";
  if ((PENDING_WORKER_STATES as readonly string[]).includes(status)) return "Partial";
  if (!status) return "Missing";
  return "Failed";
}

/**
 * Verifies worker configuration structurally: skillProfile, approvedTools,
 * authorityLevel present.
 */
export function classifyConfiguration(worker: RegisteredWorkerRecord): CheckStatus {
  const present = [
    worker.skillProfile.length > 0,
    worker.approvedTools.length > 0,
    Boolean(worker.authorityLevel),
  ].filter(Boolean).length;
  if (present === 3) return "Passed";
  if (present > 0) return "Partial";
  return "Missing";
}

/**
 * Verifies worker governance: certificationStatus + governingAuthority /
 * reportingLine chain to "pillow" when present. Pillow governance is
 * required.
 */
export function classifyGovernance(worker: RegisteredWorkerRecord): CheckStatus {
  const certified = worker.certificationStatus === GOVERNED_CERTIFICATION_STATUS;
  const certPending = worker.certificationStatus === PARTIAL_CERTIFICATION_STATUS;
  const reportsToPillow =
    worker.governingAuthority === "pillow" || worker.reportingLine.includes("pillow");
  if (certified && reportsToPillow) return "Passed";
  if (certified || certPending || reportsToPillow) return "Partial";
  if (!worker.certificationStatus && worker.reportingLine.length === 0) return "Missing";
  return "Failed";
}

/**
 * Verifies worker permissions: authorityLevel + approvedTools structural
 * checks.
 */
export function classifyPermissions(worker: RegisteredWorkerRecord): CheckStatus {
  const hasAuthority = Boolean(worker.authorityLevel);
  const hasTools = worker.approvedTools.length > 0;
  if (hasAuthority && hasTools) return "Passed";
  if (hasAuthority || hasTools) return "Partial";
  return "Missing";
}

/**
 * Verifies worker runtime connectivity: sharedRuntimeCore /
 * pillowOrchestrationRuntime presence when bound is the primary signal;
 * factory membership against the FACTORY_KEYS catalog is used as
 * supplementary structural evidence when no live runtime binding is
 * injected.
 */
export function classifyRuntimeConnectivity(
  worker: RegisteredWorkerRecord,
  runtimeBound: boolean,
): CheckStatus {
  if (runtimeBound) return "Passed";
  const factoryKnown = Boolean(
    worker.factory && (FACTORY_KEYS as readonly string[]).includes(worker.factory),
  );
  if (factoryKnown) return "Partial";
  if (!worker.factory) return "Missing";
  return "Failed";
}

/**
 * Verifies worker operational capability: operationalStatus + skillProfile
 * non-empty. Capability signals from registry record only.
 */
export function classifyCapability(worker: RegisteredWorkerRecord): CheckStatus {
  const operational = (REACHABLE_WORKER_STATES as readonly string[]).includes(
    worker.operationalStatus ?? "",
  );
  const hasSkills = worker.skillProfile.length > 0;
  if (operational && hasSkills) return "Passed";
  if (operational || hasSkills) return "Partial";
  return "Missing";
}

/**
 * Deterministic classifier from evidence only — never marks a worker Ready
 * when unreachable, never certifies missing workers.
 */
export function classifyReadiness(statuses: {
  registrationStatus: CheckStatus;
  reachabilityStatus: CheckStatus;
  governanceStatus: CheckStatus;
  permissionStatus: CheckStatus;
  dependencyStatus: CheckStatus;
  runtimeStatus: CheckStatus;
  capabilityStatus: CheckStatus;
}): ReadinessClassification {
  const values = Object.values(statuses);
  if (values.includes("Missing")) return "Missing";
  if (statuses.reachabilityStatus === "Failed") return "Failed";
  if (values.every((v) => v === "Passed")) return "Ready";
  if (values.includes("Failed")) return "Failed";
  return "Partially Ready";
}

export function assessWorker(
  worker: RegisteredWorkerRecord,
  probe: WorkerProbeResult | undefined,
  runtimeBound: boolean,
  auditReference: string,
): WorkerReadinessAssessment {
  const registrationStatus = classifyRegistration(worker);
  const reachabilityStatus = classifyReachability(worker, probe);
  const dependencyStatus = classifyConfiguration(worker);
  const governanceStatus = classifyGovernance(worker);
  const permissionStatus = classifyPermissions(worker);
  const runtimeStatus = classifyRuntimeConnectivity(worker, runtimeBound);
  const capabilityStatus = classifyCapability(worker);
  const readinessClassification = classifyReadiness({
    registrationStatus,
    reachabilityStatus,
    governanceStatus,
    permissionStatus,
    dependencyStatus,
    runtimeStatus,
    capabilityStatus,
  });

  const supportingEvidence = [
    `registrationStatus=${registrationStatus}`,
    `reachabilityStatus=${reachabilityStatus} (probed=${Boolean(probe)})`,
    `dependencyStatus=${dependencyStatus}`,
    `governanceStatus=${governanceStatus}`,
    `permissionStatus=${permissionStatus}`,
    `runtimeStatus=${runtimeStatus} (runtimeBound=${runtimeBound})`,
    `capabilityStatus=${capabilityStatus}`,
  ];

  return {
    workerId: worker.workerId,
    workerName: worker.workerName ?? worker.workerId,
    factory: worker.factory ?? "",
    registrationStatus,
    runtimeStatus,
    reachabilityStatus,
    governanceStatus,
    permissionStatus,
    dependencyStatus,
    capabilityStatus,
    readinessClassification,
    supportingEvidence,
    auditReference,
    auditTimestamp: new Date().toISOString(),
  };
}
