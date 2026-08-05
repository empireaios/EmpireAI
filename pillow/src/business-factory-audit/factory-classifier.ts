import { GOVERNED_CERTIFICATION_STATUS, PARTIAL_CERTIFICATION_STATUS } from "./paths.js";
import type {
  BusinessFactoryAssessment,
  CheckStatus,
  DiscoveredFactoryRecord,
  ReadinessClassification,
  RegisteredWorkerRecord,
} from "./types.js";

/**
 * Structural, presence-only workflow-dispatch verification. Probes
 * `pillowOrchestrationRuntime.invokeWorker` presence when injected — it
 * never calls invokeWorker (that would execute real factory business
 * logic). Produces a structural workflow verification record from
 * presence/capability evidence only.
 */
export function probeWorkflowDispatch(
  factoryId: string,
  orchestration: { invokeWorker?: (...args: unknown[]) => unknown } | null | undefined,
): { workflowId: string; workflowStatus: CheckStatus; evidence: string } {
  const workflowId = `wf-bfart-${factoryId}`;
  const capable = Boolean(orchestration) && typeof orchestration!.invokeWorker === "function";
  return {
    workflowId,
    workflowStatus: capable ? "Passed" : "Missing",
    evidence: capable
      ? "pillowOrchestrationRuntime.invokeWorker present — presence/capability evidence only, no business logic executed"
      : "No injected pillowOrchestrationRuntime.invokeWorker — structural workflow verification record produced without executing business logic",
  };
}

/**
 * Verifies factory registration structurally: the factory must be present
 * in the injected Shared Runtime Core discovery, and — for factories that
 * require a dedicated `*FactoryCore` handle — that handle must also be
 * bound. Workforce factories (`workforce-os`, `workforce`) are satisfied by
 * Worker Registry presence + at least one discovered worker instead of a
 * dedicated core. Never fabricates a passing result.
 */
export function classifyRegistration(
  discovered: boolean,
  isDedicatedCoreFactory: boolean,
  dedicatedCoreBound: boolean,
  isWorkforceFactory: boolean,
  workforcePresent: boolean,
): CheckStatus {
  if (!discovered) return "Missing";
  if (isDedicatedCoreFactory) {
    if (dedicatedCoreBound) return "Passed";
    return "Partial";
  }
  if (isWorkforceFactory) {
    if (workforcePresent) return "Passed";
    return "Partial";
  }
  return "Passed";
}

/** Verifies worker coverage: at least one worker with `worker.factory` matching this factory. */
export function classifyWorkerCoverage(workerCount: number): CheckStatus {
  return workerCount > 0 ? "Passed" : "Missing";
}

/** Verifies runtime integration: Shared Runtime Core binding + a reported factory health status. */
export function classifyRuntimeIntegration(
  healthStatus: string | null,
  sharedRuntimeCoreBound: boolean,
): CheckStatus {
  const healthy = Boolean(healthStatus);
  if (healthy && sharedRuntimeCoreBound) return "Passed";
  if (healthy || sharedRuntimeCoreBound) return "Partial";
  return "Missing";
}

/**
 * Verifies external integrations: presence of the shared operational
 * infrastructure a certified factory depends on — Production Certification
 * Core, Monitoring Runtime, and Audit Runtime.
 */
export function classifyExternalIntegration(
  productionCertificationBound: boolean,
  monitoringBound: boolean,
  auditBound: boolean,
): CheckStatus {
  if (productionCertificationBound && monitoringBound && auditBound) return "Passed";
  if (productionCertificationBound || monitoringBound || auditBound) return "Partial";
  return "Missing";
}

/**
 * Verifies factory governance: Pillow Command Audit binding (Q11-03
 * governance chain) plus certification standing of any workers assigned to
 * this factory. Pillow governance is required; never bypassed.
 */
export function classifyGovernance(
  pillowCommandAuditBound: boolean,
  factoryWorkers: RegisteredWorkerRecord[],
): CheckStatus {
  if (factoryWorkers.length === 0) {
    return pillowCommandAuditBound ? "Partial" : "Missing";
  }
  const certifiedCount = factoryWorkers.filter(
    (w) => w.certificationStatus === GOVERNED_CERTIFICATION_STATUS,
  ).length;
  const pendingCount = factoryWorkers.filter(
    (w) => w.certificationStatus === PARTIAL_CERTIFICATION_STATUS,
  ).length;
  const allCertified = certifiedCount === factoryWorkers.length;
  if (allCertified && pillowCommandAuditBound) return "Passed";
  if (certifiedCount > 0 || pendingCount > 0 || pillowCommandAuditBound) return "Partial";
  return "Failed";
}

/**
 * Verifies operational readiness: reported factory health status plus
 * evidence-present flag from Shared Runtime Core discovery.
 */
export function classifyOperationalReadiness(factory: DiscoveredFactoryRecord | undefined): CheckStatus {
  if (!factory) return "Missing";
  const healthy = factory.healthStatus === "healthy" || factory.healthStatus === "active";
  const evidenced = factory.evidencePresent === true;
  if (healthy && evidenced) return "Passed";
  if (healthy || evidenced || Boolean(factory.healthStatus)) return "Partial";
  return "Missing";
}

/**
 * Deterministic classifier from evidence only — never certifies an
 * incomplete workflow or a missing integration.
 *   any dimension Missing -> missing
 *   any critical dimension Failed -> failed
 *   all dimensions Passed -> certified
 *   otherwise -> partially_certified
 * `blocked` and `deferred` are applied by the caller from explicit prior
 * contract/gate evidence or explicit deferral input — never inferred here.
 */
export function classifyBusinessFactoryReadiness(statuses: {
  registrationStatus: CheckStatus;
  workerStatus: CheckStatus;
  workflowStatus: CheckStatus;
  runtimeStatus: CheckStatus;
  integrationStatus: CheckStatus;
  governanceStatus: CheckStatus;
  operationalStatus: CheckStatus;
}): ReadinessClassification {
  const values = Object.values(statuses);
  if (statuses.registrationStatus === "Missing") return "missing";
  if (values.includes("Missing")) return "missing";
  if (values.includes("Failed")) return "failed";
  if (values.every((v) => v === "Passed")) return "certified";
  return "partially_certified";
}

export function assessFactory(
  factoryId: string,
  factoryName: string,
  statuses: {
    registrationStatus: CheckStatus;
    workerStatus: CheckStatus;
    workflowStatus: CheckStatus;
    runtimeStatus: CheckStatus;
    integrationStatus: CheckStatus;
    governanceStatus: CheckStatus;
    operationalStatus: CheckStatus;
  },
  readinessClassification: ReadinessClassification,
  auditReference: string,
  evidenceNotes: string[],
): BusinessFactoryAssessment {
  return {
    factoryId,
    factoryName,
    registrationStatus: statuses.registrationStatus,
    workerStatus: statuses.workerStatus,
    workflowStatus: statuses.workflowStatus,
    runtimeStatus: statuses.runtimeStatus,
    integrationStatus: statuses.integrationStatus,
    governanceStatus: statuses.governanceStatus,
    operationalStatus: statuses.operationalStatus,
    readinessClassification,
    supportingEvidence: evidenceNotes,
    auditReference,
    auditTimestamp: new Date().toISOString(),
  };
}
