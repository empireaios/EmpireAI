import type { GlobalExpansionSimulatorConfiguration } from "./configuration.js";
import type { ENGINE_STATUSES, GES_CAPABILITIES, HEALTH_STATUSES, OPERATIONAL_STATES, VALIDATION_STATUSES } from "./paths.js";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type GesCapability = (typeof GES_CAPABILITIES)[number];
export type GlobalExpansionSimulationInput = {
  companyReference?: string; targetCountry?: string; targetRegion?: string; expansionScenario?: string;
  readinessHint?: number; financialHint?: number; riskHint?: number; marketDemandHint?: number; validated?: boolean;
};
export type SimulationRecord = {
  simulationId: string; timestamp: string; companyReference: string; targetCountry: string; targetRegion: string;
  expansionScenario: string; readinessProjection: number; financialProjection: number; riskProjection: number;
  recommendationSummary: string; validationStatus: ValidationStatus; metadataVersion: string;
  structuralSignalOnly: true; neverExecuteSimulatedActionsAgainstProductionSystems: true;
  preserveSimulationTraceability: true; unvalidatedClaim: "none"; simulationTraceId: string;
};
export type SimulationRecommendation = {
  recommendationId: string; timestamp: string; targetCountry: string; targetRegion: string;
  recommendationSummary: string; outcomeScore: number; structuralSignalOnly: true;
  neverExecuteSimulatedActionsAgainstProductionSystems: true; unvalidatedClaim: "none";
};
export type SimulationValidationReport = { validationReportId: string; validationTimestamp: string; decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[]; durationMs: number; metadataVersion: string };
export type GlobalExpansionSimulatorRecord = { engineRecordId: string; timestamp: string; engineId: string; engineVersion: "PILLOW-GES-001"; currentOperationalState: OperationalState; healthStatus: HealthStatus; validationStatus: ValidationStatus; supportedCapabilities: GesCapability[]; frameworkModuleId: string | null; dependencyPresence: { globalExpansionFramework: boolean }; metadataVersion: string };
export type GesRunReport = { simulationRunReportId: string; runTimestamp: string; action: string; engineRecord: GlobalExpansionSimulatorRecord; simulationRecords: SimulationRecord[]; recommendations: SimulationRecommendation[]; validation: SimulationValidationReport; durationMs: number; metadataVersion: string };
export type GesHealthReport = { status: HealthStatus; healthScore: number; engineEnabled: boolean; lastOperationAt: string | null; lastValidationDecision: SimulationValidationReport["decision"] | null; totalSimulationRecords: number; notes: string[] };
export type GlobalExpansionSimulatorState = { engineVersion: "PILLOW-GES-001"; missionId: "X4-17"; status: EngineStatus; initializedAt: string; configuration: GlobalExpansionSimulatorConfiguration; latestReport: GesRunReport | null; engineRecord: GlobalExpansionSimulatorRecord | null; health: GesHealthReport };
export type GesCockpitSnapshot = { engineStatus: EngineStatus; healthStatus: HealthStatus; operationalState: OperationalState | null; lastDecision: SimulationValidationReport["decision"] | null; totalSimulationRecords: number; frameworkRegistered: boolean; dependenciesConnected: number; recentLogs: string[] };
