/** E2-15 — Autonomous Decision Monitor frontend types (mirrors Pillow PILLOW-ADMON-001). */

export type MonitoredDecision = {
  monitorId: string;
  decisionId: string;
  title: string;
  category: string;
  domain: string;
  currentStatus: string;
  expectedOutcome: string;
  actualOutcome: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  performanceTrend: string;
  deviationScore: number;
  confidenceTrend: string;
  recommendedActions: string[];
  evidence: string[];
};

export type PerformanceTrendEntry = {
  monitorId: string;
  decisionId: string;
  title: string;
  previousHealth: number;
  currentHealth: number;
  trend: string;
  monitoringStatus: string;
};

export type DeviationEntry = {
  deviationId: string;
  monitorId: string;
  decisionId: string;
  title: string;
  capability: string;
  deviationScore: number;
  severity: string;
  description: string;
  detectedAt: string;
  status: string;
};

export type ExecutiveAlert = {
  alertId: string;
  monitorId: string;
  decisionId: string;
  title: string;
  severity: string;
  category: string;
  message: string;
  autonomousAction: string;
  status: string;
  timestamp: string;
};

export type CorrectiveActionEntry = {
  actionId: string;
  monitorId: string;
  decisionId: string;
  title: string;
  action: string;
  priority: string;
  owner: string;
  status: string;
  expectedImpact: string;
};

export type ConfidenceChangeEntry = {
  monitorId: string;
  decisionId: string;
  title: string;
  previousConfidence: number;
  currentConfidence: number;
  change: number;
  reason: string;
  status: string;
};

export type BusinessOutcomeEntry = {
  monitorId: string;
  decisionId: string;
  title: string;
  outcome: string;
  businessImpact: string;
  financialImpact: string;
  status: string;
  evidence: string;
};

export type MonitoringCapabilityMetric = {
  capability: string;
  label: string;
  detections: number;
  status: string;
  summary: string;
};

export type AutonomousDecisionRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowMonitorEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type MonitoringPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type AutonomousDecisionMonitor = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  decisionHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  monitoredDecisionCount: number;
  healthyDecisionCount: number;
  degradedDecisionCount: number;
  alertCount: number;
  deviationCount: number;
  averageDeviationScore: number;
  monitoredDecisions: MonitoredDecision[];
  performanceTrends: PerformanceTrendEntry[];
  currentDeviations: DeviationEntry[];
  executiveAlerts: ExecutiveAlert[];
  confidenceChanges: ConfidenceChangeEntry[];
  correctiveActions: CorrectiveActionEntry[];
  businessOutcomes: BusinessOutcomeEntry[];
  monitoringCapabilities: MonitoringCapabilityMetric[];
  monitoringPipeline: MonitoringPipelineStep[];
  recommendedActions: AutonomousDecisionRecommendation[];
  pillowEvaluations: PillowMonitorEvaluationMetric[];
  monitoringPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE216: boolean;
};
