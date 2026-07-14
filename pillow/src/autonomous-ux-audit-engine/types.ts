/** PILLOW-AUA-001 — Autonomous UX Audit types (T5-02). */

import type {
  AUDIT_STATUSES,
  ENGINE_STATUSES,
  ISSUE_SEVERITIES,
  UX_ISSUE_CATEGORIES,
} from "./paths.js";
import type { AutonomousUxAuditConfiguration } from "./configuration.js";

export type AutonomousUxAuditEngineVersion = "PILLOW-AUA-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type UxIssueCategory = (typeof UX_ISSUE_CATEGORIES)[number];
export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];

export type DetectedUxIssue = {
  issueId: string;
  category: UxIssueCategory;
  description: string;
  severity: IssueSeverity;
  affectedComponentId: string | null;
  affectedLayoutRegionId: string | null;
  affectedNavigationNodeId: string | null;
  evidenceReference: string;
  detectionConfidence: number;
  sourceEngine: string;
};

export type UxAuditRecord = {
  auditId: string;
  timestamp: string;
  sourceObservationId: string | null;
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  detectedUxIssues: DetectedUxIssue[];
  affectedComponents: string[];
  affectedLayoutRegions: string[];
  affectedNavigationNodes: string[];
  issueSeverity: IssueSeverity;
  evidenceReferences: string[];
  confidenceScore: number;
  auditStatus: AuditStatus;
  metadataVersion: string;
  auditOnly: true;
};

export type AuditValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  auditsValidated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AutonomousUxAuditRunReport = {
  auditRunReportId: string;
  runTimestamp: string;
  audit: UxAuditRecord;
  validation: AuditValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AuditSessionRecord = {
  auditSessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: EngineStatus;
  auditsRecorded: number;
  auditsFailed: number;
  issuesDetected: number;
  lastAuditAt: string | null;
  lastScreenId: string | null;
  lastRouteId: string | null;
  continuousAuditActive: boolean;
};

export type AuditHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  auditEnabled: boolean;
  continuousAuditActive: boolean;
  lastAuditAt: string | null;
  lastValidationDecision: AuditValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type AuditPerformanceStats = {
  totalAudits: number;
  successfulAudits: number;
  failedAudits: number;
  totalIssuesDetected: number;
  layoutIssuesDetected: number;
  componentIssuesDetected: number;
  navigationIssuesDetected: number;
  workflowIssuesDetected: number;
  accessibilityIssuesDetected: number;
  consistencyIssuesDetected: number;
  stateIssuesDetected: number;
  averageAuditDurationMs: number;
  peakAuditDurationMs: number;
  skippedCycles: number;
};

export type AutonomousUxAuditPerformanceStats = AuditPerformanceStats;

export type AuditLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AutonomousUxAuditState = {
  engineVersion: AutonomousUxAuditEngineVersion;
  missionId: "T5-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: AutonomousUxAuditConfiguration;
  latestReport: AutonomousUxAuditRunReport | null;
  activeSession: AuditSessionRecord | null;
  latestAudit: UxAuditRecord | null;
  health: AuditHealthReport;
  performance: AuditPerformanceStats;
};

export type AutonomousUxAuditCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: AuditHealthReport["status"];
  lastDecision: AuditValidationReport["decision"] | null;
  continuousAuditActive: boolean;
  totalAudits: number;
  totalIssuesDetected: number;
  layoutIssuesDetected: number;
  accessibilityIssuesDetected: number;
  confidenceScore: number;
  recentLogs: string[];
};

export type AutonomousUxAuditInput = {
  sessionId?: string;
  forceAudit?: boolean;
  observationId?: string;
};

export type AutonomousUxAuditEngineBundle = {
  continuousScreenObservation: import("../continuous-screen-observation-engine/engine.js").ContinuousScreenObservationEngine | null;
  uxRuleEngine: import("../ux-rule-engine/engine.js").UxRuleEngine | null;
  designSystemIntelligence: import("../design-system-intelligence-engine/engine.js").DesignSystemIntelligenceEngine | null;
  accessibilityIntelligence: import("../accessibility-intelligence-engine/engine.js").AccessibilityIntelligenceEngine | null;
  visualConsistency: import("../visual-consistency-engine/engine.js").VisualConsistencyEngine | null;
  layoutEvaluation: import("../layout-evaluation-engine/engine.js").LayoutEvaluationEngine | null;
  workflowOptimization: import("../workflow-optimization-engine/engine.js").WorkflowOptimizationEngine | null;
};
