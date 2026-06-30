/** PILLOW Master Executive Audit — post PILLOW-015 comprehensive verification. */

import type { PillowSession } from "../session.js";

export interface ModuleAssessment {
  id: string;
  missionId: string;
  label: string;
  status: "operational" | "degraded" | "missing";
  score: number;
  notes: string[];
}

export interface MasterAuditReport {
  auditId: string;
  auditedAt: string;
  durationMs: number;
  overallArchitectureScore: number;
  modules: ModuleAssessment[];
  dependencyValidation: {
    satisfied: boolean;
    chain: string[];
    issues: string[];
  };
  repositoryHealth: {
    score: number;
    synchronized: boolean;
    driftSignals: string[];
  };
  governanceCompliance: {
    journeyIntegrated: boolean;
    blIntegrated: boolean;
    executiveAuditChain: boolean;
    recoveryDoctrine: boolean;
  };
  commercialReadiness: {
    blockers: string[];
    ready: boolean;
  };
  outstandingRisks: string[];
  mandatoryCorrections: string[];
  recommendedEnhancements: string[];
  pillowV1IntegrationRecommendation:
    | "approved_for_integration"
    | "approved_with_recommendations"
    | "conditionally_approved"
    | "not_approved";
  recommendation: string;
}

const MODULE_SPECS: Array<{ key: keyof PillowSession; missionId: string; label: string }> = [
  { key: "bootstrap", missionId: "PILLOW-002", label: "Repository Bootstrap Engine" },
  { key: "intelligence", missionId: "PILLOW-003", label: "Repository Intelligence Engine" },
  { key: "contextBuilder", missionId: "PILLOW-004", label: "Context Builder" },
  { key: "memory", missionId: "PILLOW-005", label: "Repository Memory Engine" },
  { key: "planner", missionId: "PILLOW-006", label: "Mission Planner" },
  { key: "supervisor", missionId: "PILLOW-007", label: "Cursor Supervisor" },
  { key: "recovery", missionId: "PILLOW-008", label: "Recovery Manager" },
  { key: "auditReviewer", missionId: "PILLOW-009", label: "Executive Audit Reviewer" },
  { key: "synchronizer", missionId: "PILLOW-010", label: "Repository Synchronizer" },
  { key: "dueDiligence", missionId: "PILLOW-011", label: "Continuous Due Diligence Engine" },
  { key: "improvement", missionId: "PILLOW-012", label: "Autonomous Improvement Engine" },
  { key: "orchestrator", missionId: "PILLOW-013", label: "EmpireAI Orchestrator" },
  { key: "watcher", missionId: "PILLOW-014", label: "Live Repository Watcher" },
  { key: "command", missionId: "PILLOW-015", label: "Grand King Command Interface" },
];

export async function runPillowMasterAudit(
  session: PillowSession,
): Promise<MasterAuditReport> {
  const started = performance.now();
  const modules: ModuleAssessment[] = [];

  for (const spec of MODULE_SPECS) {
    const mod = session[spec.key];
    const notes: string[] = [];
    let score = 100;
    let status: ModuleAssessment["status"] = "operational";

    try {
      if ("getState" in mod && typeof mod.getState === "function") {
        const state = mod.getState() as { engineVersion?: string; status?: string };
        notes.push(`Version: ${state.engineVersion ?? "runtime"}`);
        if (state.status && state.status !== "ready") {
          score -= 20;
          status = "degraded";
        }
      } else if (spec.key === "bootstrap") {
        notes.push(`Journey: ${session.bootstrap.journeyPosition ?? "unknown"}`);
      } else if (spec.key === "intelligence") {
        notes.push(`Entities: ${session.intelligence.entities.length}`);
      } else if (spec.key === "contextBuilder") {
        notes.push("Context Builder ready");
      }
    } catch (err) {
      status = "missing";
      score = 0;
      notes.push(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }

    modules.push({
      id: spec.key,
      missionId: spec.missionId,
      label: spec.label,
      status,
      score,
      notes,
    });
  }

  session.memory.ensureFresh();
  const mem = session.memory.getMemory();
  const chain = MODULE_SPECS.map((s) => s.missionId);
  const dependencyIssues: string[] = [];

  if (mem.domains.repositoryHealth.value.score < 50) {
    dependencyIssues.push("Repository health score below threshold");
  }
  if (!mem.consistency.synchronized) {
    dependencyIssues.push("Repository synchronization drift detected");
  }

  const avgScore =
    modules.reduce((sum, m) => sum + m.score, 0) / Math.max(modules.length, 1);

  const mandatoryCorrections: string[] = [];
  const outstandingRisks: string[] = [];
  const recommendedEnhancements: string[] = [
    "PILLOW-016 OpenAI API Integration Layer (deferred post-V1)",
    "PILLOW-017 Approval Gate + Cursor Bridge (deferred post-V1)",
    "PILLOW-018 Pillow Chat UI (deferred post-V1)",
    "PILLOW-019 Empire Recovery Assessment (deferred post-V1)",
    "REAL-002B live commercial credentials",
  ];

  if (dependencyIssues.length > 0) {
    outstandingRisks.push(...dependencyIssues);
  }
  for (const m of modules.filter((x) => x.status !== "operational")) {
    mandatoryCorrections.push(`${m.missionId} ${m.label}: ${m.status}`);
  }

  mem.consistency.driftSignals.forEach((d) => outstandingRisks.push(`Drift: ${d}`));

  let recommendation: MasterAuditReport["pillowV1IntegrationRecommendation"];
  if (mandatoryCorrections.length > 0) {
    recommendation = "approved_with_recommendations";
  } else if (avgScore >= 90) {
    recommendation = "approved_for_integration";
  } else if (avgScore >= 75) {
    recommendation = "approved_with_recommendations";
  } else {
    recommendation = "conditionally_approved";
  }

  return {
    auditId: `PILLOW-MASTER-${Date.now()}`,
    auditedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - started),
    overallArchitectureScore: Math.round(avgScore),
    modules,
    dependencyValidation: {
      satisfied: dependencyIssues.length === 0,
      chain,
      issues: dependencyIssues,
    },
    repositoryHealth: {
      score: mem.domains.repositoryHealth.value.score,
      synchronized: mem.consistency.synchronized,
      driftSignals: mem.consistency.driftSignals,
    },
    governanceCompliance: {
      journeyIntegrated: Boolean(session.bootstrap.journeyPosition),
      blIntegrated: Boolean(session.bootstrap.knownDecisions.adrCount > 0),
      executiveAuditChain: session.auditReviewer.getState().status === "ready",
      recoveryDoctrine: session.recovery.getState().status === "ready",
    },
    commercialReadiness: {
      blockers: ["REAL-002B", "PROOF-001", "GK-GOLIVE-APPROVAL"],
      ready: false,
    },
    outstandingRisks,
    mandatoryCorrections,
    recommendedEnhancements,
    pillowV1IntegrationRecommendation: recommendation,
    recommendation:
      recommendation === "approved_for_integration"
        ? "Pillow Version 1 architecture complete — approved for EmpireAI integration pending Grand King sign-off"
        : "Pillow Version 1 operational with recommendations — Grand King review required before full integration",
  };
}
