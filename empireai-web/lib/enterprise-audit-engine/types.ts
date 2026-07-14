/** E5-03 — Enterprise Audit Engine frontend types (mirrors Pillow PILLOW-EAUD-001). */

export type AuditRecord = {
  auditId: string;
  auditName: string;
  category: string;
  domain: string;
  scope: string;
  owner: string;
  evidence: string[];
  findings: string[];
  rootCause: string;
  severity: string;
  businessImpact: string;
  strategicImpact: string;
  correctiveActions: string[];
  priority: string;
  confidence: number;
  timestamp: string;
  status: string;
};

export type AuditScheduleEntry = {
  scheduleId: string;
  auditName: string;
  domain: string;
  category: string;
  scheduledAt: string;
  frequency: string;
  owner: string;
  status: string;
};

export type CriticalFindingEntry = {
  findingId: string;
  title: string;
  auditId: string;
  domain: string;
  severity: string;
  rootCause: string;
  businessImpact: string;
  correctiveAction: string;
  status: string;
};

export type CorrectiveActionEntry = {
  actionId: string;
  findingId: string;
  title: string;
  domain: string;
  owner: string;
  dueDate: string;
  progress: number;
  status: string;
};

export type AuditCoverageEntry = {
  coverageId: string;
  domain: string;
  label: string;
  coverageRate: number;
  lastAudited: string;
  nextScheduled: string;
  status: string;
};

export type AuditAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type EnterpriseAuditRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowAuditEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type EnterpriseAuditPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type EnterpriseAuditEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  auditHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeAuditCount: number;
  criticalFindingCount: number;
  openCorrectiveActionCount: number;
  auditCoverageRate: number;
  averageAuditConfidence: number;
  resolvedFindingCount: number;
  auditRecords: AuditRecord[];
  auditSchedule: AuditScheduleEntry[];
  criticalFindings: CriticalFindingEntry[];
  correctiveActions: CorrectiveActionEntry[];
  auditCoverage: AuditCoverageEntry[];
  auditAnalysis: AuditAnalysisMetric[];
  enterpriseAuditPipeline: EnterpriseAuditPipelineStep[];
  recommendedActions: EnterpriseAuditRecommendation[];
  pillowEvaluations: PillowAuditEvaluationMetric[];
  auditPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE504: boolean;
};
