import type { AutomationPipelineStageRecord } from "./types.js";
import { AUTOMATION_PIPELINE_STAGES } from "./paths.js";

/** Automation pipeline registry (P6-07). */
export const AUTOMATION_PIPELINE_REGISTRY: AutomationPipelineStageRecord[] =
  AUTOMATION_PIPELINE_STAGES.map((stage, index) => ({
    stage,
    order: index + 1,
    description: stage.replace(/_/g, " "),
  }));
