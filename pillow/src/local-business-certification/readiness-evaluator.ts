import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Q7_MISSIONS, precedingMissionIds } from "./mission-catalog.js";
import { LOCAL_BUSINESS_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import type {
  ComponentStatusRow,
  GovernanceCompliance,
  GovernanceComplianceCheck,
  IntegrationVerification,
  MissionEvidence,
  OperationalReadiness,
  ProductionReadiness,
  ReportingCapability,
  WorkerProbeResult,
  WorkflowCompleteness,
  WorkflowCompletenessStage,
} from "./types.js";

export function evaluateProductionReadiness(
  evidence: Map<string, MissionEvidence>,
  matrix: ComponentStatusRow[],
): ProductionReadiness {
  const rows = [...evidence.values()];
  const modulesPresent = rows.filter((r) => r.moduleExists).length;
  const finalPassCount = rows.filter((r) => r.finalPass).length;
  const notCompleted = matrix.filter((row) => row.status !== "Completed");
  const ready = notCompleted.length === 0;
  return {
    ready,
    modulesPresent,
    modulesTotal: rows.length,
    finalPassCount,
    finalPassTotal: rows.length,
    notes: ready
      ? ["All Q7-01..Q7-10 components observed Completed from repository and runtime evidence"]
      : notCompleted.map((row) => `${row.missionId} (${row.missionName}) is ${row.status}: ${row.reason}`),
    evidence: rows.map((r) => `${r.missionId}: ${r.evidence}`),
  };
}

export function evaluateGovernanceCompliance(
  root: string,
  evidence: Map<string, MissionEvidence>,
): GovernanceCompliance {
  const checks: GovernanceComplianceCheck[] = [];

  const selfPath = join(root, LOCAL_BUSINESS_CERTIFICATION_SYSTEM_PATH);
  const selfPresent = existsSync(selfPath);
  const selfText = selfPresent ? readFileSync(selfPath, "utf8") : "";
  checks.push({
    missionId: "self",
    governancePath: LOCAL_BUSINESS_CERTIFICATION_SYSTEM_PATH,
    present: selfPresent,
    containsExpectedLabel: selfText.includes("Local Business Certification"),
  });

  for (const mission of Q7_MISSIONS) {
    const missionEvidence = evidence.get(mission.missionId);
    checks.push({
      missionId: mission.missionId,
      governancePath: mission.governancePath,
      present: Boolean(missionEvidence?.governanceExists),
      containsExpectedLabel: Boolean(missionEvidence?.governanceExists),
    });
  }

  const missingDocs = checks.filter((c) => !c.present).map((c) => c.governancePath);
  const compliant = checks.every((c) => c.present && c.containsExpectedLabel);
  return {
    compliant,
    checks,
    missingDocs,
    evidence: checks.map(
      (c) => `${c.missionId}: present=${c.present} labelObserved=${c.containsExpectedLabel} path=${c.governancePath}`,
    ),
  };
}

export function evaluateOperationalReadiness(
  probes: Map<string, WorkerProbeResult>,
): OperationalReadiness {
  const values = [...probes.values()];
  const reachableCount = values.filter((p) => p.reachable).length;
  return {
    ready: values.length > 0 && reachableCount === values.length,
    reachableCount,
    totalCount: values.length,
    probes: values,
    notes: values.map((p) => `${p.workerKey}: reachable=${p.reachable} (${p.evidence})`),
  };
}

export function evaluateWorkflowCompleteness(
  matrix: ComponentStatusRow[],
  integration: IntegrationVerification,
): WorkflowCompleteness {
  const statusByMission = new Map(matrix.map((row) => [row.missionId, row.status]));
  const stages: WorkflowCompletenessStage[] = Q7_MISSIONS.map((mission) => {
    const dependsOn = precedingMissionIds(mission.missionId);
    const integrationRow = integration.rows.find((row) => row.missionId === mission.missionId);
    const dependenciesSatisfied =
      dependsOn.every((id) => statusByMission.get(id) === "Completed") &&
      (integrationRow?.allBound ?? dependsOn.length === 0);
    return {
      missionId: mission.missionId,
      dependsOn,
      dependenciesSatisfied,
      evidence: dependsOn.length
        ? `depends on [${dependsOn.join(",")}]; integration=${integrationRow?.evidence ?? "not evaluated"}`
        : "no upstream Q7 dependency",
    };
  });
  return {
    complete: stages.every((stage) => stage.dependenciesSatisfied),
    stages,
    evidence: stages.map(
      (stage) => `${stage.missionId}: dependenciesSatisfied=${stage.dependenciesSatisfied}`,
    ),
  };
}

export function evaluateReportingCapability(
  probes: Map<string, WorkerProbeResult>,
  workers: Map<string, object | undefined>,
  executiveReportingAvailable: boolean,
): ReportingCapability {
  const workersWithReportingAccess = [...workers.values()].filter(
    (handle) => typeof (handle as Record<string, unknown> | undefined)?.getReports === "function",
  ).length;
  const totalWorkers = workers.size;
  return {
    capable: executiveReportingAvailable && workersWithReportingAccess === totalWorkers,
    workersWithReportingAccess,
    totalWorkers,
    executiveReportingAvailable,
    evidence: [
      `${workersWithReportingAccess}/${totalWorkers} injected workers expose getReports()`,
      `executiveReportingRuntime injected=${executiveReportingAvailable}`,
    ],
  };
}
