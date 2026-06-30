export {
  createFounderAutomationModuleContract,
  FOUNDER_AUTOMATION_MODULE_ID,
} from "./contract/founder-automation-module.js";

export { buildFounderJourney } from "./services/founder-journey-service.js";
export { FOUNDER_JOURNEY_STAGE_DEFINITIONS } from "./models/founder-journey.js";
export { buildHumanActionQueue, getHumanActionTask } from "./services/human-action-queue-service.js";
export { analyzeAutomationOpportunities } from "./services/automation-opportunity-service.js";
export { buildFounderWorkloadDashboard, buildEsisFounderAutomationPayload } from "./services/founder-workload-dashboard-service.js";
export { createAutomationPlan, getLatestAutomationPlan } from "./services/automation-planner-service.js";

export { registerFounderAutomationRoutes } from "./routes/founder-automation-routes.js";
export { founderAutomationTools } from "./tools/founder-automation-tools.js";
export { resetFounderAutomationRepository } from "./repositories/sqlite-founder-automation-repository.js";

export type { FounderJourney, FounderJourneyStage, FounderJourneyStageId } from "./models/founder-journey.js";
export type { HumanActionTask, HumanActionQueue } from "./models/human-action-queue.js";
export type { AutomationOpportunitySummary } from "./models/automation-opportunity.js";
export type { FounderWorkloadDashboard } from "./models/founder-dashboard.js";
export type { AutomationPlan, AutomationPlanInput } from "./models/automation-plan.js";
