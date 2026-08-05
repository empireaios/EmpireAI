import type { ImplementationSpecificationEngineConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  ISENG_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type IsengCapability = (typeof ISENG_CAPABILITIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];

/** LOCKED ImplementationSpecification model fields. */
export type ImplementationSpecification = {
  specificationId: string;
  programme: string;
  missionId: string;
  missionName: string;
  repositoryFindings: string[];
  dependencies: string[];
  architectureSummary: string;
  filesExpected: string[];
  requiredCapabilities: string[];
  validationPlan: string[];
  integrationPlan: string[];
  risks: Array<{ risk: string; level: string; mitigation: string }>;
  constraints: string[];
  governanceRequirements: string[];
  version: string;
  timestamp: string;
};

export type Q1301ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  innovationPrerequisite: boolean;
  evidence: string;
};

export type ParsedRoadmapMission = {
  parsedAt: string;
  missionId: string;
  missionName: string;
  programme: string;
  evidenceSources: string[];
  repositoryEvidenceFound: boolean;
  evidence: string[];
};

export type RepositoryArchitectureSummary = {
  computedAt: string;
  scannedRoots: string[];
  moduleCount: number;
  engineModules: string[];
  runtimeModules: string[];
  injectedIntelligenceAvailable: boolean;
  sharedRuntimeFactories: number;
  workerCount: number;
  orchestrationWorkflows: number;
  evidence: string[];
};

export type DependencyDiscoverySummary = {
  computedAt: string;
  dependencies: Array<{ dependency: string; source: string; evidence: string }>;
  sessionWiringPatterns: string[];
  injectedHandles: string[];
  evidence: string[];
};

export type PreservationSummary = {
  computedAt: string;
  preservedImplementations: Array<{ module: string; reason: string; evidence: string }>;
  neverOverwrite: true;
  evidence: string[];
};

export type IsengValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** LOCKED ImplementationSpecificationReport minimum + CRT extras. */
export type ImplementationSpecificationReport = {
  reportId: string;
  timestamp: string;
  specificationVersion: typeof import("./paths.js").IMPLEMENTATION_SPECIFICATION_RUNTIME_VERSION;
  engineId: "PILLOW-ISENG-001";
  missionId: "Q13-01";
  missionSummary: ParsedRoadmapMission;
  repositoryAuditSummary: RepositoryArchitectureSummary;
  architectureSummary: string;
  dependencySummary: DependencyDiscoverySummary;
  preservationSummary: PreservationSummary;
  generatedSpecificationSummary: {
    specificationCount: number;
    latestSpecificationId: string | null;
    specificationIds: string[];
  };
  validationSummary: IsengValidationReport;
  risks: Array<{ risk: string; level: string; mitigation: string }>;
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  specifications: ImplementationSpecification[];
  q1301ContractConsumed: Q1301ContractConsumption;
  consumableByQ1302: boolean;
  neverImplementQ1302OrLater: true;
  neverExecuteImplementations: true;
  neverAutoDeploy: true;
  evidenceBasedOnly: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  validation: IsengValidationReport;
  traceabilityRefs: string[];
  runTimestamp: string;
  preserveCompleteTraceability: true;
  preserveSpecificationHistory: true;
  preserveAuditHistory: true;
  deterministicSpecificationBehaviour: true;
  maskSensitiveValues: true;
  neverFabricateRepositoryState: true;
  neverOverwriteVerifiedImplementations: true;
  neverBypassGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type IsengInput = {
  reportId?: string | null;
  missionId?: string | null;
  missionName?: string | null;
  programme?: string | null;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateRepositoryState?: boolean;
  overwriteVerifiedImplementations?: boolean;
  executeImplementation?: boolean;
  autoDeploy?: boolean;
  bypassGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1302OrLater?: boolean;
  scanRoots?: string[];
};

export type IsengRunReport = ImplementationSpecificationReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type IsengEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-ISENG-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: IsengCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
  totalSpecifications: number;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type IsengCatalog = {
  reportVersion: string;
  workerId: string;
  reports: ImplementationSpecificationReport[];
  specifications: ImplementationSpecification[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  neverFabricateRepositoryState: true;
  neverImplementQ1302OrLater: true;
};

/** Q13-01 exposed contract — specification prerequisite for Q13-02 without implementing Q13-02. */
export type Q1302ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "implementation-specification-engine";
  missionId: "Q13-01";
  consumerMissionId: "Q13-02";
  exposedFields: string[];
  specificationCatalog: string[];
  notes: string[];
  neverImplementQ1302OrLater: true;
  structuralSignalOnly: true;
  specificationPrerequisite: true;
};

export type ImplementationSpecificationEngineState = {
  engineVersion: "PILLOW-ISENG-001";
  missionId: "Q13-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: ImplementationSpecificationEngineConfiguration;
  latestReport: ImplementationSpecificationReport | null;
  engineRecord: IsengEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalSpecifications: number;
    lastReportId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type ImplementationSpecificationEngineCockpitSnapshot = {
  missionId: "Q13-01";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalSpecifications: number;
  latestReportId: string | null;
  workerId: string;
  neverFabricateRepositoryState: true;
  neverExecuteImplementations: true;
  neverAutoDeploy: true;
  neverBypassGovernance: true;
  neverImplementQ1302OrLater: true;
};

export type SpecificationHistoryEntry = {
  entryId: string;
  timestamp: string;
  reportId: string | null;
  specificationId: string | null;
  missionId: string;
  confidenceScore: number;
  evidence: string[];
};
