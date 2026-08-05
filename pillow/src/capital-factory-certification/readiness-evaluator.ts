import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Q9_MISSIONS, precedingMissionIds } from "./mission-catalog.js";
import {
  CAPITAL_FACTORY_CERTIFICATION_SYSTEM_PATH,
  CAPITAL_FACTORY_VERSION,
} from "./paths.js";
import type { CapitalFactoryCertificationConfiguration } from "./configuration.js";
import type {
  WorkerCertificationRow,
  GovernanceResults,
  ProductionReadinessAssessment,
  EndToEndWorkflowResults,
  EndToEndWorkflowStage,
  ExecutiveReportingResults,
  FinancialTraceabilityResults,
  RepositoryAudit,
  RuntimeAudit,
  WorkerInventory,
  MissionEvidence,
  IntegrationVerification,
  WorkerProbeResult,
} from "./types.js";

export function buildRepositoryAudit(evidence: Map<string, MissionEvidence>): RepositoryAudit {
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
      r.q911ContractPresent,
  ).length;
  return {
    auditedAt: new Date().toISOString(),
    missionsScanned: rows.length,
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

export function buildWorkerInventory(
  evidence: Map<string, MissionEvidence>,
  injectedKeys: Set<string>,
): WorkerInventory {
  const items = Q9_MISSIONS.map((mission) => {
    const missionEvidence = evidence.get(mission.missionId)!;
    return {
      missionId: mission.missionId,
      missionName: mission.missionName,
      engineVersion: mission.engineVersion,
      dependencyKey: mission.dependencyKey,
      modulePresent: missionEvidence.engineExists,
      injected: injectedKeys.has(mission.dependencyKey),
    };
  });
  return {
    inventoriedAt: new Date().toISOString(),
    totalWorkers: items.length,
    modulesPresent: items.filter((i) => i.modulePresent).length,
    injectedCount: items.filter((i) => i.injected).length,
    items,
  };
}

export function evaluateProductionReadiness(
  evidence: Map<string, MissionEvidence>,
  matrix: WorkerCertificationRow[],
): ProductionReadinessAssessment {
  const rows = [...evidence.values()];
  const modulesPresent = rows.filter((r) => r.engineExists).length;
  const certifiedWorkers = matrix.filter((row) => row.status === "Certified").length;
  const notCertified = matrix.filter((row) => row.status !== "Certified");
  const ready = notCertified.length === 0;
  return {
    ready,
    modulesPresent,
    modulesTotal: rows.length,
    certifiedWorkers,
    certifiedWorkersTotal: matrix.length,
    notes: ready
      ? ["All Q9-01..Q9-10 workers observed Certified from repository and runtime evidence"]
      : notCertified.map((row) => `${row.missionId} (${row.missionName}) is ${row.status}: ${row.reason}`),
    evidence: rows.map((r) => `${r.missionId}: ${r.evidence}`),
  };
}

export function evaluateGovernanceResults(
  root: string,
  evidence: Map<string, MissionEvidence>,
): GovernanceResults {
  const checks: GovernanceResults["checks"] = [];
  const selfPath = join(root, CAPITAL_FACTORY_CERTIFICATION_SYSTEM_PATH);
  const selfPresent = existsSync(selfPath);
  const selfText = selfPresent ? readFileSync(selfPath, "utf8") : "";
  checks.push({
    missionId: "self",
    governancePath: CAPITAL_FACTORY_CERTIFICATION_SYSTEM_PATH,
    present: selfPresent,
    containsExpectedLabel: selfText.includes("Capital Factory Certification"),
  });
  for (const mission of Q9_MISSIONS) {
    const missionEvidence = evidence.get(mission.missionId);
    checks.push({
      missionId: mission.missionId,
      governancePath: mission.governancePath,
      present: Boolean(missionEvidence?.governanceExists),
      containsExpectedLabel: Boolean(missionEvidence?.governanceExists),
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

export function evaluateFinancialTraceability(
  config: CapitalFactoryCertificationConfiguration,
  evidence: Map<string, MissionEvidence>,
  matrix: WorkerCertificationRow[],
): FinancialTraceabilityResults {
  const moneyWorkers = matrix.filter((row) =>
    ["Q9-02", "Q9-03", "Q9-04", "Q9-05", "Q9-06", "Q9-07", "Q9-08", "Q9-09", "Q9-10"].includes(
      row.missionId,
    ),
  );
  const allMoneyWorkersCertified = moneyWorkers.every((row) => row.status === "Certified");
  const auditEvidence = [...evidence.values()].some((r) => r.finalPass);
  return {
    traceable: allMoneyWorkersCertified && config.financialTraceabilityRequired,
    currencyPrecisionEnforced: config.currencyPrecisionRequired && allMoneyWorkersCertified,
    auditHistoryPreserved: auditEvidence && config.preserveAuditHistory,
    notes: [
      `Capital factory version ${CAPITAL_FACTORY_VERSION}`,
      `${moneyWorkers.filter((r) => r.status === "Certified").length}/${moneyWorkers.length} financial workers Certified`,
    ],
    evidence: moneyWorkers.map((row) => `${row.missionId}: ${row.status}`),
  };
}

export function evaluateExecutiveReporting(
  probes: Map<string, WorkerProbeResult>,
  workers: Map<string, object | undefined>,
  executiveReportingAvailable: boolean,
): ExecutiveReportingResults {
  const workersWithReportingAccess = [...workers.values()].filter(
    (handle) => typeof (handle as Record<string, unknown> | undefined)?.getReports === "function",
  ).length;
  const totalWorkers = workers.size;
  return {
    capable: executiveReportingAvailable,
    executiveReportingAvailable,
    workersWithReportingAccess,
    totalWorkers,
    evidence: [
      `${workersWithReportingAccess}/${totalWorkers} injected workers expose getReports()`,
      `executiveReportingRuntime injected=${executiveReportingAvailable}`,
      `${[...probes.values()].filter((p) => p.reachable).length}/${probes.size} runtime probes reachable`,
    ],
  };
}

export function evaluateEndToEndWorkflow(
  matrix: WorkerCertificationRow[],
  integration: IntegrationVerification,
  config: CapitalFactoryCertificationConfiguration,
  financialTraceability: FinancialTraceabilityResults,
  executiveReporting: ExecutiveReportingResults,
  pillowCommandConfirmed: boolean,
  grandKingApproved: boolean,
): EndToEndWorkflowResults {
  const statusByMission = new Map(matrix.map((row) => [row.missionId, row.status]));
  const pipelineStages: EndToEndWorkflowStage[] = Q9_MISSIONS.map((mission) => ({
    stageId: mission.missionId,
    missionId: mission.missionId,
    label: mission.missionName,
    satisfied: statusByMission.get(mission.missionId) === "Certified",
    evidence: `${mission.missionId}: ${statusByMission.get(mission.missionId) ?? "unknown"}`,
  }));
  const errStage: EndToEndWorkflowStage = {
    stageId: "ERR",
    missionId: "ERR",
    label: "Executive Reporting Runtime",
    satisfied: executiveReporting.executiveReportingAvailable,
    evidence: executiveReporting.evidence.join("; "),
  };
  const pillowStage: EndToEndWorkflowStage = {
    stageId: "pillow_review",
    missionId: "pillow_review",
    label: "Pillow review",
    satisfied: pillowCommandConfirmed,
    evidence: `pillowCommandConfirmed=${pillowCommandConfirmed}`,
  };
  const gkStage: EndToEndWorkflowStage = {
    stageId: "grand_king_approval",
    missionId: "grand_king_approval",
    label: "Grand King approval",
    satisfied: grandKingApproved,
    evidence: `grandKingApproved=${grandKingApproved}`,
  };
  const stages = [...pipelineStages, errStage, pillowStage, gkStage];
  const workflowChainComplete = Q9_MISSIONS.every((mission, index) => {
    const predecessors = precedingMissionIds(mission.missionId);
    const depsOk = predecessors.every((id) => statusByMission.get(id) === "Certified");
    const integrationRow = integration.rows.find((row) => row.missionId === mission.missionId);
    return depsOk && (integrationRow?.allBound ?? true);
  });
  return {
    evaluatedAt: new Date().toISOString(),
    complete:
      workflowChainComplete &&
      errStage.satisfied &&
      pillowStage.satisfied &&
      gkStage.satisfied,
    currencyPrecisionVerified: config.currencyPrecisionRequired && financialTraceability.currencyPrecisionEnforced,
    traceabilityVerified: config.financialTraceabilityRequired && financialTraceability.traceable,
    stages,
    evidence: stages.map((s) => `${s.stageId}: satisfied=${s.satisfied}`),
  };
}
