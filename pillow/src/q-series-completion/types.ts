import type { QSeriesCompletionConfiguration } from "./configuration.js";
import type {
  COMPLETION_CLASSIFICATIONS,
  FINAL_COMPLETION_DECISIONS,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  QSCPT_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CompletionClassification = (typeof COMPLETION_CLASSIFICATIONS)[number];
export type FinalCompletionDecision = (typeof FINAL_COMPLETION_DECISIONS)[number];
export type QscptCapability = (typeof QSCPT_CAPABILITIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];

/** LOCKED QSeriesCompletion model fields. */
export type QSeriesCompletionRecord = {
  completionId: string;
  programmeVersion: string;
  missionCompletionSummary: MissionCompletionSummary;
  factoryCompletionSummary: FactoryCompletionSummary;
  workerCompletionSummary: WorkerCompletionSummary;
  runtimeCompletionSummary: RuntimeCompletionSummary;
  governanceStatus: GovernanceCompletionSummary;
  certificationStatus: CertificationCompletionSummary;
  productionStatus: ProductionReadinessCompletion;
  finalCompletionDecision: FinalCompletionDecision;
  supportingEvidence: string[];
  auditReference: string;
  completionTimestamp: string;
};

export type MissionEngineInventoryEntry = {
  missionId: string;
  engineKey: string;
  label: string;
  handleInjected: boolean;
  sessionPresent: boolean;
  classification: CompletionClassification;
  evidence: string[];
};

export type MissionCompletionSummary = {
  computedAt: string;
  requiredMissions: number;
  presentCount: number;
  missingCount: number;
  finartMissing: boolean;
  inventory: MissionEngineInventoryEntry[];
  classification: CompletionClassification;
  evidence: string[];
};

export type FactoryCompletionSummary = {
  computedAt: string;
  totalDiscovered: number;
  catalogTotal: number;
  factories: Array<{ factoryKey: string; status: string; classification: CompletionClassification }>;
  evidence: string[];
};

export type WorkerCompletionSummary = {
  computedAt: string;
  totalWorkers: number;
  operationalCount: number;
  failedCount: number;
  missingCount: number;
  classification: CompletionClassification;
  evidence: string[];
};

export type RuntimeCompletionSummary = {
  computedAt: string;
  runtimesChecked: number;
  boundCount: number;
  healthyCount: number;
  failedCount: number;
  missingCount: number;
  classification: CompletionClassification;
  runtimes: Array<{ runtimeId: string; bound: boolean; status: string; classification: CompletionClassification }>;
  evidence: string[];
};

export type GovernanceCompletionSummary = {
  computedAt: string;
  pccrtClassification: CompletionClassification;
  gkDecision: string;
  gkAuthorisation: string;
  gkAuthorised: boolean;
  pillowSignalsPresent: boolean;
  classification: CompletionClassification;
  evidence: string[];
};

export type CertificationCompletionSummary = {
  computedAt: string;
  qscrtBound: boolean;
  qscrtCertificationDecision: string | null;
  qscrtClassification: CompletionClassification;
  q1113ContractConsumed: boolean;
  classification: CompletionClassification;
  evidence: string[];
};

export type ProductionReadinessCompletion = {
  computedAt: string;
  eaprtDecision: string | null;
  eaprtClassification: CompletionClassification;
  gkAuthorised: boolean;
  plmrtProductionActive: boolean;
  finartPresent: boolean;
  classification: CompletionClassification;
  evidence: string[];
};

export type AggregatedCompletionEvidence = {
  computedAt: string;
  missionInventoryComplete: boolean;
  finartMissing: boolean;
  qscrtCertified: boolean;
  productionChainGreen: boolean;
  completeCount: number;
  incompleteCount: number;
  blockedCount: number;
  evidence: string[];
};

export type CompletionReadinessClassification = {
  computedAt: string;
  overallClassification: CompletionClassification;
  readinessScore: number;
  rationale: string[];
  evidence: string[];
};

export type Q1113ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

export type QscptValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** LOCKED QSeriesCompletionReport minimum + CRT extras. */
export type QSeriesCompletionReport = {
  reportId: string;
  timestamp: string;
  completionVersion: typeof import("./paths.js").Q_SERIES_COMPLETION_RUNTIME_VERSION;
  engineId: "PILLOW-QSCPT-001";
  missionId: "Q11-13";
  missionSummary: MissionCompletionSummary;
  factorySummary: FactoryCompletionSummary;
  workerSummary: WorkerCompletionSummary;
  runtimeSummary: RuntimeCompletionSummary;
  governanceSummary: GovernanceCompletionSummary;
  certificationSummary: CertificationCompletionSummary;
  productionReadinessSummary: ProductionReadinessCompletion;
  finalCompletionDecision: FinalCompletionDecision;
  supportingEvidence: string[];
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  assessments: QSeriesCompletionRecord[];
  q1113ContractConsumed: Q1113ContractConsumption;
  consumableByQ1201: boolean;
  neverImplementQ1201OrLater: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  validation: QscptValidationReport;
  traceabilityRefs: string[];
  runTimestamp: string;
  preserveCompleteTraceability: true;
  preserveCompletionHistory: true;
  preserveAuditHistory: true;
  deterministicCompletionBehaviour: true;
  maskSensitiveValues: true;
  neverFabricateCompletionEvidence: true;
  neverMarkCompleteWhenUnmet: true;
  neverBypassGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type QscptInput = {
  reportId?: string | null;
  missionId?: string | null;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateCompletionEvidence?: boolean;
  markCompleteWhenUnmet?: boolean;
  bypassGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1201OrLater?: boolean;
  forceComplete?: boolean;
  forceFail?: boolean;
  deferCompletion?: boolean;
};

export type QscptRunReport = QSeriesCompletionReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type QscptEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-QSCPT-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: QscptCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastCompletionDecision: FinalCompletionDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type QscptCatalog = {
  reportVersion: string;
  workerId: string;
  reports: QSeriesCompletionReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  neverFabricateCompletionEvidence: true;
  neverImplementQ1201OrLater: true;
};

/** Q11-13 exposed contract — series-complete prerequisite for Q12-01 alongside GKAGT Q1201. */
export type Q1201ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "q-series-completion";
  missionId: "Q11-13";
  consumerMissionId: "Q12-01";
  exposedFields: string[];
  completionDecisionCatalog: string[];
  notes: string[];
  neverImplementQ1201OrLater: true;
  structuralSignalOnly: true;
  seriesCompletePrerequisite: true;
};

export type QSeriesCompletionState = {
  engineVersion: "PILLOW-QSCPT-001";
  missionId: "Q11-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: QSeriesCompletionConfiguration;
  latestReport: QSeriesCompletionReport | null;
  engineRecord: QscptEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    lastReportId: string | null;
    lastCompletionDecision: FinalCompletionDecision | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type QSeriesCompletionCockpitSnapshot = {
  missionId: "Q11-13";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastCompletionDecision: FinalCompletionDecision | null;
  workerId: string;
  neverFabricateCompletionEvidence: true;
  neverMarkCompleteWhenUnmet: true;
  neverBypassGovernance: true;
  neverImplementQ1201OrLater: true;
};

export type CompletionHistoryEntry = {
  entryId: string;
  timestamp: string;
  reportId: string | null;
  finalCompletionDecision: FinalCompletionDecision;
  overallClassification: CompletionClassification;
  evidence: string[];
};
