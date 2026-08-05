import type { ImplementationRecoveryPlannerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  INTERRUPTION_CLASSIFICATIONS,
  IRPLN_CAPABILITIES,
  OPERATIONAL_STATES,
  RECOVERY_SPEC_SECTIONS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type IrplnCapability = (typeof IRPLN_CAPABILITIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type InterruptionClassification = (typeof INTERRUPTION_CLASSIFICATIONS)[number];
export type RecoverySpecSection = (typeof RECOVERY_SPEC_SECTIONS)[number];

export type RepositoryPathFinding = {
  path: string;
  exists: boolean;
  classification: "completed" | "partial" | "missing" | "conflict";
  evidence: string;
};

export type RepositorySnapshot = {
  repositorySnapshotId: string | null;
  repositoryFingerprint: string | null;
  repositoryVersion: string | null;
  analysedAt: string;
  pathFindings: RepositoryPathFinding[];
  readOnly: true;
};

export type ApprovedMissionSpecification = {
  cursorSpecificationId: string | null;
  missionId: string;
  missionName: string;
  deliverable: string;
  expectedPaths: string[];
  architecture: string[];
  acceptanceCriteria: string[];
  source: "csgen" | "input" | "unknown";
};

export type InterruptedMissionInput = {
  missionId: string;
  missionName?: string;
  deliverable?: string;
  programme?: string | null;
  interruptionReason: string;
  expectedPaths: string[];
  evidenceProvided: boolean;
  detectedAt: string;
  classification: InterruptionClassification;
};

export type ComponentFinding = {
  componentId: string;
  path: string;
  status: "completed" | "partial" | "missing" | "conflict";
  evidence: string;
  preserve: boolean;
};

export type RecoverySequenceStep = {
  stepId: string;
  order: number;
  action: "preserve" | "extend" | "create" | "resolve_conflict";
  target: string;
  description: string;
  rationale: string;
};

export type RecoveryPlan = {
  recoveryId: string;
  version: typeof import("./paths.js").IRPLN_METADATA_VERSION;
  programme: string | null;
  missionId: string;
  repositorySnapshot: RepositorySnapshot;
  approvedMissionSpecification: ApprovedMissionSpecification;
  repositoryFindings: RepositoryPathFinding[];
  completedComponents: ComponentFinding[];
  partialComponents: ComponentFinding[];
  missingComponents: ComponentFinding[];
  conflictingComponents: ComponentFinding[];
  filesToPreserve: string[];
  filesRequiringExtension: string[];
  recoverySequence: RecoverySequenceStep[];
  validationPlan: string[];
  acceptanceCriteria: string[];
  risks: string[];
  estimatedRecoveryScope: "minimal" | "moderate" | "extensive";
  timestamp: string;
};

export type RecoverySpecification = {
  recoverySpecificationId: string;
  recoveryId: string;
  missionId: string;
  missionName: string;
  preserveList: string[];
  extendList: string[];
  missingList: string[];
  conflicts: ComponentFinding[];
  recoverySequence: RecoverySequenceStep[];
  validationRequirements: string[];
  acceptanceCriteria: string[];
  stopBoundary: string;
  neverOverwriteVerifiedWork: true;
  neverExecuteRecovery: true;
  neverModifyRepository: true;
  constitutionalBody: string;
  timestamp: string;
};

export type Q1305ContractConsumed = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  consumerMissionId: string | null;
  fields: string[];
  evidence: string;
};

export type RecoveryPrerequisite = {
  verified: boolean;
  pillowCommandConfirmed: boolean;
  cursorSpecificationGeneratorPresent: boolean;
  q1305ContractAvailable: boolean;
  cursorSpecificationAvailable: boolean;
  repositoryAnalysed: boolean;
  missionEvidencePresent: boolean;
  outstandingPrerequisiteIssues: string[];
  evidence: string[];
};

export type IrplnInput = {
  reportId?: string;
  recoveryId?: string;
  missionId?: string;
  missionName?: string;
  deliverable?: string;
  programme?: string;
  interruptionReason?: string;
  expectedPaths?: string[];
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateRepositoryFindings?: boolean;
  overwriteVerifiedImplementations?: boolean;
  deleteProductionCode?: boolean;
  restartCompletedWork?: boolean;
  executeRecovery?: boolean;
  modifyRepository?: boolean;
  bypassGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1306OrLater?: boolean;
};

export type IrplnValidation = {
  decision: ValidationStatus;
  errors: string[];
  warnings: string[];
  durationMs: number;
};

export type BoundaryValidation = {
  passed: boolean;
  neverExecuteRecovery: true;
  neverModifyRepository: true;
  neverImplementQ1306OrLater: true;
  neverOverwriteVerifiedImplementations: true;
  neverDeleteProductionCodeWithoutEvidence: true;
  neverRestartCompletedWorkUnnecessarily: true;
  neverFabricateRepositoryFindings: true;
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

export type RecoveryReport = {
  reportId: string;
  reportVersion: typeof import("./paths.js").IMPLEMENTATION_RECOVERY_PLANNER_REPORT_VERSION;
  metadataVersion: typeof import("./paths.js").IRPLN_METADATA_VERSION;
  engineId: "PILLOW-IRPLN-001";
  timestamp: string;
  runTimestamp: string;
  workerId: string;
  missionId: "Q13-05";
  missionSummary: {
    missionId: string;
    missionName: string;
    deliverable: string;
    programme: string | null;
    interruptionReason: string | null;
    classification: InterruptionClassification | null;
  };
  repositoryAuditSummary: RepositorySnapshot;
  recoveryAnalysis: {
    completedCount: number;
    partialCount: number;
    missingCount: number;
    conflictCount: number;
    estimatedRecoveryScope: RecoveryPlan["estimatedRecoveryScope"] | null;
  };
  completedWorkSummary: ComponentFinding[];
  partialWorkSummary: ComponentFinding[];
  missingWorkSummary: ComponentFinding[];
  conflictSummary: ComponentFinding[];
  recoveryStrategy: string[];
  validationStrategy: string[];
  acceptanceCriteria: string[];
  riskSummary: string[];
  confidenceScore: number;
  plans: RecoveryPlan[];
  recoverySpecifications: RecoverySpecification[];
  boundaryValidation: BoundaryValidation;
  governanceValidation: GovernanceValidation;
  recoveryPrerequisite: RecoveryPrerequisite;
  q1305ContractConsumed: Q1305ContractConsumed;
  consumableByQ1306: boolean;
  neverImplementQ1306OrLater: true;
  neverExecuteRecovery: true;
  neverModifyRepository: true;
  neverOverwriteVerifiedImplementations: true;
  neverDeleteProductionCodeWithoutEvidence: true;
  neverRestartCompletedWorkUnnecessarily: true;
  neverFabricateRepositoryFindings: true;
  neverBypassGovernance: true;
  recoveryPlanningOnly: true;
  preserveRecoveryHistory: true;
  supportingEvidence: string[];
  traceabilityRefs: string[];
  validation: IrplnValidation;
  historyRefs: string[];
};

export type Q1306ConsumableContract = {
  contractId: string;
  contractVersion: typeof import("./paths.js").IRPLN_METADATA_VERSION;
  producedBy: "implementation-recovery-planner";
  missionId: "Q13-05";
  consumerMissionId: "Q13-06";
  exposedFields: string[];
  recoveryCatalog: string[];
  notes: string[];
  neverImplementQ1306OrLater: true;
  structuralSignalOnly: true;
  recoveryPrerequisite: boolean;
};

export type RecoveryHistoryEntry = {
  entryId: string;
  timestamp: string;
  reportId: string;
  recoveryId: string;
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

export type IrplnEngineRecord = {
  engineVersion: "PILLOW-IRPLN-001";
  missionId: "Q13-05";
  workerId: string;
  status: OperationalState;
  healthStatus: EngineHealthStatus;
  supportedCapabilities: IrplnCapability[];
  integrationTargets: IntegrationTarget[];
  totalReports: number;
  totalPlans: number;
  lastReportId: string | null;
  lastRecoveryId: string | null;
  lastConfidenceScore: number | null;
  connectedAt: string | null;
};

export type ImplementationRecoveryPlannerState = {
  engineVersion: "PILLOW-IRPLN-001";
  missionId: "Q13-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: ImplementationRecoveryPlannerConfiguration;
  latestReport: RecoveryReport | null;
  latestPlan: RecoveryPlan | null;
  latestRecoverySpecification: RecoverySpecification | null;
  engineRecord: IrplnEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: ValidationStatus | null;
    totalReports: number;
    totalPlans: number;
    lastReportId: string | null;
    lastRecoveryId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type ImplementationRecoveryPlannerCockpitSnapshot = {
  missionId: "Q13-05";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalPlans: number;
  latestReportId: string | null;
  latestRecoveryId: string | null;
  workerId: string;
  neverExecuteRecovery: true;
  neverModifyRepository: true;
  neverImplementQ1306OrLater: true;
  neverOverwriteVerifiedImplementations: true;
  neverBypassGovernance: true;
};

export type IrplnCatalog = {
  workerId: string;
  reports: Array<{ reportId: string; timestamp: string; confidenceScore: number }>;
  plans: Array<{ recoveryId: string; missionId: string; timestamp: string }>;
  integrations: IntegrationHandshake[];
  recoveryHistoryCount: number;
};

export type IrplnDiagnostics = {
  missionId: "Q13-05";
  workerId: string;
  enabled: boolean;
  reports: number;
  plans: number;
  failureCount: number;
  q1305PrerequisitePresent: boolean;
  readinessScore: number;
  integrations: Array<{ target: string; bound: boolean }>;
  locks: ImplementationRecoveryPlannerConfiguration;
};

export type RecoveryStrategy = {
  strategyId: string;
  preserveCompleted: string[];
  extendPartial: string[];
  createMissing: string[];
  resolveConflicts: ComponentFinding[];
  principles: string[];
  timestamp: string;
};
