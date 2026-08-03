import type { EmpireOpportunityEngineConfiguration } from "./configuration.js";
import type { EOP_CAPABILITIES, ENGINE_STATUSES, HEALTH_STATUSES, OPERATIONAL_STATES, VALIDATION_STATUSES } from "./paths.js";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type EmpireOpportunityCapability = (typeof EOP_CAPABILITIES)[number];
export type EmpireOpportunityInput = {
  opportunityCategory?: string; industry?: string; market?: string; opportunityScore?: number; estimatedBusinessValue?: number;
  priorityLevel?: number; recommendationSummary?: string; validated?: boolean; opportunityId?: string; outcome?: string;
};
export type OpportunityRecord = {
  opportunityId: string; timestamp: string; opportunityCategory: string; industry: string; market: string;
  opportunityScore: number; estimatedBusinessValue: number; priorityLevel: number; recommendationSummary: string;
  validationStatus: ValidationStatus; metadataVersion: string; structuralSignalOnly: true;
  neverRecommendOpportunitiesUsingUnvalidatedIntelligence: true; preserveOpportunityTraceability: true; preserveAuditability: true;
  opportunityTraceId: string; unvalidatedClaim: "none"; maskSensitiveValues: true;
};
export type OpportunityRecommendation = {
  recommendationId: string; timestamp: string; opportunityId: string; recommendationSummary: string; priorityLevel: number;
  structuralSignalOnly: true; neverRecommendOpportunitiesUsingUnvalidatedIntelligence: true; unvalidatedClaim: "none";
};
export type OpportunityValidationReport = { validationReportId: string; validationTimestamp: string; decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[]; durationMs: number; metadataVersion: string; };
export type EmpireOpportunityEngineRecord = {
  engineRecordId: string; timestamp: string; engineId: string; engineVersion: "PILLOW-EOP-001";
  currentOperationalState: OperationalState; healthStatus: HealthStatus; validationStatus: ValidationStatus;
  supportedCapabilities: EmpireOpportunityCapability[]; frameworkModuleId: string | null;
  dependencyPresence: { empireIntelligenceFramework: boolean; empireMemoryEngine: boolean; empireKnowledgeEngine: boolean }; metadataVersion: string;
};
export type EmpireOpportunityRunReport = { opportunityRunReportId: string; runTimestamp: string; action: string; engineRecord: EmpireOpportunityEngineRecord; opportunityRecords: OpportunityRecord[]; recommendations: OpportunityRecommendation[]; validation: OpportunityValidationReport; durationMs: number; metadataVersion: string; };
export type EmpireOpportunityState = {
  engineVersion: "PILLOW-EOP-001"; missionId: "X5-06"; status: EngineStatus; initializedAt: string;
  configuration: EmpireOpportunityEngineConfiguration; latestReport: EmpireOpportunityRunReport | null; engineRecord: EmpireOpportunityEngineRecord | null;
  health: { status: HealthStatus; healthScore: number; engineEnabled: boolean; lastOperationAt: string | null; lastValidationDecision: OpportunityValidationReport["decision"] | null; totalOpportunityRecords: number; notes: string[] };
};
export type EmpireOpportunityCockpitSnapshot = { engineStatus: EngineStatus; healthStatus: HealthStatus; operationalState: OperationalState | null; lastDecision: OpportunityValidationReport["decision"] | null; totalOpportunityRecords: number; frameworkRegistered: boolean; dependenciesConnected: number; recentLogs: string[]; };
