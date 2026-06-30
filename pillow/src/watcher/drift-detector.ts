import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import type { RepositoryInspection } from "../recovery/types.js";
import type { RepositoryDriftSignal } from "./types.js";

export function detectRepositoryDrift(
  memory: RepositoryMemoryState,
  intelligence: RepositoryIntelligenceContext,
  inspection: RepositoryInspection,
): RepositoryDriftSignal[] {
  const signals: RepositoryDriftSignal[] = [];

  for (const drift of memory.consistency.driftSignals) {
    signals.push({
      id: `memory_drift_${drift}`,
      label: drift.replace(/_/g, " "),
      severity: drift.includes("broken") ? "critical" : "warning",
      evidence: [`memory.consistency.driftSignals`, drift],
    });
  }

  for (const issue of memory.consistency.issues.slice(0, 5)) {
    signals.push({
      id: `consistency_${issue.slice(0, 40)}`,
      label: issue,
      severity: "warning",
      evidence: ["memory.consistency.issues", issue],
    });
  }

  if (!memory.consistency.synchronized) {
    signals.push({
      id: "unsynchronized_artifacts",
      label: "Unsynchronized repository artifacts",
      severity: "warning",
      evidence: ["memory.consistency.synchronized=false"],
    });
  }

  if (!inspection.repositoryIntegrityOk) {
    signals.push({
      id: "git_integrity_conflict",
      label: "Git merge conflict detected",
      severity: "critical",
      evidence: ["git status", inspection.diffSummary],
    });
  }

  const healthIssues = intelligence.health.issues.filter(
    (h) => h.severity === "error" || h.severity === "warning",
  );
  for (const issue of healthIssues.slice(0, 3)) {
    signals.push({
      id: `health_${issue.code}`,
      label: issue.message,
      severity: issue.severity === "error" ? "critical" : "warning",
      evidence: [issue.code, issue.recommendation],
    });
  }

  if (intelligence.health.indicators.brokenDependencyChains > 0) {
    signals.push({
      id: "broken_dependency_chains",
      label: `${intelligence.health.indicators.brokenDependencyChains} broken dependency chain(s)`,
      severity: "warning",
      evidence: [`health.indicators.brokenDependencyChains`],
    });
  }

  if (intelligence.health.indicators.orphanedArtifacts > 0) {
    signals.push({
      id: "orphaned_documents",
      label: `${intelligence.health.indicators.orphanedArtifacts} orphaned artifact(s)`,
      severity: "info",
      evidence: [`health.indicators.orphanedArtifacts`],
    });
  }

  return signals;
}
