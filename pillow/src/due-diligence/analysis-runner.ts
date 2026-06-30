import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import { analyzeMissionIntelligence } from "../planner/analyzer.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type {
  AnalysisDomain,
  ReviewCategory,
  ReviewFinding,
} from "./types.js";

export interface AnalysisContext {
  bootstrap: EmpireBootstrapContext;
  intelligence: RepositoryIntelligenceContext;
  memory: RepositoryMemoryState;
  planner?: MissionPlannerEngine;
  supervisor?: CursorSupervisorEngine;
}

export function runContinuousAnalysis(ctx: AnalysisContext): {
  findings: ReviewFinding[];
  domainsAnalysed: AnalysisDomain[];
  categoriesReviewed: ReviewCategory[];
} {
  const findings: ReviewFinding[] = [];
  const intel = analyzeMissionIntelligence(
    ctx.bootstrap,
    ctx.intelligence,
    ctx.memory,
  );

  // Repository architecture
  if (!ctx.bootstrap.repositoryHealth.healthy) {
    findings.push(finding(
      "architecture_review",
      "repository_architecture",
      "Mandatory bootstrap artifacts incomplete",
      ["bootstrap.repositoryHealth", `${ctx.bootstrap.repositoryHealth.mandatoryPresent}/${ctx.bootstrap.repositoryHealth.mandatoryTotal}`],
      "critical",
    ));
  }

  // Repository health
  if (ctx.memory.domains.repositoryHealth.value.score < 70) {
    findings.push(finding(
      "risk_review",
      "repository_health",
      `Repository health score below threshold: ${ctx.memory.domains.repositoryHealth.value.score}`,
      ["memory.domains.repositoryHealth", ...ctx.intelligence.health.issues.slice(0, 3).map((i) => i.message)],
      ctx.memory.domains.repositoryHealth.value.score < 50 ? "critical" : "high",
    ));
  }

  // Journey consistency / drift
  if (intel.syncRequired || ctx.memory.consistency.driftSignals.length > 0) {
    findings.push(finding(
      "repository_drift_review",
      "journey_consistency",
      "Repository drift detected — Journey synchronization may be required",
      [...ctx.memory.consistency.driftSignals, ...ctx.memory.consistency.issues],
      "high",
    ));
  }

  // Mission progression
  const next = ctx.planner?.determineNextMission() ?? null;
  if (next && next.readiness !== "ready") {
    findings.push(finding(
      "mission_review",
      "mission_progression",
      `Next mission blocked or not ready: ${next.id ?? "none"}`,
      next.blockedBy ?? ["planner.determineNextMission"],
      "normal",
    ));
  }

  // Pillow implementation
  const pillowPending = ctx.memory.domains.pendingMissions.value.filter((m) =>
    m.id.startsWith("PILLOW-"),
  );
  if (pillowPending.length > 0) {
    findings.push(finding(
      "architecture_review",
      "pillow_implementation",
      `${pillowPending.length} Pillow mission(s) pending in Journey`,
      pillowPending.slice(0, 5).map((m) => `${m.id}: ${m.status}`),
      "normal",
    ));
  }

  // Commercial readiness
  if (!intel.commercialReady) {
    findings.push(finding(
      "commercial_review",
      "commercial_readiness",
      "Commercial gate not ready — live credentials or PROOF-001 blockers",
      ctx.intelligence.health.issues
        .filter((i) => /credential|PROOF|REAL-002/i.test(i.message))
        .map((i) => i.message)
        .slice(0, 3),
      "high",
    ));
  }

  // Architecture decisions
  if (ctx.bootstrap.knownDecisions.adrCount < 10) {
    findings.push(finding(
      "governance_review",
      "architecture_decisions",
      "Decision Register may be incomplete for current Pillow maturity",
      [`EMPIREAI_DECISIONS.md ADR count: ${ctx.bootstrap.knownDecisions.adrCount}`],
      "low",
    ));
  }

  // Dependency review
  const broken = ctx.intelligence.health.indicators.brokenDependencyChains;
  if (broken > 0) {
    findings.push(finding(
      "dependency_review",
      "repository_architecture",
      `${broken} broken dependency chain(s) detected`,
      ["intelligence.health.indicators.brokenDependencyChains"],
      "high",
    ));
  }

  // Recovery readiness
  findings.push(finding(
    "risk_review",
    "recovery_readiness",
    "Verify Recovery Doctrine and supervisor stall detection remain operational",
    ["EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md", "pillow/src/recovery/", "pillow/src/supervisor/"],
    "normal",
  ));

  // Repository synchronization
  if (intel.syncRequired) {
    findings.push(finding(
      "repository_review",
      "repository_synchronization",
      "Repository Synchronizer should preview governance sync",
      ["RepositorySynchronizer", "memory.consistency"],
      "normal",
    ));
  }

  // Automation opportunities
  if (ctx.supervisor) {
    const reg = ctx.supervisor.getRegistry();
    const active = reg.activeMission;
    if (active && active.recoveryAttempts > 0) {
      findings.push(finding(
        "automation_review",
        "automation_opportunities",
        `Mission ${active.id} required recovery — review automation gaps`,
        [`recoveryAttempts: ${active.recoveryAttempts}`],
        "normal",
      ));
    }
  }

  // UX implementation
  const uxPending = ctx.memory.domains.pendingMissions.value.filter((m) =>
    m.id.startsWith("UX-"),
  );
  if (uxPending.length > 0) {
    findings.push(finding(
      "mission_review",
      "ux_implementation",
      `${uxPending.length} UX mission(s) still pending post-V1`,
      uxPending.slice(0, 3).map((m) => m.id),
      "low",
    ));
  }

  // Executive governance
  if (!intel.governanceReady) {
    findings.push(finding(
      "governance_review",
      "executive_governance",
      "Governance artifacts incomplete — audits or ADRs missing",
      ["bootstrap.knownExecutiveAudits", "bootstrap.knownDecisions"],
      "high",
    ));
  }

  // Technical debt / scalability heuristics
  if (ctx.intelligence.entities.length > 500) {
    findings.push(finding(
      "scalability_review",
      "future_scalability",
      "Large entity graph — consider indexing or domain partitioning",
      [`entity count: ${ctx.intelligence.entities.length}`],
      "future",
    ));
  }

  // Performance heuristic
  if (ctx.intelligence.health.indicators.duplicateOwnership > 0) {
    findings.push(finding(
      "performance_review",
      "engineering_quality",
      "Duplicate ownership detected — may slow intelligence queries",
      [`duplicateOwnership: ${ctx.intelligence.health.indicators.duplicateOwnership}`],
      "normal",
    ));
  }

  // Security heuristic — no secrets in bootstrap excerpts
  findings.push(finding(
    "security_review",
    "executive_governance",
    "Periodic credential and secret exposure review recommended",
    ["Repository First Doctrine", "no .env in bootstrap catalog"],
    "low",
  ));

  const domainsAnalysed = [...new Set(findings.map((f) => f.domain))];
  const categoriesReviewed = [...new Set(findings.map((f) => f.category))];

  return { findings, domainsAnalysed, categoriesReviewed };
}

function finding(
  category: ReviewCategory,
  domain: AnalysisDomain,
  summary: string,
  evidence: string[],
  severity: ReviewFinding["severity"],
): ReviewFinding {
  return { category, domain, summary, evidence, severity };
}
