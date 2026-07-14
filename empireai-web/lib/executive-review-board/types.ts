/** E5-10 — Executive Review Board frontend types (mirrors Pillow PILLOW-EREV-001). */

export type ExecutiveReviewRecord = {
  reviewId: string;
  reviewTitle: string;
  category: string;
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
  reviewStatus: string;
  confidence: number;
  evidence: string[];
  classification: string;
};

export type ReviewCalendarEntry = {
  calendarId: string;
  reviewId: string;
  title: string;
  category: string;
  scheduledDate: string;
  reviewCycle: string;
  status: string;
};

export type CurrentReviewEntry = {
  currentId: string;
  reviewId: string;
  title: string;
  category: string;
  reviewStatus: string;
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
  domain: string;
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

export type ExecutiveReviewBoard = {
  engineVersion: string;
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
  executiveReviewPipeline: Array<{
    phase: string;
    label: string;
    order: number;
    status: string;
  }>;
  recommendedActions: ExecutiveReviewRecommendation[];
  pillowEvaluations: Array<{ domain: string; label: string; status: string; summary: string }>;
  reviewPrinciples: string[];
  governedCategories: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  monitoringStatus: {
    backgroundMonitoring: string;
    activeReviewCount: number;
    pendingActionCount: number;
    overdueActionCount: number;
    reviewQualityScore: number;
    lastScanAt: string;
    nextScanAt: string;
  };
  executiveReport: {
    currentStatus: string;
    totalReviews: number;
    activeReviews: number;
    completedActions: number;
    executiveSummary: string;
    generatedAt: string;
  };
  metrics: {
    totalReviews: number;
    activeCount: number;
    completedCount: number;
    assignedActionCount: number;
    completedActionCount: number;
    averageConfidence: number;
    governanceHealthScore: number;
  };
  healthStatus: {
    status: string;
    healthScore: number;
    reviewRegisterCount: number;
    unreviewedCriticalAreas: number;
    auditEventCount: number;
    lastEventAt: string | null;
  };
  readyForE511: boolean;
};
