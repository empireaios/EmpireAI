import type { CursorSpecificationGeneratorConfiguration } from "./configuration.js";
import type {
  CONSTITUTIONAL_SECTIONS,
  CSGEN_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CsgenCapability = (typeof CSGEN_CAPABILITIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ConstitutionalSection = (typeof CONSTITUTIONAL_SECTIONS)[number];

export type RoadmapMissionInput = {
  missionId: string;
  missionName: string;
  deliverable: string;
  programme?: string | null;
  teamId?: string | null;
  programmeId?: string | null;
  evidenceProvided: boolean;
  consumedAt: string;
};

export type RepositorySnapshotReference = {
  repositorySnapshotId: string;
  repositoryFingerprint: string;
  repositoryVersion: string;
  reportId: string | null;
  status: "available" | "unavailable";
};

export type MissionPlanReference = {
  planId: string | null;
  reportId: string | null;
  missionId: string | null;
  status: "available" | "unavailable";
};

export type ImplementationSpecificationReference = {
  reportId: string | null;
  specIds: string[];
  status: "available" | "unavailable";
};

export type SpecificationDependency = {
  dependencyId: string;
  kind: "repository_intelligence" | "mission_planning" | "specification" | "integration" | "governance" | "module";
  description: string;
  source: string;
  required: boolean;
  evidence: string[];
};

export type CursorSpecification = {
  cursorSpecificationId: string;
  programmeId: string | null;
  teamId: string | null;
  missionId: string;
  missionName: string;
  deliverable: string;
  sourceOfTruth: string;
  repositorySnapshotReference: RepositorySnapshotReference;
  implementationSpecificationReference: ImplementationSpecificationReference;
  missionPlanReference: MissionPlanReference;
  dependencies: SpecificationDependency[];
  existingImplementationsToPreserve: string[];
  objective: string;
  requiredCapabilities: string[];
  supportedFeatures: string[];
  modelAndSchemaRequirements: string[];
  mandatoryRules: string[];
  boundaries: string[];
  architecture: string[];
  integrationRequirements: string[];
  implementationRules: string[];
  validationRequirements: string[];
  acceptanceCriteria: string[];
  completionRequirements: string[];
  stopBoundary: string;
  specificationVersion: typeof import("./paths.js").CSGEN_METADATA_VERSION;
  governanceStatus: string;
  approvalStatus: string;
  timestamp: string;
  constitutionalBody: string;
};

export type Q1304ContractConsumed = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  consumerMissionId: string | null;
  fields: string[];
  evidence: string;
};

export type Q1303ContractConsumed = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  consumerMissionId: string | null;
  fields: string[];
  evidence: string;
};

export type Q1302Observation = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

export type GenerationPrerequisite = {
  verified: boolean;
  pillowCommandConfirmed: boolean;
  missionPlanningEnginePresent: boolean;
  q1304ContractAvailable: boolean;
  missionPlanAvailable: boolean;
  repositoryIntelligenceEnginePresent: boolean;
  riengRequired: boolean;
  riengAvailable: boolean;
  missionEvidencePresent: boolean;
  outstandingPrerequisiteIssues: string[];
  evidence: string[];
};

export type CsgenInput = {
  reportId?: string;
  cursorSpecificationId?: string;
  missionId?: string;
  missionName?: string;
  deliverable?: string;
  programme?: string | null;
  programmeId?: string | null;
  teamId?: string | null;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateRepositoryFindings?: boolean;
  inventMission?: boolean;
  renameMission?: boolean;
  alterDeliverable?: boolean;
  implementCode?: boolean;
  executeCursorMission?: boolean;
  bypassGovernance?: boolean;
  selfApprove?: boolean;
  implementQ1305OrLater?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type CsgenValidation = {
  decision: ValidationStatus;
  errors: string[];
  warnings: string[];
  durationMs: number;
};

export type BoundaryValidation = {
  passed: boolean;
  neverImplementCode: true;
  neverExecuteCursorMissions: true;
  neverImplementQ1305OrLater: true;
  neverSelfApprove: true;
  neverInventMissions: true;
  neverFabricateRepositoryFindings: true;
  neverBypassGovernance: true;
  issues: string[];
};

export type GovernanceValidation = {
  passed: boolean;
  approvalStatus: string;
  governanceStatus: string;
  grandKingGatePresent: boolean;
  approvalRuntimePresent: boolean;
  issues: string[];
};

export type CompletenessValidation = {
  passed: boolean;
  constitutionalSectionsPresent: string[];
  missingSections: string[];
  mandatoryFieldsPresent: boolean;
  issues: string[];
};

export type CursorSpecificationReport = {
  reportId: string;
  reportVersion: typeof import("./paths.js").CURSOR_SPECIFICATION_GENERATOR_REPORT_VERSION;
  metadataVersion: typeof import("./paths.js").CSGEN_METADATA_VERSION;
  engineId: "PILLOW-CSGEN-001";
  timestamp: string;
  runTimestamp: string;
  workerId: string;
  missionId: "Q13-04";
  missionSummary: {
    missionId: string;
    missionName: string;
    deliverable: string;
    programme: string | null;
  };
  sourceOfTruthSummary: string;
  repositoryIntelligenceReference: {
    reportId: string | null;
    confidenceScore: number | null;
    snapshot: RepositorySnapshotReference;
  };
  missionPlanningReference: MissionPlanReference & { confidenceScore: number | null };
  implementationSpecificationReference: ImplementationSpecificationReference;
  generatedCursorSpecification: CursorSpecification | null;
  boundaryValidation: BoundaryValidation;
  governanceValidation: GovernanceValidation;
  completenessValidation: CompletenessValidation;
  outstandingIssues: string[];
  confidenceScore: number;
  q1304ContractConsumed: Q1304ContractConsumed;
  q1303ContractConsumed: Q1303ContractConsumed;
  q1302Observation: Q1302Observation;
  generationPrerequisite: GenerationPrerequisite;
  consumableByQ1305: boolean;
  neverImplementQ1305OrLater: true;
  neverImplementCode: true;
  neverExecuteCursorMissions: true;
  neverSelfApprove: true;
  neverInventMissions: true;
  neverFabricateRepositoryFindings: true;
  neverBypassGovernance: true;
  specificationOnly: true;
  preserveSpecificationHistory: true;
  supportingEvidence: string[];
  traceabilityRefs: string[];
  validation: CsgenValidation;
  historyRefs: string[];
};

export type Q1305ConsumableContract = {
  contractId: string;
  contractVersion: typeof import("./paths.js").CSGEN_METADATA_VERSION;
  producedBy: "cursor-specification-generator";
  missionId: "Q13-04";
  consumerMissionId: "Q13-05";
  exposedFields: string[];
  specificationCatalog: string[];
  notes: string[];
  neverImplementQ1305OrLater: true;
  structuralSignalOnly: true;
  specificationPrerequisite: boolean;
};

export type SpecificationHistoryEntry = {
  entryId: string;
  timestamp: string;
  reportId: string;
  cursorSpecificationId: string;
  missionId: string;
  confidenceScore: number;
  evidence: string[];
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "bound" | "ready" | "missing";
  details: string;
  timestamp: string;
};

export type CsgenEngineRecord = {
  engineVersion: "PILLOW-CSGEN-001";
  missionId: "Q13-04";
  workerId: string;
  status: OperationalState;
  healthStatus: EngineHealthStatus;
  supportedCapabilities: CsgenCapability[];
  integrationTargets: IntegrationTarget[];
  totalReports: number;
  totalSpecifications: number;
  lastReportId: string | null;
  lastSpecificationId: string | null;
  lastConfidenceScore: number | null;
  connectedAt: string | null;
};

export type CursorSpecificationGeneratorState = {
  engineVersion: "PILLOW-CSGEN-001";
  missionId: "Q13-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: CursorSpecificationGeneratorConfiguration;
  latestReport: CursorSpecificationReport | null;
  latestSpecification: CursorSpecification | null;
  engineRecord: CsgenEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: ValidationStatus | null;
    totalReports: number;
    totalSpecifications: number;
    lastReportId: string | null;
    lastSpecificationId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type CursorSpecificationGeneratorCockpitSnapshot = {
  missionId: "Q13-04";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalSpecifications: number;
  latestReportId: string | null;
  latestSpecificationId: string | null;
  workerId: string;
  neverImplementCode: true;
  neverExecuteCursorMissions: true;
  neverImplementQ1305OrLater: true;
  neverSelfApprove: true;
  neverBypassGovernance: true;
};

export type CsgenCatalog = {
  workerId: string;
  reports: Array<{ reportId: string; timestamp: string; confidenceScore: number }>;
  specifications: Array<{ cursorSpecificationId: string; missionId: string; timestamp: string }>;
  integrations: IntegrationHandshake[];
  specificationHistoryCount: number;
};

export type CsgenDiagnostics = {
  missionId: "Q13-04";
  workerId: string;
  enabled: boolean;
  reports: number;
  specifications: number;
  failureCount: number;
  q1304PrerequisitePresent: boolean;
  readinessScore: number;
  integrations: Array<{ target: string; bound: boolean }>;
  locks: CursorSpecificationGeneratorConfiguration;
};
