import type { EmpireIntelligenceFrameworkConfiguration } from "./configuration.js";
import type { ENGINE_STATUSES, FRAMEWORK_CAPABILITIES, HEALTH_STATUSES, MODULE_STATES, MODULE_TYPES, VALIDATION_STATUSES } from "./paths.js";
export type EngineStatus = (typeof ENGINE_STATUSES)[number]; export type ModuleState = (typeof MODULE_STATES)[number];
export type ModuleType = (typeof MODULE_TYPES)[number]; export type FrameworkCapability = (typeof FRAMEWORK_CAPABILITIES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number]; export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type IntelligenceModuleDefinition = {
  intelligenceModuleIdentifier: string; moduleVersion: string; moduleType: ModuleType; integrationMissionId?: string;
  supportedCapabilities: FrameworkCapability[]; eventTopics?: string[];
};
export type EmpireIntelligenceFrameworkRecord = {
  frameworkId: string; timestamp: string; intelligenceModuleIdentifier: string; moduleVersion: string;
  moduleStatus: ModuleState; supportedCapabilities: FrameworkCapability[]; validationStatus: ValidationStatus;
  healthStatus: HealthStatus; operationalState: ModuleState; metadataVersion: string; moduleType: ModuleType;
  structuralSignalOnly: true; bypassedValidation: false; auditabilityPreserved: true; recoveryCapable: true;
};
export type EmpireIntelligenceValidationReport = {
  validationReportId: string; validationTimestamp: string; decision: "pass"|"partial"|"fail";
  frameworkId: string|null; errors: string[]; warnings: string[]; durationMs: number; metadataVersion: string;
};
export type EmpireIntelligenceFrameworkRunReport = {
  frameworkRunReportId: string; runTimestamp: string; action: string; records: EmpireIntelligenceFrameworkRecord[];
  validation: EmpireIntelligenceValidationReport; durationMs: number; metadataVersion: string;
};
export type EmpireIntelligenceFrameworkHealthReport = {
  status: HealthStatus; healthScore: number; frameworkEnabled: boolean; registeredModules: number;
  activeModules: number; notes: string[];
};
export type EmpireIntelligenceFrameworkState = {
  engineVersion: "PILLOW-EIF-001"; missionId: "X5-01"; status: EngineStatus; initializedAt: string;
  configuration: EmpireIntelligenceFrameworkConfiguration; latestReport: EmpireIntelligenceFrameworkRunReport|null;
  registeredModules: EmpireIntelligenceFrameworkRecord[]; health: EmpireIntelligenceFrameworkHealthReport;
};
export type EmpireIntelligenceCockpitSnapshot = {
  engineStatus: EngineStatus; healthStatus: HealthStatus; registeredModules: number; activeModules: number;
  lastDecision: "pass"|"partial"|"fail"|null; recentLogs: string[];
};
export type RegisterEmpireIntelligenceModuleInput = { definition: IntelligenceModuleDefinition; forceRegister?: boolean };
export type RouteIntelligenceEventInput = { intelligenceModuleIdentifier: string; topic: string; payloadRef?: string };
