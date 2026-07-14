/** PILLOW-GM-001 — Guardian Monitoring types (P5-04). */

import type {
  ALERT_SEVERITIES,
  HEALTH_CLASSIFICATIONS,
  MONITORED_DOMAINS,
  MONITORING_DOCUMENTATION_FIELDS,
} from "./paths.js";

export type MonitoredDomain = (typeof MONITORED_DOMAINS)[number];
export type HealthClassification = (typeof HEALTH_CLASSIFICATIONS)[number];
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];
export type MonitoringDocField = (typeof MONITORING_DOCUMENTATION_FIELDS)[number];

export interface GuardianMonitoringState {
  engineVersion: "PILLOW-GM-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  lastAssessment: GuardianMonitoringAssessment | null;
}

export interface GuardianMonitoringRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
}

export interface GuardianMonitoringBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: GuardianMonitoringReadinessPipeline;
}

export interface GuardianMonitoringReadinessPipeline {
  pipelineVersion: "P5-04";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  componentRegistryComplete: boolean;
  alertingImplemented: boolean;
  historicalMonitoringImplemented: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface MonitoredComponentRecord {
  id: string;
  domain: MonitoredDomain;
  name: string;
  purpose: string;
  healthStatus: HealthClassification;
  metricsCollected: string[];
  alertThresholds: string;
  probeSource: string;
  owner: string;
  dependencies: string[];
  knownDegradations: string[];
  futureEvolution: string;
}

export interface GuardianAlertRecord {
  alertId: string;
  timestamp: string;
  affectedComponent: string;
  severity: AlertSeverity;
  observedSymptoms: string;
  probableCause: string;
  recommendedAction: string;
  currentStatus: "open" | "acknowledged" | "resolved";
}

export interface GuardianMonitoringSnapshot {
  capturedAt: string;
  nodeEnv: string;
  eventLoopLagMs: number;
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  redisConnected: boolean;
  redisMode: "connected" | "degraded" | "unknown";
  queueDepth: number;
  workersActive: boolean;
  sqliteHealthy: boolean;
  apiHealthy: boolean;
  pillowHostRunning: boolean;
  pillowHostSessions: number;
  authStoreMode: "redis" | "in_memory";
  guardianBackendOverall?: string;
  openGuardianRisks?: number;
}

export interface GuardianMetricsBundle {
  cpuUsagePercent: number;
  memoryUsageMb: number;
  memoryTotalMb: number;
  diskUsageNote: string;
  networkLatencyMs: number;
  apiLatencyMs: number;
  queueDepth: number;
  workerStatus: string;
  sessionCount: number;
  authenticationHealth: string;
  redisHealth: string;
  databaseHealth: string;
  errorRateNote: string;
  recoveryCount: number;
  heartbeatStatus: string;
}

export interface HistoricalTimelineEntry {
  timestamp: string;
  kind: "health" | "performance" | "incident" | "recovery" | "alert" | "availability";
  label: string;
  detail: string;
  health: HealthClassification;
}

export interface GuardianMonitoringAssessment {
  pipelineVersion: "P5-04";
  assessedAt: string;
  overallHealth: HealthClassification;
  runtimeHealth: HealthClassification;
  componentHealth: Record<string, HealthClassification>;
  metrics: GuardianMetricsBundle;
  alerts: GuardianAlertRecord[];
  components: MonitoredComponentRecord[];
  snapshot: GuardianMonitoringSnapshot | null;
  historicalTimeline: HistoricalTimelineEntry[];
  success: boolean;
  summary: string;
  grandKingSummary: string;
}

export interface GuardianMonitoringMetrics {
  totalComponents: number;
  healthyCount: number;
  degradedCount: number;
  criticalCount: number;
  openAlerts: number;
  readinessScore: number;
  driftSignals: number;
  trend: "improving" | "stable" | "degrading";
}

export interface GuardianMonitoringAnalysis {
  monitoringTrends: string[];
  architectureWeaknesses: string[];
  performanceDrift: string[];
  productionDrift: string[];
  reliabilityTrends: string[];
  operationalRisks: string[];
  recommendations: string[];
}
