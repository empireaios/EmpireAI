import type { EtaPipelineStageRecord } from "./types.js";

/** ETA calculation pipeline (P6-05). */
export const ETA_PIPELINE_REGISTRY: EtaPipelineStageRecord[] = [
  { stage: "elapsed_time", order: 1, description: "Measure time since mission start" },
  { stage: "remaining_work", order: 2, description: "Estimate work remaining from progress and velocity" },
  { stage: "dependency_delay", order: 3, description: "Add delay from blocking dependencies" },
  { stage: "recovery_delay", order: 4, description: "Add delay from active or recent recovery" },
  { stage: "validation_delay", order: 5, description: "Add delay from validation phase duration" },
  { stage: "historical_comparison", order: 6, description: "Compare against historical mission durations" },
  { stage: "confidence_score", order: 7, description: "Score confidence from evidence completeness" },
  { stage: "predicted_completion_time", order: 8, description: "Compute predicted completion timestamp" },
];
