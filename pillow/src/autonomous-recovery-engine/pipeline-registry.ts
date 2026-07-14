import type { RecoveryPipelineStageRecord } from "./types.js";
import { RECOVERY_ORCHESTRATION_PIPELINE } from "./paths.js";

/** Recovery orchestration pipeline registry (P6-06). */
export const RECOVERY_ORCHESTRATION_REGISTRY: RecoveryPipelineStageRecord[] =
  RECOVERY_ORCHESTRATION_PIPELINE.map((stage, index) => ({
    stage,
    order: index + 1,
    description: stage.replace(/_/g, " "),
  }));
