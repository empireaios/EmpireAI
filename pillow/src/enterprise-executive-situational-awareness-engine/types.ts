import type { EnterpriseExecutiveSituationalAwarenessEngineConfiguration } from "./configuration.js";
import type {
  EESAE_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  FINDING_DOMAINS,
  FINDING_SEVERITIES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type EesaeCapability = (typeof EESAE_CAPABILITIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type FindingDomain = (typeof FINDING_DOMAINS)[number];
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export type DomainSummary = {
  domain: FindingDomain | "system" | "performance" | "business" | "workforce" | "self";
  summary: string;
  evidenceAvailable: boolean;
  evidenceRefs: string[];
  confidenceScore: number;
  notes: string[];
};

export type AwarenessFinding = {
  findingId: string;
  domain: FindingDomain;
  severity: FindingSeverity;
  title: string;
  evidence: string[];
  probableRootCauses: string[];
  businessImpact: string;
  urgency: "low" | "medium" | "high" | "critical";
  recommendedActions: string[];
  acknowledged: boolean;
  escalated: boolean;
  firstDetectedAt: string;
  lastEscalatedAt: string | null;
};

export type EscalationRecord = {
  escalationId: string;
  findingId: string;
  timestamp: string;
  severity: FindingSeverity;
  message: string;
  acknowledged: boolean;
};

export type ExecutiveRecommendation = {
  recommendationId: string;
  priority: number;
  title: string;
  description: string;
  evidenceRefs: string[];
  findingIds: string[];
  autoApplyForbidden: true;
};

export type PersistentAwarenessState = {
  stateId: string;
  timestamp: string;
  systemHealthSummary: string;
  performanceSummary: string;
  businessSummary: string;
  workforceSummary: string;
  selfAwarenessSummary: string;
  openFindings: AwarenessFinding[];
  escalations: EscalationRecord[];
  recommendations: ExecutiveRecommendation[];
  longTermEmpireValueNotes: string[];
  evidenceRefs: string[];
  confidenceScore: number;
};

export type DeteriorationResult = {
  deteriorationDetected: boolean;
  criticalDeltas: string[];
  evidenceRefs: string[];
  comparedStateIds: [string | null, string];
  notes: string[];
};

export type RootCauseInvestigation = {
  investigationId: string;
  findingId: string | null;
  probableCauses: string[];
  evidence: string[];
  businessImpact: string;
  urgency: "low" | "medium" | "high" | "critical";
};

export type SituationalAwarenessReport = {
  reportId: string;
  reportVersion: typeof import("./paths.js").EESAE_REPORT_VERSION;
  metadataVersion: typeof import("./paths.js").EESAE_METADATA_VERSION;
  engineId: "PILLOW-EESAE-001";
  timestamp: string;
  runTimestamp: string;
  workerId: string;
  missionId: "EESAE-01";
  executiveSummary: string;
  domainSummaries: DomainSummary[];
  deteriorationDetected: boolean;
  findings: AwarenessFinding[];
  recommendations: ExecutiveRecommendation[];
  briefingForGrandKing: string;
  confidenceScore: number;
  neverFabricateMetrics: true;
  neverSilentDeterioration: true;
  constitutionalDutyActive: true;
  digitalSoulAligned: boolean;
  boundaryValidation: BoundaryValidation;
  governanceValidation: GovernanceValidation;
  validation: EesaeValidation;
  historyRefs: string[];
};

export type GrandKingBriefing = {
  briefingId: string;
  timestamp: string;
  missionId: "EESAE-01";
  summary: string;
  criticalFindings: AwarenessFinding[];
  openEscalations: EscalationRecord[];
  topRecommendations: ExecutiveRecommendation[];
  constitutionalDutyActive: true;
  neverFabricateMetrics: true;
};

export type EesaeInput = {
  reportId?: string;
  findingId?: string;
  acknowledgedBy?: string;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateMetrics?: boolean;
  silentSuppressCritical?: boolean;
  autoModifyProduction?: boolean;
  bypassGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  probeSnapshot?: Record<string, unknown>;
};

export type EesaeValidation = {
  decision: ValidationStatus;
  errors: string[];
  warnings: string[];
  durationMs: number;
};

export type BoundaryValidation = {
  passed: boolean;
  neverFabricateMetrics: true;
  neverSilentDeterioration: true;
  neverAutoModifyProduction: true;
  neverBypassGovernance: true;
  issues: string[];
};

export type GovernanceValidation = {
  passed: boolean;
  governanceStatus: string;
  pillowOrchestrationPresent: boolean;
  auditRuntimePresent: boolean;
  digitalSoulPresent: boolean;
  issues: string[];
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "bound" | "ready" | "missing";
  details: string;
  timestamp: string;
};

export type EesaeEngineRecord = {
  engineVersion: "PILLOW-EESAE-001";
  missionId: "EESAE-01";
  workerId: string;
  status: OperationalState;
  healthStatus: EngineHealthStatus;
  supportedCapabilities: EesaeCapability[];
  integrationTargets: IntegrationTarget[];
  totalReports: number;
  totalAwarenessCycles: number;
  openFindings: number;
  openEscalations: number;
  lastReportId: string | null;
  lastStateId: string | null;
  lastConfidenceScore: number | null;
  connectedAt: string | null;
  constitutionalDutyActive: true;
};

export type EnterpriseExecutiveSituationalAwarenessEngineState = {
  engineVersion: "PILLOW-EESAE-001";
  missionId: "EESAE-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: EnterpriseExecutiveSituationalAwarenessEngineConfiguration;
  latestReport: SituationalAwarenessReport | null;
  latestAwarenessState: PersistentAwarenessState | null;
  engineRecord: EesaeEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: ValidationStatus | null;
    totalReports: number;
    openFindings: number;
    openEscalations: number;
    lastReportId: string | null;
    lastStateId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type EesaeCockpitSnapshot = {
  missionId: "EESAE-01";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  openFindings: number;
  openEscalations: number;
  latestReportId: string | null;
  lastStateId: string | null;
  workerId: string;
  briefingPreview: string | null;
  neverFabricateMetrics: true;
  neverSilentDeterioration: true;
  neverAutoModifyProduction: true;
  neverBypassGovernance: true;
  constitutionalDutyActive: true;
};

export type EesaeCatalog = {
  workerId: string;
  reports: Array<{ reportId: string; timestamp: string; confidenceScore: number }>;
  awarenessStates: Array<{ stateId: string; timestamp: string; confidenceScore: number }>;
  integrations: IntegrationHandshake[];
  openFindings: number;
};

export type EesaeDiagnostics = {
  missionId: "EESAE-01";
  workerId: string;
  enabled: boolean;
  reports: number;
  awarenessStates: number;
  openFindings: number;
  openEscalations: number;
  failureCount: number;
  readinessScore: number;
  integrations: Array<{ target: string; bound: boolean }>;
  locks: EnterpriseExecutiveSituationalAwarenessEngineConfiguration;
  constitutionalDutyActive: true;
};

export type AwarenessCycleResult = {
  cycleId: string;
  timestamp: string;
  awarenessState: PersistentAwarenessState;
  deterioration: DeteriorationResult;
  report: SituationalAwarenessReport | null;
  escalations: EscalationRecord[];
};
