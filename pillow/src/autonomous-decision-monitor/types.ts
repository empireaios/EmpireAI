/** PILLOW-ADMON-001 — Autonomous Decision Monitor types (E2-15). */

import type {
  MONITORING_PIPELINE,
  MONITORING_PRINCIPLES,
  GOVERNED_MONITOR_DOMAINS,
  MONITOR_CLASSIFICATIONS,
  MONITORING_CAPABILITIES,
  AUTONOMOUS_ACTIONS,
  PILLOW_MONITOR_EVALUATIONS,
} from "./paths.js";

export type AutonomousDecisionMonitorVersion = "E2-15";

export type MonitoringPipelinePhase = (typeof MONITORING_PIPELINE)[number];
export type MonitoringPrinciple = (typeof MONITORING_PRINCIPLES)[number];
export type GovernedMonitorDomain = (typeof GOVERNED_MONITOR_DOMAINS)[number];
export type MonitorClassification = (typeof MONITOR_CLASSIFICATIONS)[number];
export type MonitoringCapability = (typeof MONITORING_CAPABILITIES)[number];
export type AutonomousAction = (typeof AUTONOMOUS_ACTIONS)[number];
export type PillowMonitorEvaluation = (typeof PILLOW_MONITOR_EVALUATIONS)[number];

export type MonitoringPipelineStep = {
  phase: MonitoringPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type MonitoredDecision = {
  monitorId: string;
  decisionId: string;
  title: string;
  category: MonitorClassification;
  domain: GovernedMonitorDomain;
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
  capability: MonitoringCapability;
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
  autonomousAction: AutonomousAction;
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
  capability: MonitoringCapability;
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
  domain: PillowMonitorEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type AutonomousDecisionMonitor = {
  engineVersion: AutonomousDecisionMonitorVersion;
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
  monitoringPrinciples: MonitoringPrinciple[];
  governedDomains: GovernedMonitorDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    decisionAuditEngine: string;
    executiveConfidenceEngine: string;
    executiveRecommendationEngine: string;
    executivePolicyEngine: string;
    knowledgeEvolution: string;
    guardianStatus: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE216: boolean;
};
