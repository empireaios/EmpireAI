import type { WorkerPerformanceReviewConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  PERFORMANCE_DECISIONS,
  PERFORMANCE_METRICS,
  PERFORMANCE_RATINGS,
  PERFORMANCE_RULES,
  TREND_DIRECTIONS,
  VALIDATION_STATUSES,
  WPR_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type PerformanceMetric = (typeof PERFORMANCE_METRICS)[number];
export type PerformanceRating = (typeof PERFORMANCE_RATINGS)[number];
export type TrendDirection = (typeof TREND_DIRECTIONS)[number];
export type PerformanceDecision = (typeof PERFORMANCE_DECISIONS)[number];
export type PerformanceRule = (typeof PERFORMANCE_RULES)[number];
export type WorkerPerformanceCapability = (typeof WPR_CAPABILITIES)[number];

export type MetricScores = {
  quality: number;
  accuracy: number;
  speed: number;
  reliability: number;
  consistency: number;
  collaboration: number;
  recovery: number;
  efficiency: number;
  businessValue: number;
  governanceCompliance: number;
  approvalRate: number;
  reviewOutcome: number;
};

/** Worker enrolled for continuous performance review. */
export type PerformanceWorker = {
  workerId: string;
  workerName: string;
  department: string;
  active: boolean;
  metrics: MetricScores;
  neverExecuteWorkerTasks: true;
};

export type PerformanceTrend = {
  direction: TrendDirection;
  delta: number;
  samples: number;
  notes: string[];
};

/** Machine-readable Worker Performance Review Record (Q1-11). */
export type PerformanceRecord = {
  performanceReviewId: string;
  timestamp: string;
  workerId: string;
  workerName: string;
  department: string;
  reviewPeriod: string;
  qualityScore: number;
  accuracyScore: number;
  speedScore: number;
  reliabilityScore: number;
  collaborationScore: number;
  recoveryScore: number;
  businessOutcomeScore: number;
  overallScore: number;
  executiveRating: PerformanceRating | string;
  improvementRecommendations: string[];
  metadataVersion: string;
  metricScores: MetricScores;
  trend: PerformanceTrend;
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerMonitoring: true;
  neverReplaceWorkforceCertificationMonitor: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  integratesWithWorkerAssignmentEngine: true;
  integratesWithWorkforceCertificationMonitor: true;
  integratesWithAdaptiveWorkforceOptimizer: true;
  preserveHistoricalPerformance: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ExecutivePerformanceReport = {
  reportId: string;
  timestamp: string;
  reviewPeriod: string;
  totalWorkersReviewed: number;
  averageOverallScore: number;
  ratingDistribution: Record<string, number>;
  improvingWorkers: string[];
  decliningWorkers: string[];
  topPerformers: string[];
  improvementPriorities: string[];
  metadataVersion: string;
  executiveAuthority: "pillow";
};

export type WorkerPerformanceCatalog = {
  performanceVersion: string;
  metrics: string[];
  ratings: string[];
  workers: PerformanceWorker[];
  records: PerformanceRecord[];
  latestExecutiveReport: ExecutivePerformanceReport | null;
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerMonitoring: true;
  neverReplaceWorkforceCertificationMonitor: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  integratesWithWorkerAssignmentEngine: true;
  integratesWithWorkforceCertificationMonitor: true;
  integratesWithAdaptiveWorkforceOptimizer: true;
};

export type WorkerPerformanceInput = {
  performanceReviewId?: string | null;
  workerId?: string | null;
  workerName?: string | null;
  department?: string | null;
  reviewPeriod?: string | null;
  active?: boolean | null;
  quality?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  reliability?: number | null;
  consistency?: number | null;
  collaboration?: number | null;
  recovery?: number | null;
  efficiency?: number | null;
  businessValue?: number | null;
  governanceCompliance?: number | null;
  approvalRate?: number | null;
  reviewOutcome?: number | null;
  workers?: PerformanceWorker[];
  rules?: string[];
  violatedRules?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceWorkerMonitoring?: boolean;
  replaceWorkforceCertificationMonitor?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type WorkerPerformanceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkerPerformanceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WPR-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkerPerformanceCapability[];
  totalWorkers: number;
  totalRecords: number;
  lastPerformanceDecision: PerformanceDecision | string | null;
  metadataVersion: string;
};

export type WorkerPerformanceRunReport = {
  performanceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_worker"
    | "review_worker"
    | "review_active"
    | "analyze_trends"
    | "score_worker"
    | "recommend_improvements"
    | "produce_executive_report"
    | "produce"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WorkerPerformanceEngineRecord;
  catalog: WorkerPerformanceCatalog | null;
  workers: PerformanceWorker[];
  records: PerformanceRecord[];
  latestRecord: PerformanceRecord | null;
  executiveReport: ExecutivePerformanceReport | null;
  trends: PerformanceTrend[];
  recommendations: string[];
  performanceDecision: PerformanceDecision | string | null;
  rulesFailed: string[];
  validation: WorkerPerformanceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkerPerformanceReviewState = {
  engineVersion: "PILLOW-WPR-001";
  missionId: "Q1-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkerPerformanceReviewConfiguration;
  latestReport: WorkerPerformanceRunReport | null;
  engineRecord: WorkerPerformanceEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalWorkers: number;
    totalRecords: number;
    lastPerformanceDecision: PerformanceDecision | string | null;
    notes: string[];
  };
};

export type WorkerPerformanceCockpitSnapshot = {
  missionId: "Q1-11";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalWorkers: number;
  totalRecords: number;
  latestPerformanceReviewId: string | null;
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerMonitoring: true;
  neverReplaceWorkforceCertificationMonitor: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
