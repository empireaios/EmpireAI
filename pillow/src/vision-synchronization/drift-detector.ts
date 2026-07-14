import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import type { DriftDomain, DriftFinding, DriftSeverity, SyncStepResult } from "./types.js";

const SEVERITY_RANK: Record<DriftSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function highestDriftSeverity(
  findings: DriftFinding[],
): DriftSeverity | null {
  if (findings.length === 0) return null;
  return findings.reduce<DriftSeverity>(
    (max, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[max] ? f.severity : max),
    "low",
  );
}

export function severityForFailedStep(step: SyncStepResult["step"]): DriftSeverity {
  switch (step) {
    case "vision":
    case "soul":
    case "ctd":
    case "constitution_hierarchy":
      return "critical";
    case "roadmap":
    case "current_roadmap_item":
    case "architecture":
    case "production_truth":
    case "repository":
      return "high";
    default:
      return "medium";
  }
}

export function detectDrift(input: {
  bootstrap: EmpireBootstrapContext;
  memory: RepositoryMemoryState;
  steps: SyncStepResult[];
}): DriftFinding[] {
  const findings: DriftFinding[] = [];
  const { bootstrap, memory, steps } = input;

  for (const step of steps.filter((s) => s.status === "failed")) {
    findings.push({
      domain: stepToDomain(step.step),
      severity: severityForFailedStep(step.step),
      signal: `${step.label} synchronization failed — missing mandatory artifacts`,
      recommendation: `Restore artifacts: ${step.artifactPaths.join(", ")} before implementation`,
    });
  }

  for (const step of steps.filter((s) => s.status === "degraded")) {
    findings.push({
      domain: stepToDomain(step.step),
      severity: "medium",
      signal: `${step.label} partially synchronized`,
      recommendation: `Review ${step.artifactPaths.join(", ")} for completeness`,
    });
  }

  if (!bootstrap.executiveSelfAssessment.coherent) {
    findings.push({
      domain: "constitution",
      severity: "high",
      signal: "Executive self-assessment reports incoherent constitutional state",
      recommendation: "Resolve bootstrap self-assessment failures before engineering",
    });
  }

  if (!memory.consistency.synchronized) {
    findings.push({
      domain: "repository",
      severity: memory.consistency.stale ? "high" : "medium",
      signal: `Repository memory drift: ${memory.consistency.driftSignals.join("; ") || "unsynchronized"}`,
      recommendation: "Refresh repository memory and re-run Vision Synchronization",
    });
  }

  if (!bootstrap.repositoryHealth.healthy) {
    findings.push({
      domain: "repository",
      severity: "high",
      signal: `Repository health degraded — ${bootstrap.repositoryHealth.mandatoryPresent}/${bootstrap.repositoryHealth.mandatoryTotal} mandatory artifacts`,
      recommendation: "Restore mandatory repository artifacts per PILLOW-002 bootstrap",
    });
  }

  const blockers = bootstrap.executiveBriefing.direction.currentBlockers;
  if (blockers.length > 0) {
    findings.push({
      domain: "mission",
      severity: "medium",
      signal: `Active blockers: ${blockers.slice(0, 3).join("; ")}`,
      recommendation: "Grand King review blockers before scope expansion",
    });
  }

  return findings;
}

function stepToDomain(step: SyncStepResult["step"]): DriftDomain {
  switch (step) {
    case "vision":
    case "vision_accumulation":
      return "vision";
    case "soul":
      return "soul";
    case "ctd":
    case "constitution_hierarchy":
      return "constitution";
    case "roadmap":
    case "current_roadmap_item":
      return "roadmap";
    case "architecture":
      return "architecture";
    case "repository":
      return "repository";
    case "production_truth":
    case "current_production_state":
      return "production";
    default:
      return "mission";
  }
}
