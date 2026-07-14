/** PILLOW-EREV-001 — Executive Review Board types (E5-10). */

import type {
  EXECUTIVE_REVIEW_PIPELINE,
  REVIEW_PRINCIPLES,
  GOVERNED_REVIEW_CATEGORIES,
  REVIEW_CLASSIFICATIONS,
  REVIEW_ANALYSIS_DOMAINS,
  PILLOW_REVIEW_EVALUATIONS,
  REVIEW_STATUS_LEVELS,
} from "./paths.js";

export type ExecutiveReviewBoardVersion = "E5-10";

export type ExecutiveReviewPipelinePhase = (typeof EXECUTIVE_REVIEW_PIPELINE)[number];
export type ReviewPrinciple = (typeof REVIEW_PRINCIPLES)[number];
export type GovernedReviewCategory = (typeof GOVERNED_REVIEW_CATEGORIES)[number];
export type ReviewClassification = (typeof REVIEW_CLASSIFICATIONS)[number];
export type ReviewAnalysisDomain = (typeof REVIEW_ANALYSIS_DOMAINS)[number];
export type PillowReviewEvaluation = (typeof PILLOW_REVIEW_EVALUATIONS)[number];
export type ReviewStatusLevel = (typeof REVIEW_STATUS_LEVELS)[number];

export type ExecutiveReviewRecord = {
  reviewId: string;
  reviewTitle: string;
  category: GovernedReviewCategory;
  reviewScope: string;
  businessArea: string;
  strategicObjectives: string;
  executiveFindings: string;
  businessImpact: string;
  financialImpact: string;
  governanceImpact: string;
  strategicImpact: string;
  executiveRecommendations: string;
  assignedActions: string;
  reviewStatus: ReviewStatusLevel;
  confidence: number;
  evidence: string[];
  classification: ReviewClassification;
};

export type ReviewCalendarEntry = {
  calendarId: string;
  reviewId: string;
  title: string;
  category: GovernedReviewCategory;
  scheduledDate: string;
  reviewCycle: string;
  status: string;
};

export type CurrentReviewEntry = {
  currentId: string;
  reviewId: string;
  title: string;
  category: GovernedReviewCategory;
  reviewStatus: ReviewStatusLevel;
  owner: string;
  progress: number;
};

export type ExecutiveFindingEntry = {
  findingId: string;
  reviewId: string;
  title: string;
  finding: string;
  impact: string;
  severity: string;
  status: string;
};

export type AssignedActionEntry = {
  actionId: string;
  reviewId: string;
  title: string;
  action: string;
  owner: string;
  dueDate: string;
  progress: number;
  status: string;
};

export type StrategicProgressEntry = {
  progressId: string;
  reviewId: string;
  objective: string;
  progress: number;
  status: string;
  trend: string;
};

export type GovernanceHealthEntry = {
  healthId: string;
  domain: string;
  score: number;
  status: string;
  summary: string;
};

export type ReviewAnalysisMetric = {
  domain: ReviewAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveReviewRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowReviewEvaluationMetric = {
  domain: PillowReviewEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveReviewPipelineStep = {
  phase: ExecutiveReviewPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ReviewMonitoringStatus = {
  backgroundMonitoring: string;
  activeReviewCount: number;
  pendingActionCount: number;
  overdueActionCount: number;
  reviewQualityScore: number;
  lastScanAt: string;
  nextScanAt: string;
};

export type ReviewExecutiveReport = {
  currentStatus: string;
  totalReviews: number;
  activeReviews: number;
  completedActions: number;
  executiveSummary: string;
  generatedAt: string;
};

export type ReviewMetrics = {
  totalReviews: number;
  activeCount: number;
  completedCount: number;
  assignedActionCount: number;
  completedActionCount: number;
  averageConfidence: number;
  governanceHealthScore: number;
};

export type ReviewHealthStatus = {
  status: string;
  healthScore: number;
  reviewRegisterCount: number;
  unreviewedCriticalAreas: number;
  auditEventCount: number;
  lastEventAt: string | null;
};

export type ReviewAuditLogEntry = {
  auditId: string;
  reviewId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
  timestamp: string;
};

export type ExecutiveReviewBoard = {
  engineVersion: ExecutiveReviewBoardVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  reviewHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  totalReviewCount: number;
  activeReviewCount: number;
  pendingActionCount: number;
  completedReviewCount: number;
  unreviewedCriticalCount: number;
  executiveReviewRegister: ExecutiveReviewRecord[];
  reviewCalendar: ReviewCalendarEntry[];
  currentReviews: CurrentReviewEntry[];
  executiveFindings: ExecutiveFindingEntry[];
  assignedActions: AssignedActionEntry[];
  strategicProgress: StrategicProgressEntry[];
  governanceHealth: GovernanceHealthEntry[];
  reviewAnalysis: ReviewAnalysisMetric[];
  executiveReviewPipeline: ExecutiveReviewPipelineStep[];
  recommendedActions: ExecutiveReviewRecommendation[];
  pillowEvaluations: PillowReviewEvaluationMetric[];
  reviewPrinciples: ReviewPrinciple[];
  governedCategories: GovernedReviewCategory[];
  pillowAdvisory: string[];
  integrations: {
    enterpriseGovernanceFramework: string;
    executiveConstitutionalMonitor: string;
    enterpriseAuditEngine: string;
    executiveComplianceEngine: string;
    executiveEthicsEngine: string;
    executiveAccountabilityEngine: string;
    executiveTransparencyEngine: string;
    executiveExceptionManager: string;
    enterpriseRiskGovernance: string;
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    executivePolicyEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  reviewAuditHistory: ReviewAuditLogEntry[];
  monitoringStatus: ReviewMonitoringStatus;
  executiveReport: ReviewExecutiveReport;
  metrics: ReviewMetrics;
  healthStatus: ReviewHealthStatus;
  readyForE511: boolean;
};
