import { randomUUID } from "node:crypto";
import type { DueDiligenceRecommendation } from "../due-diligence/types.js";
import {
  effortFromPriority,
  inferContracts,
  inferModules,
  mapKindToDomain,
} from "./domain-mapper.js";
import { collectEvidence, analyzeImpact, type AnalysisContext } from "./evidence-collector.js";
import {
  buildMissionSequence,
  determineMissionReadiness,
  verifyDependencies,
} from "./readiness-engine.js";
import type { ImprovementProposal } from "./types.js";

export function generateProposalFromObservation(
  observation: DueDiligenceRecommendation,
  ctx: AnalysisContext & { planner?: import("../planner/engine.js").MissionPlannerEngine },
): ImprovementProposal {
  const domain = mapKindToDomain(observation.kind);
  const repositoryEvidence = collectEvidence(
    observation,
    ctx.bootstrap,
    ctx.intelligence,
    ctx.memory,
  );
  const impact = analyzeImpact(observation);
  const dependencyChecks = verifyDependencies(
    observation,
    ctx.memory,
    ctx.planner,
  );
  const readiness = determineMissionReadiness(
    observation,
    dependencyChecks,
    ctx.memory,
  );

  const title = proposalTitle(observation, domain);
  const objective = `Address: ${observation.reason}`;

  return {
    proposalId: randomUUID(),
    title,
    objective,
    reason: observation.reason,
    domain,
    repositoryEvidence,
    affectedOwners: observation.affectedOwners,
    affectedContracts: inferContracts(domain),
    affectedModules: inferModules(domain),
    expectedBenefits: impact.benefits,
    expectedRisks: impact.risks,
    estimatedEngineeringEffort: effortFromPriority(observation.priority),
    estimatedCommercialImpact: impact.commercialImpact,
    recommendedPriority: observation.priority,
    recommendedMissionSequence: buildMissionSequence(readiness, domain),
    readiness,
    lifecycleStage: "implementation_proposal",
    dependencyChecks,
    sourceObservationId: observation.id,
    requiresGrandKingApproval: true,
    createdAt: new Date().toISOString(),
  };
}

function proposalTitle(
  observation: DueDiligenceRecommendation,
  domain: string,
): string {
  const prefix = domain.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return `${prefix}: ${observation.reason.slice(0, 80)}`;
}

export type { AnalysisContext };
