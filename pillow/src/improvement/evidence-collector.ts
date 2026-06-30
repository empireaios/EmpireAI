import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import type { DueDiligenceRecommendation } from "../due-diligence/types.js";

export interface AnalysisContext {
  bootstrap: EmpireBootstrapContext;
  intelligence: RepositoryIntelligenceContext;
  memory: RepositoryMemoryState;
}

export function collectEvidence(
  observation: DueDiligenceRecommendation,
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  memory: RepositoryMemoryState,
): string[] {
  const evidence = [...observation.evidence];

  if (observation.affectedOwners.some((o) => /Journey/i.test(o))) {
    evidence.push(`JOURNEY.md position: ${bootstrap.journeyPosition ?? "unknown"}`);
  }
  if (observation.affectedOwners.some((o) => /Status/i.test(o))) {
    evidence.push(`Current mission: ${bootstrap.currentMission ?? "unknown"}`);
  }
  evidence.push(`Repository health score: ${memory.domains.repositoryHealth.value.score}`);
  evidence.push(`Intelligence entities: ${intelligence.entities.length}`);
  evidence.push(`ADR count: ${bootstrap.knownDecisions.adrCount}`);

  if (memory.consistency.driftSignals.length > 0) {
    evidence.push(`Drift: ${memory.consistency.driftSignals.join(", ")}`);
  }

  return [...new Set(evidence)].slice(0, 12);
}

export function analyzeImpact(
  observation: DueDiligenceRecommendation,
): { benefits: string; risks: string[]; commercialImpact: ImprovementProposalCommercialImpact } {
  const risks: string[] = [];
  let commercialImpact: ImprovementProposalCommercialImpact = "none";

  if (observation.kind === "commercial_opportunity") {
    commercialImpact = observation.priority === "critical" ? "critical" : "high";
    risks.push("Commercial timeline dependency on live credentials");
  } else if (observation.kind === "architecture_improvement") {
    commercialImpact = "low";
    risks.push("Architecture change may affect downstream Pillow missions");
  } else if (observation.kind === "repository_improvement") {
    commercialImpact = "medium";
    risks.push("Governance sync required before implementation");
  }

  if (observation.priority === "critical") {
    risks.push("Delay increases operational risk");
  }

  return {
    benefits: observation.expectedBenefit,
    risks: risks.length > 0 ? risks : ["Standard engineering review required"],
    commercialImpact,
  };
}

type ImprovementProposalCommercialImpact =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "critical";
