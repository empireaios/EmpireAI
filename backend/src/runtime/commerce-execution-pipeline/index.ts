export {
  COMMERCE_EXECUTION_STAGES,
  commerceExecutionPipelineSchema,
  pipelineStageRecordSchema,
} from "./models/commerce-execution-pipeline.js";

export type { CommerceExecutionStage, CommerceExecutionPipeline } from "./models/commerce-execution-pipeline.js";

export {
  buildCommerceExecutionPipeline,
  resetCommerceExecutionPipelines,
} from "./services/commerce-execution-pipeline-service.js";

export { buildGlobalCommerceExecutionDashboard } from "./services/global-commerce-execution-dashboard-service.js";

export { registerCommerceExecutionPipelineRoutes } from "./routes/commerce-execution-pipeline-routes.js";
export { commerceExecutionPipelineTools } from "./tools/commerce-execution-pipeline-tools.js";

export const COMMERCE_EXECUTION_PIPELINE_MODULE_ID = "commerce-execution-pipeline" as const;
export const COMMERCE_EXECUTION_PIPELINE_MISSION_IDS = ["REAL-006"] as const;
export const GLOBAL_COMMERCE_EXECUTION_MISSION_IDS = ["REAL-003", "REAL-004", "REAL-005", "REAL-006", "REAL-007"] as const;
