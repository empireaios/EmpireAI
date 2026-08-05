import type { RepositoryIntelligenceEngineConfiguration } from "./configuration.js";
import type {
  ARCHITECTURE_LAYERS,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  RIENG_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ArchitectureLayer = (typeof ARCHITECTURE_LAYERS)[number];
export type RiengCapability = (typeof RIENG_CAPABILITIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];

export type SourceType = "typescript" | "javascript" | "json" | "markdown" | "other";

export type ModuleInventoryEntry = {
  moduleId: string;
  path: string;
  fileCount: number;
  sourceTypes: SourceType[];
  evidencePaths: string[];
};

export type ServiceInventoryEntry = {
  serviceId: string;
  kind: "engine" | "controller" | "manager" | "route" | "service" | "bridge" | "other";
  path: string;
  exportHints: string[];
  evidencePaths: string[];
};

export type DependencyNode = {
  id: string;
  path: string;
  kind: "file" | "module" | "external" | "unresolved";
};

export type DependencyEdge = {
  from: string;
  to: string;
  specifier: string;
  classification: "internal" | "external" | "unresolved";
};

export type DependencyGraph = {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  cycles: string[][];
  unresolvedCount: number;
  externalCount: number;
  internalCount: number;
  computedAt: string;
};

export type IntegrationGraphNode = {
  id: string;
  path: string;
  integrationHints: string[];
};

export type IntegrationGraph = {
  nodes: IntegrationGraphNode[];
  edges: Array<{ from: string; to: string; relationship: string; evidence: string }>;
  computedAt: string;
};

export type ArchitectureLayerSummary = {
  layer: ArchitectureLayer;
  pathCount: number;
  moduleCount: number;
  constraints: string[];
  violations: string[];
  evidencePaths: string[];
};

export type ExistingImplementationEntry = {
  identity: string;
  missionId: string | null;
  engineId: string | null;
  paths: string[];
  evidence: string[];
};

export type ReusableComponentEntry = {
  componentId: string;
  path: string;
  exportCount: number;
  dependentCount: number;
  evidence: string[];
};

export type TechnicalDebtFinding = {
  debtId: string;
  category:
    | "unresolved_import"
    | "cycle"
    | "oversized_file"
    | "oversized_module"
    | "duplicate_name"
    | "duplicate_responsibility"
    | "missing_index"
    | "missing_config"
    | "missing_docs";
  severity: "low" | "medium" | "high";
  description: string;
  evidencePaths: string[];
};

export type ConflictEntry = {
  conflictId: string;
  kind: "duplicate_export" | "near_duplicate_module";
  name: string;
  paths: string[];
  evidence: string[];
};

export type RiskEntry = {
  riskId: string;
  category: string;
  description: string;
  severity: "low" | "medium" | "high";
  evidence: string[];
};

export type RepositoryIntelligenceSnapshot = {
  repositorySnapshotId: string;
  repositoryVersion: string;
  repositoryFingerprint: string;
  moduleInventory: ModuleInventoryEntry[];
  serviceInventory: ServiceInventoryEntry[];
  dependencyGraph: DependencyGraph;
  integrationGraph: IntegrationGraph;
  architectureLayers: ArchitectureLayerSummary[];
  existingImplementations: ExistingImplementationEntry[];
  reusableComponents: ReusableComponentEntry[];
  technicalDebtFindings: TechnicalDebtFinding[];
  conflicts: ConflictEntry[];
  risks: RiskEntry[];
  timestamp: string;
};

export type Q1301ContractObservation = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

export type Q1302ContractConsumed = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

export type Q1302Prerequisite = {
  verified: boolean;
  implementationSpecificationEnginePresent: boolean;
  q1302ContractAvailable: boolean;
  outstandingPrerequisiteIssues: string[];
  evidence: string[];
};

/** @deprecated Use Q1302Prerequisite */
export type Q1301MissionPrerequisite = Q1302Prerequisite & {
  /** @deprecated Use implementationSpecificationEnginePresent */
  q1301MissionPresent: boolean;
};

export type RepositorySummary = {
  totalFiles: number;
  totalModules: number;
  totalServices: number;
  includeRoots: string[];
  excludeDirs: string[];
  repositoryFingerprint: string;
  repositoryVersion: string;
};

export type RiengInput = {
  reportId?: string;
  missionId?: string;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  modifyRepository?: boolean;
  implementQ1303OrLater?: boolean;
  certifyQ1301?: boolean;
  forceAnalysis?: boolean;
};

export type RiengValidation = {
  decision: ValidationStatus;
  errors: string[];
  warnings: string[];
  durationMs: number;
};

export type RepositoryIntelligenceReport = {
  reportId: string;
  reportVersion: typeof import("./paths.js").REPOSITORY_INTELLIGENCE_ENGINE_REPORT_VERSION;
  metadataVersion: typeof import("./paths.js").RIENG_METADATA_VERSION;
  timestamp: string;
  runTimestamp: string;
  workerId: string;
  missionId: "Q13-02";
  repositorySummary: RepositorySummary;
  moduleSummary: { totalModules: number; topModules: ModuleInventoryEntry[] };
  serviceSummary: { totalServices: number; byKind: Record<string, number> };
  dependencySummary: {
    nodeCount: number;
    edgeCount: number;
    cycleCount: number;
    unresolvedCount: number;
  };
  architectureSummary: { layers: ArchitectureLayerSummary[]; violationCount: number };
  existingImplementationSummary: { count: number; entries: ExistingImplementationEntry[] };
  technicalDebtSummary: { count: number; byCategory: Record<string, number> };
  riskSummary: { count: number; risks: RiskEntry[] };
  confidenceScore: number;
  snapshot: RepositoryIntelligenceSnapshot;
  supportingEvidence: string[];
  outstandingIssues: string[];
  traceabilityRefs: string[];
  q1302ContractConsumed: Q1302ContractConsumed;
  q1302Prerequisite: Q1302Prerequisite;
  q1301Observation: Q1301ContractObservation;
  /** @deprecated Use q1302ContractConsumed — retained for backward compatibility */
  q1301ContractConsumed: Q1301ContractObservation;
  /** @deprecated Use q1302Prerequisite — retained for backward compatibility */
  q1301MissionPrerequisite: Q1301MissionPrerequisite;
  consumableByQ1303: boolean;
  neverImplementQ1303OrLater: true;
  neverModifyAnalyzedFiles: true;
  preserveCompleteTraceability: true;
  preserveRepositoryKnowledgeHistory: true;
  deterministicRepositoryAnalysis: true;
  evidenceBasedOnly: true;
  validation: RiengValidation;
  historyRefs: string[];
};

export type Q1303ConsumableContract = {
  contractId: string;
  contractVersion: typeof import("./paths.js").RIENG_METADATA_VERSION;
  producedBy: "repository-intelligence-engine";
  missionId: "Q13-02";
  consumerMissionId: "Q13-03";
  exposedFields: string[];
  repositoryCatalog: string[];
  notes: string[];
  neverImplementQ1303OrLater: true;
  structuralSignalOnly: true;
  repositoryPrerequisite: boolean;
};

export type RepositoryKnowledgeHistoryEntry = {
  entryId: string;
  timestamp: string;
  reportId: string;
  repositoryFingerprint: string;
  repositoryVersion: string;
  moduleCount: number;
  serviceCount: number;
  confidenceScore: number;
  evidence: string[];
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "bound" | "ready" | "missing";
  details: string;
  timestamp: string;
};

export type RiengEngineRecord = {
  engineVersion: "PILLOW-RIENG-001";
  missionId: "Q13-02";
  workerId: string;
  status: OperationalState;
  healthStatus: EngineHealthStatus;
  supportedCapabilities: RiengCapability[];
  integrationTargets: IntegrationTarget[];
  totalReports: number;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
  lastRepositoryFingerprint: string | null;
  connectedAt: string | null;
};

export type RepositoryIntelligenceEngineState = {
  engineVersion: "PILLOW-RIENG-001";
  missionId: "Q13-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: RepositoryIntelligenceEngineConfiguration;
  latestReport: RepositoryIntelligenceReport | null;
  engineRecord: RiengEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: ValidationStatus | null;
    totalReports: number;
    lastReportId: string | null;
    lastConfidenceScore: number | null;
    lastRepositoryFingerprint: string | null;
    notes: string[];
  };
};

export type RepositoryIntelligenceEngineCockpitSnapshot = {
  missionId: "Q13-02";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastRepositoryFingerprint: string | null;
  workerId: string;
  neverModifyAnalyzedFiles: true;
  neverImplementQ1303OrLater: true;
  neverCertifyQ1301: true;
};

export type RepositoryStructureDiscovery = {
  discoveredAt: string;
  includeRoots: string[];
  excludeDirs: string[];
  files: Array<{ relativePath: string; size: number; layer: ArchitectureLayer }>;
  repositoryFingerprint: string;
  repositoryVersion: string;
  totalFiles: number;
  readOnly: true;
};

export type RiengCatalog = {
  workerId: string;
  reports: RepositoryIntelligenceReport[];
  integrations: IntegrationHandshake[];
  knowledgeHistoryCount: number;
};

export type RiengDiagnostics = {
  missionId: "Q13-02";
  workerId: string;
  enabled: boolean;
  reports: number;
  failureCount: number;
  q1302PrerequisitePresent: boolean;
  /** @deprecated Use q1302PrerequisitePresent */
  q1301MissionPresent: boolean;
  readinessScore: number;
  integrations: Array<{ target: string; bound: boolean }>;
  locks: RepositoryIntelligenceEngineConfiguration;
};
