import type { EmpireCapitalAllocationConfiguration } from "./configuration.js";
import type { ECA_CAPABILITIES, ENGINE_STATUSES, HEALTH_STATUSES, OPERATIONAL_STATES, VALIDATION_STATUSES } from "./paths.js";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type EmpireCapitalAllocationCapability = (typeof ECA_CAPABILITIES)[number];
export type EmpireCapitalAllocationInput = {
  companyReference?: string; investmentOpportunity?: string; availableCapital?: number; expectedRoi?: number;
  allocationPriority?: number; recommendationSummary?: string; validated?: boolean; capitalAllocationId?: string; outcomeRoi?: number;
};
export type CapitalAllocationRecord = {
  capitalAllocationId: string; timestamp: string; companyReference: string; investmentOpportunity: string;
  availableCapital: number; expectedRoi: number; allocationPriority: number; recommendationSummary: string;
  validationStatus: ValidationStatus; metadataVersion: string; structuralSignalOnly: true;
  neverExecuteCapitalTransfersAutomaticallyWithoutApprovedGovernance: true; preserveAllocationTraceability: true;
  preserveAuditability: true; capitalTraceId: string; unvalidatedClaim: "none"; approvedForTransfer: false;
  maskSensitiveFinancialValues: true;
};
export type CapitalRecommendation = {
  recommendationId: string; timestamp: string; companyReference: string; recommendationSummary: string;
  allocationPriority: number; capitalAllocationId: string | null; structuralSignalOnly: true;
  neverExecuteCapitalTransfersAutomaticallyWithoutApprovedGovernance: true; approvedForTransfer: false; unvalidatedClaim: "none";
};
export type CapitalValidationReport = { validationReportId: string; validationTimestamp: string; decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[]; durationMs: number; metadataVersion: string; };
export type EmpireCapitalAllocationEngineRecord = {
  engineRecordId: string; timestamp: string; engineId: string; engineVersion: "PILLOW-ECA-001";
  currentOperationalState: OperationalState; healthStatus: HealthStatus; validationStatus: ValidationStatus;
  supportedCapabilities: EmpireCapitalAllocationCapability[]; frameworkModuleId: string | null;
  dependencyPresence: { empireIntelligenceFramework: boolean; empireMemoryEngine: boolean; empireKnowledgeEngine: boolean }; metadataVersion: string;
};
export type EmpireCapitalAllocationRunReport = { capitalAllocationRunReportId: string; runTimestamp: string; action: string; engineRecord: EmpireCapitalAllocationEngineRecord; capitalAllocationRecords: CapitalAllocationRecord[]; recommendations: CapitalRecommendation[]; validation: CapitalValidationReport; durationMs: number; metadataVersion: string; };
export type EmpireCapitalAllocationState = {
  engineVersion: "PILLOW-ECA-001"; missionId: "X5-05"; status: EngineStatus; initializedAt: string;
  configuration: EmpireCapitalAllocationConfiguration; latestReport: EmpireCapitalAllocationRunReport | null; engineRecord: EmpireCapitalAllocationEngineRecord | null;
  health: { status: HealthStatus; healthScore: number; engineEnabled: boolean; lastOperationAt: string | null; lastValidationDecision: CapitalValidationReport["decision"] | null; totalCapitalAllocationRecords: number; notes: string[] };
};
export type EmpireCapitalAllocationCockpitSnapshot = { engineStatus: EngineStatus; healthStatus: HealthStatus; operationalState: OperationalState | null; lastDecision: CapitalValidationReport["decision"] | null; totalCapitalAllocationRecords: number; frameworkRegistered: boolean; dependenciesConnected: number; recentLogs: string[]; };
