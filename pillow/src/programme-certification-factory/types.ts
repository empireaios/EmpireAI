import type { ProgrammeCertificationFactoryConfiguration } from "./configuration.js";
import type {
  CERTIFICATION_STATUSES,
  CONSTITUTIONAL_PROGRAMME_CODES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  MISSION_CLASSIFICATIONS,
  OPERATIONAL_STATES,
  PCFCT_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type PcfctCapability = (typeof PCFCT_CAPABILITIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type MissionClassification = (typeof MISSION_CLASSIFICATIONS)[number];
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];
export type ProgrammeCode = (typeof CONSTITUTIONAL_PROGRAMME_CODES)[number];

export type MissionInventoryEntry = {
  missionId: string;
  programmeCode: ProgrammeCode;
  classification: MissionClassification;
  evidenceReferences: string[];
  modulePath: string | null;
  auditPath: string | null;
};

export type RepositorySnapshot = {
  repositorySnapshotId: string | null;
  repositoryFingerprint: string | null;
  repositoryVersion: string | null;
  analysedAt: string;
  readOnly: true;
};

export type ApprovedProgramme = {
  programmeName: string;
  programmeCode: ProgrammeCode;
  evidenceRoot: string | null;
  certificationDoc: string | null;
  intentionallyDeferred: boolean;
  evidencePresent: boolean;
  discoveredAt: string;
};

export type ProgrammeAuditResult = {
  programmeCode: ProgrammeCode;
  programmeName: string;
  auditedAt: string;
  evidenceRoot: string | null;
  evidenceReferences: string[];
  missionInventory: MissionInventoryEntry[];
  certificationDocPresent: boolean;
  moduleRootsPresent: string[];
  readOnly: true;
};

export type ProgrammeGapAnalysis = {
  programmeCode: ProgrammeCode;
  programmeName: string;
  analysedAt: string;
  completedCount: number;
  partialCount: number;
  missingCount: number;
  brokenCount: number;
  duplicateCount: number;
  deferredCount: number;
  gapSummary: string[];
  evidenceReferences: string[];
};

export type CompletionRecommendation = {
  recommendationId: string;
  programmeCode: ProgrammeCode;
  missionId: string | null;
  action: "review" | "complete" | "remediate" | "defer" | "deduplicate";
  description: string;
  rationale: string;
  autoApplyForbidden: true;
  evidenceReferences: string[];
};

export type ProgrammeCertification = {
  certificationId: string;
  programmeName: string;
  programmeCode: ProgrammeCode;
  roadmapVersion: string;
  repositorySnapshot: RepositorySnapshot;
  missionInventory: MissionInventoryEntry[];
  completedMissions: string[];
  partiallyImplementedMissions: string[];
  missingMissions: string[];
  brokenOrDeviatingMissions: string[];
  duplicateMissions: string[];
  intentionallyDeferredMissions: string[];
  evidenceReferences: string[];
  gapSummary: string[];
  completionStatus: MissionClassification;
  certificationStatus: CertificationStatus;
  confidenceScore: number;
  timestamp: string;
};

export type ProgrammeCertificationReport = {
  reportId: string;
  reportVersion: typeof import("./paths.js").PROGRAMME_CERTIFICATION_FACTORY_REPORT_VERSION;
  metadataVersion: typeof import("./paths.js").PCFCT_METADATA_VERSION;
  engineId: "PILLOW-PCFCT-001";
  timestamp: string;
  runTimestamp: string;
  workerId: string;
  missionId: "Q13-06";
  programmeCode: ProgrammeCode;
  programmeName: string;
  programmeCertification: ProgrammeCertification;
  gapAnalysis: ProgrammeGapAnalysis;
  recommendations: CompletionRecommendation[];
  boundaryValidation: BoundaryValidation;
  governanceValidation: GovernanceValidation;
  q1306ContractConsumed: Q1306ContractConsumed;
  neverImplementFutureProgramme: true;
  neverImplementQ1307OrLater: true;
  neverAutoModifyProduction: true;
  neverCertifyFromClaimsAlone: true;
  neverFabricateFindings: true;
  neverBypassGovernance: true;
  programmeCertificationOnly: true;
  supportingEvidence: string[];
  validation: PcfctValidation;
  historyRefs: string[];
};

export type FinalRepositoryConstitutionalCertification = {
  reportId: string;
  metadataVersion: typeof import("./paths.js").PCFCT_METADATA_VERSION;
  engineId: "PILLOW-PCFCT-001";
  missionId: "Q13-06";
  repositorySummary: string;
  certifiedProgrammes: string[];
  deferredProgrammes: string[];
  overallMissionInventory: MissionInventoryEntry[];
  repositoryCompletenessMatrix: Record<ProgrammeCode, { status: CertificationStatus; missionCount: number }>;
  architectureCompleteness: string;
  runtimeCompleteness: string;
  governanceCompleteness: string;
  securitySummary: string;
  productionReadinessSummary: string;
  executiveReadinessSummary: string;
  finalConstitutionalDecision: "constitutionally_complete_with_exceptions" | "withheld" | "failed";
  supportingEvidence: string[];
  remainingConstitutionalExceptions: string[];
  repositoryCertificationTimestamp: string;
  q1306ContractConsumed: boolean;
  neverImplementFutureProgramme: true;
  neverImplementQ1307OrLater: true;
  structuralSignalOnly: true;
};

export type QSeriesConstitutionalCompletionContract = {
  contractId: string;
  contractVersion: typeof import("./paths.js").PCFCT_METADATA_VERSION;
  producedBy: "programme-certification-factory";
  missionId: "Q13-06";
  qSeriesConstitutionallyComplete: boolean;
  neverImplementFutureProgramme: true;
  neverImplementQ1307OrLater: true;
  structuralSignalOnly: true;
  finalConstitutionalDecision: FinalRepositoryConstitutionalCertification["finalConstitutionalDecision"] | null;
  certifiedProgrammes: string[];
  deferredProgrammes: string[];
  remainingConstitutionalExceptions: string[];
  exposedFields: string[];
  notes: string[];
  certificationPrerequisite: boolean;
};

export type Q1306ContractConsumed = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  consumerMissionId: string | null;
  fields: string[];
  evidence: string;
};

export type PcfctInput = {
  reportId?: string;
  programmeCode?: ProgrammeCode;
  missionId?: string;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateFindings?: boolean;
  autoModifyProduction?: boolean;
  certifyFromClaimsAlone?: boolean;
  bypassGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1307OrLater?: boolean;
  inventMissions?: boolean;
};

export type PcfctValidation = {
  decision: ValidationStatus;
  errors: string[];
  warnings: string[];
  durationMs: number;
};

export type BoundaryValidation = {
  passed: boolean;
  neverFabricateFindings: true;
  neverAutoModifyProduction: true;
  neverCertifyFromClaimsAlone: true;
  neverImplementFutureProgramme: true;
  neverImplementQ1307OrLater: true;
  neverBypassGovernance: true;
  issues: string[];
};

export type GovernanceValidation = {
  passed: boolean;
  governanceStatus: string;
  pillowOrchestrationPresent: boolean;
  auditRuntimePresent: boolean;
  issues: string[];
};

export type CertificationHistoryEntry = {
  entryId: string;
  timestamp: string;
  reportId: string;
  certificationId: string;
  programmeCode: ProgrammeCode;
  certificationStatus: CertificationStatus;
  confidenceScore: number;
  evidence: string[];
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "bound" | "ready" | "missing";
  details: string;
  timestamp: string;
};

export type PcfctEngineRecord = {
  engineVersion: "PILLOW-PCFCT-001";
  missionId: "Q13-06";
  workerId: string;
  status: OperationalState;
  healthStatus: EngineHealthStatus;
  supportedCapabilities: PcfctCapability[];
  integrationTargets: IntegrationTarget[];
  totalReports: number;
  totalCertifications: number;
  lastReportId: string | null;
  lastCertificationId: string | null;
  lastConfidenceScore: number | null;
  connectedAt: string | null;
};

export type ProgrammeCertificationFactoryState = {
  engineVersion: "PILLOW-PCFCT-001";
  missionId: "Q13-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: ProgrammeCertificationFactoryConfiguration;
  latestReport: ProgrammeCertificationReport | null;
  latestFinalCertification: FinalRepositoryConstitutionalCertification | null;
  discoveredProgrammes: ApprovedProgramme[];
  engineRecord: PcfctEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: ValidationStatus | null;
    totalReports: number;
    totalCertifications: number;
    lastReportId: string | null;
    lastCertificationId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type ProgrammeCertificationFactoryCockpitSnapshot = {
  missionId: "Q13-06";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalCertifications: number;
  latestReportId: string | null;
  latestCertificationId: string | null;
  workerId: string;
  programmesDiscovered: number;
  programmesCertified: number;
  neverFabricateFindings: true;
  neverAutoModifyProduction: true;
  neverCertifyFromClaimsAlone: true;
  neverImplementFutureProgramme: true;
  neverImplementQ1307OrLater: true;
  neverBypassGovernance: true;
  finalQSeriesMission: true;
};

export type PcfctCatalog = {
  workerId: string;
  reports: Array<{ reportId: string; timestamp: string; programmeCode: ProgrammeCode; confidenceScore: number }>;
  certifications: Array<{ certificationId: string; programmeCode: ProgrammeCode; certificationStatus: CertificationStatus; timestamp: string }>;
  integrations: IntegrationHandshake[];
  certificationHistoryCount: number;
};

export type PcfctDiagnostics = {
  missionId: "Q13-06";
  workerId: string;
  enabled: boolean;
  reports: number;
  certifications: number;
  failureCount: number;
  q1306PrerequisitePresent: boolean;
  readinessScore: number;
  integrations: Array<{ target: string; bound: boolean }>;
  locks: ProgrammeCertificationFactoryConfiguration;
  finalQSeriesMission: true;
};
