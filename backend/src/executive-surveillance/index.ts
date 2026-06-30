export {
  createExecutiveSurveillanceModuleContract,
  EXECUTIVE_SURVEILLANCE_MODULE_ID,
} from "./contract/executive-surveillance-module.js";

export { getExecutiveSurveillanceRuntime } from "./services/executive-surveillance-runtime.js";
export { initializeWatcherRegistry, listRegisteredWatchers, registerWatcher, getActiveWatchers } from "./services/watcher-registry-service.js";
export { runExecutiveSurveillance, listActiveSignals, getRiskSignals, getOpportunitySignals, getExpansionSignals } from "./services/signal-engine-service.js";
export { generateMissionsFromSignals, listSurveillanceMissions, getTodaysMissions, getStrategicMissions } from "./services/mission-generator-service.js";
export { buildExecutiveBriefings, getCeoMorningBrief } from "./services/executive-briefing-service.js";
export { buildSurveillanceDashboard, buildEsisSurveillancePayload } from "./services/surveillance-dashboard-service.js";
export { buildExecutiveSurveillanceHeadquarters } from "./services/surveillance-headquarters-service.js";
export { collectModuleObservations } from "./services/cross-module-observer.js";
export { recordObservationOutcome, listObservationHistory } from "./services/observation-history-service.js";
export { scoreSignalPriority, rankSignals, enrichSignalWithPriority } from "./services/priority-engine-service.js";
export { registerExecutiveSurveillanceRoutes } from "./routes/executive-surveillance-routes.js";
export { executiveSurveillanceTools } from "./tools/executive-surveillance-tools.js";
export { resetExecutiveSurveillanceRepository } from "./repositories/sqlite-ess-repository.js";
export { DEFAULT_WATCHERS } from "./data/default-watchers.js";

export type {
  ExecutiveSignal,
  ExecutiveSignalType,
  ExecutiveObservation,
  ExecutiveAlert,
  ExecutiveSurveillanceMission,
  ExecutiveWatcher,
  ExecutiveSurveillanceRuntime,
  ExecutivePriorityLevel,
  ExecutiveEvidence,
  SurveillanceMissionCategory,
} from "./models/surveillance-core.js";
export type { SurveillanceDashboard, ExecutiveSurveillanceHeadquarters, ExecutiveBriefing } from "./models/surveillance-dashboard.js";
export type { ObservationHistoryRecord, ObservationOutcome } from "./models/observation-history.js";
