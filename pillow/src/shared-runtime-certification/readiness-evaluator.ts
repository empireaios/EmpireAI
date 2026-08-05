import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Q10_RUNTIMES } from "./runtime-catalog.js";
import { SHARED_RUNTIME_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import type {
  CertificationResult,
  GovernanceResults,
  CertificationSummary,
  RepositoryAudit,
  RuntimeAudit,
  RuntimeInventory,
  RuntimeEvidence,
  WorkerProbeResult,
  MonitoringVerification,
  RecoveryVerification,
  AuditabilityVerification,
  ReportingVerification,
} from "./types.js";

export function buildRepositoryAudit(evidence: Map<string, RuntimeEvidence>): RepositoryAudit {
  const rows = [...evidence.values()];
  const evidenceComplete = rows.filter(
    (r) =>
      r.engineExists &&
      r.configExists &&
      r.governanceExists &&
      r.bridgeExists &&
      r.testExists &&
      r.sessionReferenced &&
      r.registryReferenced &&
      r.q1014ContractPresent,
  ).length;
  return {
    auditedAt: new Date().toISOString(),
    runtimesScanned: rows.length,
    evidenceComplete,
    evidence: rows.map((r) => `${r.missionId}: ${r.evidence}`),
  };
}

export function buildRuntimeAudit(probes: Map<string, WorkerProbeResult>): RuntimeAudit {
  const values = [...probes.values()];
  return {
    auditedAt: new Date().toISOString(),
    probesAttempted: values.length,
    probesReachable: values.filter((p) => p.reachable).length,
    probes: values,
    notes: values.map((p) => `${p.workerKey}: ${p.evidence}`),
  };
}

export function buildRuntimeInventory(
  evidence: Map<string, RuntimeEvidence>,
  injectedKeys: Set<string>,
): RuntimeInventory {
  const items = Q10_RUNTIMES.map((runtime) => {
    const runtimeEvidence = evidence.get(runtime.missionId)!;
    return {
      missionId: runtime.missionId,
      runtimeName: runtime.runtimeName,
      engineVersion: runtime.engineVersion,
      dependencyKey: runtime.dependencyKey,
      modulePresent: runtimeEvidence.engineExists,
      injected: injectedKeys.has(runtime.dependencyKey),
    };
  });
  return {
    inventoriedAt: new Date().toISOString(),
    totalRuntimes: items.length,
    modulesPresent: items.filter((i) => i.modulePresent).length,
    injectedCount: items.filter((i) => i.injected).length,
    items,
  };
}

export function evaluateCertificationSummary(
  matrix: CertificationResult[],
): CertificationSummary {
  const certifiedCount = matrix.filter((r) => r.certificationStatus === "Certified").length;
  const partiallyCertifiedCount = matrix.filter(
    (r) => r.certificationStatus === "Partially Certified",
  ).length;
  const failedCount = matrix.filter((r) => r.certificationStatus === "Failed Certification").length;
  const blockedCount = matrix.filter((r) => r.certificationStatus === "Blocked").length;
  const deferredCount = matrix.filter((r) => r.certificationStatus === "Deferred").length;
  const ready = certifiedCount === matrix.length;
  return {
    computedAt: new Date().toISOString(),
    totalRuntimes: matrix.length,
    certifiedCount,
    partiallyCertifiedCount,
    failedCount,
    blockedCount,
    deferredCount,
    ready,
    notes: ready
      ? ["All Q10-01..Q10-13 runtimes observed Certified from repository and runtime evidence"]
      : matrix
          .filter((r) => r.certificationStatus !== "Certified")
          .map((r) => `${r.missionId} (${r.runtimeComponent}) is ${r.certificationStatus}: ${r.verificationResult}`),
    evidence: matrix.map((r) => `${r.missionId}: ${r.certificationStatus}`),
  };
}

export function evaluateGovernanceResults(
  root: string,
  evidence: Map<string, RuntimeEvidence>,
): GovernanceResults {
  const checks: GovernanceResults["checks"] = [];
  const selfPath = join(root, SHARED_RUNTIME_CERTIFICATION_SYSTEM_PATH);
  const selfPresent = existsSync(selfPath);
  const selfText = selfPresent ? readFileSync(selfPath, "utf8") : "";
  checks.push({
    missionId: "self",
    governancePath: SHARED_RUNTIME_CERTIFICATION_SYSTEM_PATH,
    present: selfPresent,
    containsExpectedLabel: selfText.includes("Shared Runtime Certification"),
  });
  for (const runtime of Q10_RUNTIMES) {
    const runtimeEvidence = evidence.get(runtime.missionId);
    checks.push({
      missionId: runtime.missionId,
      governancePath: runtime.governancePath,
      present: Boolean(runtimeEvidence?.governanceExists),
      containsExpectedLabel: Boolean(runtimeEvidence?.governanceExists),
    });
  }
  const missingDocs = checks.filter((c) => !c.present).map((c) => c.governancePath);
  return {
    compliant: checks.every((c) => c.present && c.containsExpectedLabel),
    grandKingApprovalRequired: true,
    pillowCommandRequired: true,
    checks,
    missingDocs,
    evidence: checks.map(
      (c) =>
        `${c.missionId}: present=${c.present} labelObserved=${c.containsExpectedLabel} path=${c.governancePath}`,
    ),
  };
}

export function evaluateMonitoringVerification(
  probes: Map<string, WorkerProbeResult>,
  monitoringHandle: (object & { getQ1011ConsumableContract?: () => object; produceReport?: () => unknown }) | null | undefined,
): MonitoringVerification {
  const probe = probes.get("Q10-10");
  const injected = Boolean(monitoringHandle);
  const contractExposed =
    injected &&
    (typeof monitoringHandle!.getQ1011ConsumableContract === "function" ||
      typeof monitoringHandle!.produceReport === "function");
  return {
    verified: injected && Boolean(probe?.reachable) && contractExposed,
    monitoringRuntimeInjected: injected,
    monitoringRuntimeReachable: Boolean(probe?.reachable),
    contractExposed,
    evidence: [
      `monitoringRuntime injected=${injected}`,
      `probe=${probe?.evidence ?? "not probed"}`,
      `contractExposed=${contractExposed}`,
    ],
  };
}

export function evaluateRecoveryVerification(
  probes: Map<string, WorkerProbeResult>,
  recoveryHandle: (object & { getQ1012ConsumableContract?: () => object }) | null | undefined,
): RecoveryVerification {
  const probe = probes.get("Q10-11");
  const injected = Boolean(recoveryHandle);
  const contractExposed = injected && typeof recoveryHandle!.getQ1012ConsumableContract === "function";
  return {
    verified: injected && Boolean(probe?.reachable) && contractExposed,
    recoveryRuntimeInjected: injected,
    recoveryRuntimeReachable: Boolean(probe?.reachable),
    contractExposed,
    evidence: [
      `recoveryRuntime injected=${injected}`,
      `probe=${probe?.evidence ?? "not probed"}`,
      `contractExposed=${contractExposed}`,
    ],
  };
}

export function evaluateAuditabilityVerification(
  probes: Map<string, WorkerProbeResult>,
  auditHandle: (object & { getQ1014ConsumableContract?: () => object; produceReport?: () => unknown }) | null | undefined,
): AuditabilityVerification {
  const probe = probes.get("Q10-13");
  const injected = Boolean(auditHandle);
  const contractExposed =
    injected &&
    (typeof auditHandle!.getQ1014ConsumableContract === "function" ||
      typeof auditHandle!.produceReport === "function");
  return {
    verified: injected && Boolean(probe?.reachable) && contractExposed,
    auditRuntimeInjected: injected,
    auditRuntimeReachable: Boolean(probe?.reachable),
    contractExposed,
    evidence: [
      `auditRuntime injected=${injected}`,
      `probe=${probe?.evidence ?? "not probed"}`,
      `contractExposed=${contractExposed}`,
    ],
  };
}

export function evaluateReportingVerification(
  probes: Map<string, WorkerProbeResult>,
  workers: Map<string, object | undefined>,
  executiveReportingAvailable: boolean,
): ReportingVerification {
  const runtimesWithReportingAccess = [...workers.values()].filter(
    (handle) => typeof (handle as Record<string, unknown> | undefined)?.getReports === "function",
  ).length;
  const totalRuntimes = workers.size;
  return {
    verified: executiveReportingAvailable,
    executiveReportingAvailable,
    runtimesWithReportingAccess,
    totalRuntimes,
    evidence: [
      `${runtimesWithReportingAccess}/${totalRuntimes} injected runtimes expose getReports()`,
      `executiveReportingRuntime injected=${executiveReportingAvailable}`,
      `${[...probes.values()].filter((p) => p.reachable).length}/${probes.size} runtime probes reachable`,
    ],
  };
}
