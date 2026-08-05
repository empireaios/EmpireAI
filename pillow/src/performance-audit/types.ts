import type { PerformanceAuditConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CHECK_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  STABILITY_STATUSES,
  VALIDATION_STATUSES,
  PERFART_CAPABILITIES,
  PERFORMANCE_COMPONENT_KEYS,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CheckStatus = (typeof CHECK_STATUSES)[number];
export type StabilityStatusLabel = (typeof STABILITY_STATUSES)[number];
export type ReadinessClassification = (typeof READINESS_CLASSIFICATIONS)[number];
/** "performance classification" — same catalog family as ReadinessClassification. */
export type PerformanceClassification = ReadinessClassification;
export type ReadinessDecision = (typeof READINESS_DECISIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type PerfartCapability = (typeof PERFART_CAPABILITIES)[number];
export type PerformanceComponentKey = (typeof PERFORMANCE_COMPONENT_KEYS)[number];

export type PerformanceHandle = object;

/* ------------------------------------------------------------------------ */
/* Discovery — performance benchmark targets, from injected handles only.   */
/* Never invented.                                                          */
/* ------------------------------------------------------------------------ */

/** Structural performance component record — derived strictly from injected dependency presence. */
export type DiscoveredPerformanceComponentRecord = {
  componentKey: PerformanceComponentKey;
  componentName: string;
  componentType: string;
  bound: boolean;
  healthStatus: string | null;
  evidencePresent: boolean;
};

export type PerformanceComponentDiscoveryResult = {
  discoveredAt: string;
  discoveredCount: number;
  totalCatalogued: number;
  components: DiscoveredPerformanceComponentRecord[];
  evidence: string[];
};

/* ------------------------------------------------------------------------ */
/* Benchmark Result / Performance Assessment (single row of the benchmark   */
/* matrix) — LOCKED field set.                                              */
/* ------------------------------------------------------------------------ */

export type BenchmarkResult = {
  benchmarkId: string;
  componentId: string;
  componentType: string;
  testScenario: string;
  responseTime: number | null;
  throughput: number | null;
  latency: number | null;
  cpuUsage: number | null;
  memoryUsage: number | null;
  errorRate: number;
  stabilityStatus: CheckStatus;
  performanceClassification: PerformanceClassification;
  supportingEvidence: string[];
  auditReference: string;
  auditTimestamp: string;
};

/** LOCKED alias — "PerformanceAssessment" is the same shape as BenchmarkResult. */
export type PerformanceAssessment = BenchmarkResult;

/* ------------------------------------------------------------------------ */
/* Summaries                                                                 */
/* ------------------------------------------------------------------------ */

export type BenchmarkSummary = {
  totalBenchmarks: number;
  passedCount: number;
  partialCount: number;
  failedCount: number;
  missingCount: number;
  averageResponseTimeMs: number | null;
  averageThroughput: number | null;
  averageErrorRate: number;
  evidence: string[];
};

export type SegmentPerformanceSummary = {
  segment: "worker" | "factory" | "runtime" | "api" | "queue";
  passedCount: number;
  partialCount: number;
  failedCount: number;
  missingCount: number;
  totalComponents: number;
  evidence: string[];
};

export type BottleneckRow = {
  componentId: string;
  componentType: string;
  reason: string;
  responseTime: number | null;
  errorRate: number;
  stabilityStatus: CheckStatus;
  evidence: string[];
};

export type BottleneckSummary = {
  computedAt: string;
  totalBottlenecks: number;
  rows: BottleneckRow[];
  evidence: string[];
};

export type ResourceUtilisationRow = {
  componentId: string;
  memoryUsageMb: number | null;
  cpuUsagePercent: number | null;
  evidence: string[];
};

export type ResourceUtilisationSummary = {
  computedAt: string;
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  cpuUserMs: number | null;
  cpuSystemMs: number | null;
  rows: ResourceUtilisationRow[];
  evidence: string[];
};

export type ScalabilityResult = {
  componentId: string;
  concurrency: number;
  elapsedMs: number;
  throughput: number | null;
  successCount: number;
  failureCount: number;
  evidence: string[];
};

export type StabilityProbeRow = {
  componentId: string;
  samples: number[];
  meanMs: number | null;
  varianceMs: number | null;
  errorCount: number;
  stabilityStatus: CheckStatus;
  stabilityLabel: StabilityStatusLabel;
  evidence: string[];
};

export type SustainedStabilitySummary = {
  computedAt: string;
  repeats: number;
  rows: StabilityProbeRow[];
  overallStabilityStatus: CheckStatus;
  evidence: string[];
};

export type GovernanceSummary = {
  compliant: boolean;
  grandKingApprovalRequired: true;
  performanceAuditRequired: true;
  selfDocPresent: boolean;
  selfDocPath: string;
  boundaryLocksHonoured: boolean;
  requiredComponentsBoundCount: number;
  totalRequiredComponents: number;
  evidence: string[];
};

export type PerformanceReadinessSummary = {
  computedAt: string;
  totalComponents: number;
  certifiedCount: number;
  partiallyCertifiedCount: number;
  failedCount: number;
  missingCount: number;
  blockedCount: number;
  deferredCount: number;
  overallReadinessScore: number;
  allCertified: boolean;
  notes: string[];
  evidence: string[];
};

export type IntegrationTarget = (typeof import("./paths.js").INTEGRATION_TARGETS)[number];

export type IntegrationCheckRow = {
  target: IntegrationTarget;
  bound: boolean;
  evidence: string;
};

export type IntegrationVerification = {
  verifiedAt: string;
  rows: IntegrationCheckRow[];
  totalTargets: number;
  boundCount: number;
  allBound: boolean;
  evidence: string[];
};

/** Inbound — Q11-06 consumes the Q1106ConsumableContract exposed by Q11-05 (Security Audit). */
export type Q1106ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

/* ------------------------------------------------------------------------ */
/* Validation                                                                */
/* ------------------------------------------------------------------------ */

export type PerfartValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/* ------------------------------------------------------------------------ */
/* Performance Audit Report                                                 */
/* ------------------------------------------------------------------------ */

export type PerformanceAuditReport = {
  reportId: string;
  timestamp: string;
  auditVersion: "Q11-PERFART-v1";
  engineId: "PILLOW-PERFART-001";
  missionId: "Q11-06";
  totalPerformanceComponents: number;
  certifiedComponents: number;
  partiallyCertifiedComponents: number;
  failedComponents: number;
  missingComponents: number;
  blockedComponents: number;
  deferredComponents: number;
  benchmarkSummary: BenchmarkSummary;
  workerPerformanceSummary: SegmentPerformanceSummary;
  factoryPerformanceSummary: SegmentPerformanceSummary;
  runtimePerformanceSummary: SegmentPerformanceSummary;
  apiPerformanceSummary: SegmentPerformanceSummary;
  queuePerformanceSummary?: SegmentPerformanceSummary;
  bottleneckSummary: BottleneckSummary;
  resourceUtilisationSummary: ResourceUtilisationSummary;
  sustainedStabilitySummary: SustainedStabilitySummary;
  integrationSummary: IntegrationVerification;
  governanceSummary: GovernanceSummary;
  outstandingIssues: string[];
  supportingEvidence: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  findings: string[];
  assessments: PerformanceAssessment[];
  decision: ReadinessDecision;
  auditStatus: AuditStatus;
  validation: PerfartValidationReport;
  performanceReadinessSummary: PerformanceReadinessSummary;
  componentInventory: DiscoveredPerformanceComponentRecord[];
  q1106ContractConsumed: Q1106ContractConsumption;
  consumableByQ1107: boolean;
  neverImplementQ1107OrLater: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  sixthQ11Gate: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  runTimestamp: string;
  preserveCompleteTraceability: true;
  preserveImmutableBenchmarkHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  maskSensitiveValues: true;
  neverFabricatePerformanceEvidence: true;
  neverCertifyUntestedPerformance: true;
  neverOptimizeOrModifyProductionSystems: true;
  neverAssumeImplementation: true;
  neverModifyPerformanceImplementations: true;
  neverRepairFailedPerformanceComponents: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type PerfartInput = {
  reportId?: string | null;
  missionId?: string | null;
  grandKingInstructions?: string | null;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  /** Explicit, evidence-based deferral — never inferred. */
  deferAudit?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  fabricatePerformanceEvidence?: boolean;
  forceFail?: boolean;
  certifyUntestedPerformance?: boolean;
  optimizeOrModifyProductionSystems?: boolean;
  assumeImplementation?: boolean;
  modifyPerformanceImplementations?: boolean;
  repairFailedPerformanceComponents?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1107OrLater?: boolean;
};

export type PerfartRunReport = PerformanceAuditReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type PerfartEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PERFART-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PerfartCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type PerfartCatalog = {
  reportVersion: string;
  workerId: string;
  reports: PerformanceAuditReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricatePerformanceEvidence: true;
  neverAssumeImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1107OrLater: true;
  sixthQ11Gate: true;
};

/** Q11-06's own exposed contract — consumed by Q11-07 (Recovery Audit). */
export type Q1107ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "performance-audit";
  missionId: "Q11-06";
  consumerMissionId: "Q11-07";
  exposedFields: string[];
  readinessClassificationCatalog: string[];
  decisionCatalog: string[];
  notes: string[];
  neverImplementQ1107OrLater: true;
  structuralSignalOnly: true;
};

export type PerformanceAuditState = {
  engineVersion: "PILLOW-PERFART-001";
  missionId: "Q11-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: PerformanceAuditConfiguration;
  latestReport: PerformanceAuditReport | null;
  engineRecord: PerfartEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    lastReportId: string | null;
    lastDecision: ReadinessDecision | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type PerformanceAuditCockpitSnapshot = {
  missionId: "Q11-06";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  readinessClassificationOptions: ReadinessClassification[];
  neverFabricatePerformanceEvidence: true;
  neverCertifyUntestedPerformance: true;
  neverOptimizeOrModifyProductionSystems: true;
  neverAssumeImplementation: true;
  neverModifyPerformanceImplementations: true;
  neverRepairFailedPerformanceComponents: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1107OrLater: true;
  sixthQ11Gate: true;
};
