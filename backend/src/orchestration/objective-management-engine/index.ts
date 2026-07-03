export {
  EXECUTIVE_PRIORITIES,
  OBJECTIVE_STATUSES,
  OBJECTIVE_HEALTH,
  executiveObjectiveSchema,
  objectiveDashboardSchema,
  implementationAssessmentSchema,
} from "./models/objective-management.js";
export type {
  ExecutiveObjective,
  ExecutivePriority,
  ObjectiveStatus,
  ObjectiveHealth,
  ObjectiveDashboard,
  ObjectiveAlert,
  ImplementationAssessment,
} from "./models/objective-management.js";

export {
  ensureObjectiveManagementTables,
  getObjectiveManagementRepository,
  resetObjectiveManagementRepository,
} from "./repositories/sqlite-objective-management-repository.js";

export {
  initializeObjectiveManagement,
  listActiveObjectives,
  getObjective,
  evaluateObjective,
  evaluateAllActiveObjectives,
  buildObjectiveDashboard,
  assessImplementationRecommendation,
  getObjectiveReportingSummary,
  prioritizeObjectives,
} from "./services/objective-management-service.js";

export { objectiveManagementTools } from "./tools/objective-management-tools.js";
export { registerObjectiveManagementRoutes } from "./routes/objective-management-routes.js";
