/** PILLOW-SIE-001 — SEO Intelligence Engine types (R5-06). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SEO_ISSUE_SEVERITIES,
  SIE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SeoIntelligenceConfiguration } from "./configuration.js";

export type SeoIntelligenceEngineVersion = "PILLOW-SIE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type SieCapability = (typeof SIE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type SeoIssueSeverity = (typeof SEO_ISSUE_SEVERITIES)[number];

export type SeoEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SieCapability[];
  frameworkModuleId: string | null;
  journeyIntelligenceConnected: boolean;
  marketingDataPresent: boolean;
  activeProjectId: string | null;
  metadataVersion: string;
};

export type SeoRecord = {
  seoRecordId: string;
  timestamp: string;
  websiteReference: string;
  pageReference: string;
  keywordReference: string | null;
  rankingPosition: number | null;
  seoScore: number;
  technicalIssueSummary: string;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  organicSessions: number;
  organicClicks: number;
  organicImpressions: number;
};

export type SeoProject = {
  projectId: string;
  projectName: string;
  websiteReference: string;
  createdAt: string;
  status: "active" | "paused" | "archived";
};

export type KeywordRecord = {
  keywordReference: string;
  keyword: string;
  websiteReference: string;
  targetPageReference: string | null;
  searchVolume: number;
  difficulty: number;
  rankingPosition: number | null;
  timestamp: string;
};

export type SeoIssue = {
  issueId: string;
  pageReference: string;
  category: "technical" | "content" | "metadata" | "linking";
  severity: SeoIssueSeverity;
  summary: string;
  timestamp: string;
};

export type SeoRecommendation = {
  recommendationId: string;
  pageReference: string;
  type: "metadata" | "internal_link" | "content" | "technical";
  summary: string;
  priority: "low" | "medium" | "high";
  requiresValidationBeforeApply: true;
  timestamp: string;
};

export type SeoValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SeoRunReport = {
  seoRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_project"
    | "analyze_page"
    | "manage_keyword"
    | "track_ranking"
    | "detect_issues"
    | "optimize_metadata"
    | "recommend_internal_links"
    | "generate_recommendations"
    | "monitor_organic_performance";
  engineRecord: SeoEngineRecord;
  seoRecords: SeoRecord[];
  keywords: KeywordRecord[];
  issues: SeoIssue[];
  recommendations: SeoRecommendation[];
  validation: SeoValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SeoHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: SeoValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalProjects: number;
  totalPagesAnalyzed: number;
  totalKeywords: number;
  notes: string[];
};

export type SeoPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  pagesAnalyzed: number;
  keywordsTracked: number;
  rankingsUpdated: number;
  recommendationsGenerated: number;
  issuesDetected: number;
  organicPerformanceChecks: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SeoLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type SeoIntelligenceState = {
  engineVersion: SeoIntelligenceEngineVersion;
  missionId: "R5-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: SeoIntelligenceConfiguration;
  latestReport: SeoRunReport | null;
  engineRecord: SeoEngineRecord | null;
  health: SeoHealthReport;
  performance: SeoPerformanceStats;
};

export type SeoCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: SeoValidationReport["decision"] | null;
  pagesAnalyzed: number;
  keywordsTracked: number;
  frameworkRegistered: boolean;
  journeyIntelligenceConnected: boolean;
  recentLogs: string[];
};

export type ConnectSeoEngineInput = {
  websiteReference?: string;
  projectName?: string;
};

export type ManageSeoProjectInput = {
  projectName: string;
  websiteReference?: string;
};

export type AnalyzePageInput = {
  pageReference: string;
  websiteReference?: string;
  pageTitle?: string;
  metaDescription?: string;
};

export type ManageKeywordInput = {
  keyword: string;
  websiteReference?: string;
  targetPageReference?: string;
  searchVolume?: number;
  difficulty?: number;
};

export type TrackRankingInput = {
  keywordReference?: string;
  websiteReference?: string;
};

export type DetectIssuesInput = {
  pageReference?: string;
  websiteReference?: string;
};

export type OptimizeMetadataInput = {
  pageReference: string;
  websiteReference?: string;
  proposedTitle?: string;
  proposedDescription?: string;
};

export type RecommendInternalLinksInput = {
  pageReference: string;
  websiteReference?: string;
};

export type GenerateRecommendationsInput = {
  pageReference?: string;
  websiteReference?: string;
};

export type MonitorOrganicPerformanceInput = {
  websiteReference?: string;
  pageReference?: string;
};
