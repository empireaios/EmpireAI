import type { ExecutionPipelineStageRecord } from "./types.js";

/** Constitutional execution pipeline (P6-01). */
export const EXECUTION_PIPELINE_REGISTRY: ExecutionPipelineStageRecord[] = [
  { stage: "vision_synchronization", order: 1, owner: "Pillow", description: "Vision Sync validates strategic alignment" },
  { stage: "context_synchronization", order: 2, owner: "Pillow", description: "Context Sync assembles operational context" },
  { stage: "mission_generation", order: 3, owner: "Pillow/Planner", description: "Mission Planner generates constitutional mission" },
  { stage: "integrity_evaluation", order: 4, owner: "VIE", description: "Vision Integrity Engine evaluates Should we do this?" },
  { stage: "dependency_resolution", order: 5, owner: "ECC", description: "ECC resolves mission and architecture dependencies" },
  { stage: "execution_planning", order: 6, owner: "ECC", description: "ECC plans execution order and resource allocation" },
  { stage: "execution_coordination", order: 7, owner: "ECC", description: "ECC coordinates cross-system execution handoff" },
  { stage: "builder_execution", order: 8, owner: "Builder", description: "Cursor Bridge assembles and dispatches to Builder" },
  { stage: "supervisor_observation", order: 9, owner: "Supervisor", description: "Supervisor observes mission state and progress" },
  { stage: "guardian_monitoring", order: 10, owner: "Guardian", description: "Guardian monitors runtime and infrastructure health" },
  { stage: "browser_truth", order: 11, owner: "Browser Truth", description: "Production browser verification" },
  { stage: "grand_king_acceptance", order: 12, owner: "Grand King", description: "Grand King acceptance recorded" },
  { stage: "journey_completion", order: 13, owner: "Journey", description: "Journey System records completion" },
];

export function getPipelineStage(order: number): ExecutionPipelineStageRecord | undefined {
  return EXECUTION_PIPELINE_REGISTRY.find((s) => s.order === order);
}
