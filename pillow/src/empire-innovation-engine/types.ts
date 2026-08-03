import type { EmpireInnovationEngineConfiguration } from "./configuration.js";
import type { EIN_CAPABILITIES, ENGINE_STATUSES, HEALTH_STATUSES, OPERATIONAL_STATES, VALIDATION_STATUSES } from "./paths.js";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type EmpireInnovationCapability = (typeof EIN_CAPABILITIES)[number];
export type EmpireInnovationInput = {
  innovationCategory?: string; sourceKnowledge?: string; targetBusiness?: string; innovationScore?: number; expectedBusinessValue?: number;
  priorityLevel?: number; recommendationSummary?: string; validated?: boolean; innovationId?: string; outcome?: string;
};
export type InnovationRecord = {
  innovationId: string; timestamp: string; innovationCategory: string; sourceKnowledge: string; targetBusiness: string;
  innovationScore: number; expectedBusinessValue: number; priorityLevel: number; recommendationSummary: string;
  validationStatus: ValidationStatus; metadataVersion: string; structuralSignalOnly: true;
  neverPromoteUnvalidatedInnovationsIntoProductionAutomatically: true; preserveInnovationTraceability: true; preserveAuditability: true;
  innovationTraceId: string; unvalidatedClaim: "none"; approvedForProduction: false; maskSensitiveValues: true;
};
export type InnovationRecommendation = {
  recommendationId: string; timestamp: string; innovationId: string; recommendationSummary: string; priorityLevel: number;
  structuralSignalOnly: true; neverPromoteUnvalidatedInnovationsIntoProductionAutomatically: true; approvedForProduction: false; unvalidatedClaim: "none";
};
export type InnovationValidationReport = { validationReportId: string; validationTimestamp: string; decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[]; durationMs: number; metadataVersion: string; };
export type EmpireInnovationEngineRecord = {
  engineRecordId: string; timestamp: string; engineId: string; engineVersion: "PILLOW-EIN-001";
  currentOperationalState: OperationalState; healthStatus: HealthStatus; validationStatus: ValidationStatus;
  supportedCapabilities: EmpireInnovationCapability[]; frameworkModuleId: string | null;
  dependencyPresence: { empireIntelligenceFramework: boolean; empireMemoryEngine: boolean; empireKnowledgeEngine: boolean }; metadataVersion: string;
};
export type EmpireInnovationRunReport = { innovationRunReportId: string; runTimestamp: string; action: string; engineRecord: EmpireInnovationEngineRecord; innovationRecords: InnovationRecord[]; recommendations: InnovationRecommendation[]; validation: InnovationValidationReport; durationMs: number; metadataVersion: string; };
export type EmpireInnovationState = {
  engineVersion: "PILLOW-EIN-001"; missionId: "X5-07"; status: EngineStatus; initializedAt: string;
  configuration: EmpireInnovationEngineConfiguration; latestReport: EmpireInnovationRunReport | null; engineRecord: EmpireInnovationEngineRecord | null;
  health: { status: HealthStatus; healthScore: number; engineEnabled: boolean; lastOperationAt: string | null; lastValidationDecision: InnovationValidationReport["decision"] | null; totalInnovationRecords: number; notes: string[] };
};
export type EmpireInnovationCockpitSnapshot = { engineStatus: EngineStatus; healthStatus: HealthStatus; operationalState: OperationalState | null; lastDecision: InnovationValidationReport["decision"] | null; totalInnovationRecords: number; frameworkRegistered: boolean; dependenciesConnected: number; recentLogs: string[]; };
