export {
  COMPETITOR_CHANGE_TYPES,
  COMPETITOR_CHANGE_LABELS,
  competitorChangeTypeSchema,
  validateCompetitorChangeType,
} from "./models/competitor-change-types.js";
export type { CompetitorChangeType } from "./models/competitor-change-types.js";

export {
  competitorProfileSchema,
  validateCompetitorProfile,
} from "./models/competitor-profile.js";
export type { CompetitorProfile } from "./models/competitor-profile.js";

export {
  competitorSnapshotSchema,
  validateCompetitorSnapshot,
} from "./models/competitor-snapshot.js";
export type { CompetitorSnapshot } from "./models/competitor-snapshot.js";

export {
  competitorChangeSchema,
  validateCompetitorChange,
} from "./models/competitor-change.js";
export type { CompetitorChange } from "./models/competitor-change.js";

export {
  ALERT_SEVERITIES,
  competitorAlertSchema,
  validateCompetitorAlert,
} from "./models/competitor-alert.js";
export type { AlertSeverity, CompetitorAlert } from "./models/competitor-alert.js";

export {
  COMPETITOR_INTELLIGENCE_SIGNAL_TYPES,
  competitorIntelligenceSignalSchema,
  validateCompetitorIntelligenceSignal,
} from "./models/competitor-intelligence-signal.js";
export type {
  CompetitorIntelligenceSignalType,
  CompetitorIntelligenceSignal,
} from "./models/competitor-intelligence-signal.js";

export {
  competitorIntelligenceReportSchema,
  validateCompetitorIntelligenceReport,
} from "./models/competitor-intelligence-report.js";
export type {
  CompetitorIntelligenceReportId,
  CompetitorIntelligenceReport,
  CompetitorIntelligenceReportCreateInput,
} from "./models/competitor-intelligence-report.js";

export {
  competitorIntelligenceRecordSchema,
  validateCompetitorIntelligenceRecord,
} from "./models/competitor-intelligence-record.js";
export type {
  CompetitorIntelligenceRecordId,
  CompetitorIntelligenceRecord,
  CompetitorIntelligenceRecordCreateInput,
} from "./models/competitor-intelligence-record.js";

export { mapObservationToSnapshot } from "./mappers/competitor-snapshot-mapper.js";

export {
  detectChanges,
  generateAlertsFromChanges,
  competitorChangeDetection,
} from "./engines/competitor-change-detection-engine.js";

export type {
  CompetitorIntelligenceRepositoryQuery,
  CompetitorIntelligenceRepository,
} from "./repositories/competitor-intelligence-repository.js";

export {
  InMemoryCompetitorIntelligenceRepository,
  createInMemoryCompetitorIntelligenceRepository,
} from "./repositories/in-memory-competitor-intelligence-repository.js";

export {
  COMPETITOR_INTELLIGENCE_SIGNAL_WEIGHTS,
  generateCompetitorIntelligence,
  runCompetitorWatchCycle,
  competitorIntelligenceScoring,
} from "./scoring/competitor-intelligence-scoring.js";
export type {
  CompetitorIntelligenceBrandInput,
  CompetitorIntelligenceInput,
  CompetitorIntelligenceBreakdown,
} from "./scoring/competitor-intelligence-scoring.js";

export {
  CompetitorIntelligenceEngine,
  defaultCompetitorIntelligenceEngine,
} from "./engines/competitor-intelligence-engine.js";

export {
  COMPETITOR_INTELLIGENCE_MODULE_ID,
  COMPETITOR_INTELLIGENCE_MODULE_VERSION,
  COMPETITOR_INTELLIGENCE_CAPABILITIES,
  COMPETITOR_INTELLIGENCE_MODULE_CONTRACT,
  CompetitorIntelligenceModule,
  createCompetitorIntelligenceModule,
  competitorIntelligenceModule,
} from "./contract/competitor-intelligence-module.js";
export type {
  CompetitorIntelligenceModuleId,
  CompetitorIntelligenceCapability,
  CompetitorIntelligenceModuleContract,
} from "./contract/competitor-intelligence-module.js";

export {
  COMPETITOR_WATCH_PROVIDER_ID,
  COMPETITOR_WATCH_PROVIDER_NAME,
  CompetitorWatchConnector,
  createCompetitorWatchConnector,
  buildCompetitorWatchPayload,
} from "../connectors/competitor-watch/competitor-watch-connector.js";
export type { CompetitorWatchPayload } from "../connectors/competitor-watch/competitor-watch-connector.js";
