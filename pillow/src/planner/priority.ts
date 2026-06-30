import type { MissionIntelligence } from "./types.js";
import type { MissionCategory, MissionPriority, MissionReadiness } from "./types.js";

const PRIORITY_ORDER: Record<MissionPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
  deferred: 4,
};

export function comparePriority(a: MissionPriority, b: MissionPriority): number {
  return PRIORITY_ORDER[a] - PRIORITY_ORDER[b];
}

export interface PriorityInput {
  missionId: string;
  category: MissionCategory;
  readiness: MissionReadiness;
  blocksCommercial?: boolean;
  isNextInSequence?: boolean;
  hasBrokenDependencies?: boolean;
  intelligence: MissionIntelligence;
}

export function assignMissionPriority(input: PriorityInput): MissionPriority {
  if (input.readiness === "deferred" || input.readiness === "blocked") {
    return "deferred";
  }

  if (input.readiness === "dependencies_incomplete") {
    return "deferred";
  }

  if (input.blocksCommercial || input.missionId === "REAL-002B") {
    return "critical";
  }

  if (
    input.intelligence.repositoryHealthScore < 30 &&
    input.category === "repository"
  ) {
    return "critical";
  }

  if (input.isNextInSequence && input.category === "pillow") {
    return "high";
  }

  if (input.intelligence.syncRequired && input.category === "repository_synchronization") {
    return "high";
  }

  if (input.category === "governance" || input.category === "journey") {
    return "high";
  }

  if (input.category === "pillow" || input.category === "architecture") {
    return "high";
  }

  if (input.category === "ux" || input.category === "global_component") {
    return "normal";
  }

  if (input.hasBrokenDependencies) {
    return "deferred";
  }

  return "normal";
}

export function readinessFromDependencies(
  satisfied: boolean,
  blockedBy: string[],
): MissionReadiness {
  if (blockedBy.length > 0) return "dependencies_incomplete";
  if (!satisfied) return "blocked";
  return "ready";
}
