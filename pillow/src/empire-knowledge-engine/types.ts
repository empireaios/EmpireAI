import type { EmpireKnowledgeEngineConfiguration } from "./configuration.js";
import type { EKE_CAPABILITIES, ENGINE_STATUSES, HEALTH_STATUSES, KNOWLEDGE_CATEGORIES, OPERATIONAL_STATES, VALIDATION_STATUSES } from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type EmpireKnowledgeCapability = (typeof EKE_CAPABILITIES)[number];
export type KnowledgeRelationshipType = "company" | "product" | "customer" | "supplier" | "business_activity";
export type EmpireKnowledgeInput = {
  sourceCompany?: string; targetCompany?: string; knowledgeCategory?: KnowledgeCategory;
  relationshipType?: KnowledgeRelationshipType; confidenceHint?: number; validated?: boolean;
  summary?: string;
};
export type KnowledgeRecord = {
  knowledgeRecordId: string; timestamp: string; sourceCompany: string; targetCompany: string;
  knowledgeCategory: KnowledgeCategory; relationshipType: KnowledgeRelationshipType; confidenceScore: number;
  validationStatus: ValidationStatus; metadataVersion: string; structuralSignalOnly: true;
  neverDistributeUnvalidatedEnterpriseKnowledge: true; preserveKnowledgeTraceability: true;
  preserveAuditability: true; knowledgeTraceId: string; unvalidatedClaim: "none";
};
export type KnowledgeRecommendation = {
  recommendationId: string; timestamp: string; sourceCompany: string; targetCompany: string;
  recommendationSummary: string; knowledgeValue: number; structuralSignalOnly: true;
  neverDistributeUnvalidatedEnterpriseKnowledge: true; unvalidatedClaim: "none";
};
export type KnowledgeValidationReport = {
  validationReportId: string; validationTimestamp: string; decision: "pass" | "partial" | "fail";
  errors: string[]; warnings: string[]; durationMs: number; metadataVersion: string;
};
export type EmpireKnowledgeEngineRecord = {
  engineRecordId: string; timestamp: string; engineId: string; engineVersion: "PILLOW-ENK-001";
  currentOperationalState: OperationalState; healthStatus: HealthStatus; validationStatus: ValidationStatus;
  supportedCapabilities: EmpireKnowledgeCapability[]; frameworkModuleId: string | null;
  dependencyPresence: { empireIntelligenceFramework: boolean }; metadataVersion: string;
};
export type EmpireKnowledgeRunReport = {
  knowledgeRunReportId: string; runTimestamp: string; action: string; engineRecord: EmpireKnowledgeEngineRecord;
  knowledgeRecords: KnowledgeRecord[]; recommendations: KnowledgeRecommendation[];
  validation: KnowledgeValidationReport; durationMs: number; metadataVersion: string;
};
export type EmpireKnowledgeState = {
  engineVersion: "PILLOW-ENK-001"; missionId: "X5-02"; status: EngineStatus; initializedAt: string;
  configuration: EmpireKnowledgeEngineConfiguration; latestReport: EmpireKnowledgeRunReport | null;
  engineRecord: EmpireKnowledgeEngineRecord | null;
  health: { status: HealthStatus; healthScore: number; engineEnabled: boolean; lastOperationAt: string | null; lastValidationDecision: KnowledgeValidationReport["decision"] | null; totalKnowledgeRecords: number; notes: string[] };
};
export type EmpireKnowledgeCockpitSnapshot = {
  engineStatus: EngineStatus; healthStatus: HealthStatus; operationalState: OperationalState | null;
  lastDecision: KnowledgeValidationReport["decision"] | null; totalKnowledgeRecords: number;
  frameworkRegistered: boolean; dependenciesConnected: number; recentLogs: string[];
};
