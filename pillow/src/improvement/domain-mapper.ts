import type { OpportunityKind } from "../due-diligence/types.js";
import type { ImprovementDomain, ImprovementProposal } from "./types.js";

const KIND_TO_DOMAIN: Record<OpportunityKind, ImprovementDomain> = {
  architecture_improvement: "repository_architecture",
  commercial_opportunity: "commercial_architecture",
  repository_improvement: "journey",
  mission_improvement: "mission_planning",
  automation_opportunity: "automation",
  workflow_improvement: "executive_governance",
  cost_reduction: "engineering_architecture",
  performance_optimization: "engineering_architecture",
  engineering_simplification: "pillow",
  future_product_opportunity: "other",
};

export function mapKindToDomain(kind: OpportunityKind): ImprovementDomain {
  return KIND_TO_DOMAIN[kind] ?? "other";
}

export function inferContracts(domain: ImprovementDomain): string[] {
  const map: Partial<Record<ImprovementDomain, string[]>> = {
    repository_architecture: ["PILLOW_ARCHITECTURE_CONTRACT.md"],
    engineering_architecture: ["PILLOW_ARCHITECTURE_CONTRACT.md"],
    commercial_architecture: ["EMPIREAI_STATUS.md", "PROGRAM_CATALOG"],
    mission_planning: ["PILLOW_ARCHITECTURE_CONTRACT.md Part 7"],
    journey: ["JOURNEY.md", "EMPIREAI_JOURNEY_FIRST_DOCTRINE.md"],
    repository_synchronization: [
      "EMPIREAI_JOURNEY_FIRST_DOCTRINE.md",
      "EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md",
    ],
    recovery: ["EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md"],
    executive_governance: ["EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md"],
    pillow: ["PILLOW_ARCHITECTURE_CONTRACT.md"],
    ux: ["UX_IMPLEMENTATION_CONTRACT.md"],
  };
  return map[domain] ?? ["PILLOW_ARCHITECTURE_CONTRACT.md"];
}

export function inferModules(domain: ImprovementDomain): string[] {
  const map: Partial<Record<ImprovementDomain, string[]>> = {
    repository_architecture: ["pillow/src/intelligence/", "pillow/src/bootstrap/"],
    mission_planning: ["pillow/src/planner/"],
    journey: ["pillow/src/synchronizer/"],
    repository_synchronization: ["pillow/src/synchronizer/"],
    recovery: ["pillow/src/recovery/", "pillow/src/supervisor/"],
    automation: ["pillow/src/supervisor/", "pillow/src/due-diligence/"],
    executive_governance: ["pillow/src/audit-reviewer/"],
    pillow: ["pillow/src/"],
    commercial_architecture: ["backend/", "EMPIREAI_STATUS.md"],
  };
  return map[domain] ?? ["pillow/src/"];
}

export function effortFromPriority(
  priority: string,
): ImprovementProposal["estimatedEngineeringEffort"] {
  if (priority === "critical") return "critical";
  if (priority === "high") return "high";
  if (priority === "normal") return "medium";
  return "low";
}
