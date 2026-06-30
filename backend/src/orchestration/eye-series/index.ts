export {
  EYE_IDS,
  empireObservationSchema,
  eyeIntelligenceReportSchema,
  investigationRecordSchema,
  executiveBriefSchema,
  eyeSeriesDashboardSchema,
  eyeSeriesValidationSchema,
} from "./models/eye-series.js";

export type {
  EyeId,
  EmpireObservation,
  EyeIntelligenceReport,
  InvestigationRecord,
  ExecutiveBrief,
  EyeSeriesDashboard,
  EyeSeriesValidation,
} from "./models/eye-series.js";

export {
  EYE_SERIES_MODULE_ID,
  EYE_SERIES_CAPABILITIES,
  createEyeSeriesModuleContract,
} from "./contract/eye-series-module.js";

export {
  getEyeSeriesRepository,
  resetEyeSeriesRepository,
  recordObservation,
  buildObservationDedupHash,
} from "./repositories/sqlite-eye-series-repository.js";

export {
  runEye,
  runAllEyes,
  listEyeReports,
  getEyeReport,
  searchIntelligence,
  listKnowledgeGraph,
  getEyeSummary,
  completeInvestigation,
  listInvestigationHistory,
  buildEyeSeriesDashboard,
  validateEyeSeries,
} from "./services/eye-series-service.js";

export { EYE_RUNNERS } from "./services/eye-generators.js";
export { eyeSeriesTools } from "./tools/eye-series-tools.js";
export { registerEyeSeriesRoutes } from "./routes/eye-series-routes.js";
