import type { SupervisionPipelineStageRecord } from "./types.js";

/** Constitutional supervision pipeline (P6-03). */
export const SUPERVISION_PIPELINE_REGISTRY: SupervisionPipelineStageRecord[] = [
  { stage: "mission_created", order: 1, owner: "Planner", description: "Mission proposal registered" },
  { stage: "mission_accepted", order: 2, owner: "Supervisor", description: "Constitutional gates passed — mission accepted" },
  { stage: "mission_started", order: 3, owner: "Supervisor", description: "Builder execution begins under observation" },
  { stage: "execution_monitoring", order: 4, owner: "Supervisor", description: "Continuous execution observation active" },
  { stage: "progress_monitoring", order: 5, owner: "Supervisor", description: "Progress events and heartbeats tracked" },
  { stage: "dependency_monitoring", order: 6, owner: "Supervisor", description: "Mission dependencies observed" },
  { stage: "risk_monitoring", order: 7, owner: "Supervisor", description: "Risks and warnings classified" },
  { stage: "recovery_monitoring", order: 8, owner: "Supervisor", description: "Recovery behaviour observed" },
  { stage: "validation_monitoring", order: 9, owner: "Supervisor", description: "Validation phase supervised" },
  { stage: "mission_completion", order: 10, owner: "Supervisor", description: "Constitutional completion recorded" },
];
