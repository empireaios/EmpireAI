export {
  AUDIT_SEVERITIES,
  auditDimensionResultSchema,
  validateAuditDimensionResult,
} from "./models/audit-dimension.js";
export type {
  AuditSeverity,
  AuditDimensionResult,
  ArchitectureAudit,
  SecurityAudit,
  ScalabilityAudit,
  PerformanceAudit,
  ReliabilityAudit,
  BusinessReadinessAudit,
  DeploymentReadinessAudit,
  LaunchReadinessAudit,
} from "./models/audit-dimension.js";

export {
  ISSUE_CATEGORIES,
  criticalIssueSchema,
  validateCriticalIssue,
} from "./models/critical-issue.js";
export type { IssueCategory, CriticalIssue } from "./models/critical-issue.js";

export {
  RECOMMENDATION_PRIORITIES,
  auditRecommendationSchema,
  validateAuditRecommendation,
} from "./models/audit-recommendation.js";
export type { RecommendationPriority, AuditRecommendation } from "./models/audit-recommendation.js";

export {
  READINESS_TIERS,
  empireReadinessScoreSchema,
  validateEmpireReadinessScore,
} from "./models/empire-readiness-score.js";
export type { ReadinessTier, EmpireReadinessScore } from "./models/empire-readiness-score.js";

export {
  MISSION_PHASES,
  missionRoadmapEntrySchema,
  nextMissionsRoadmapSchema,
  validateMissionRoadmapEntry,
  validateNextMissionsRoadmap,
} from "./models/next-missions-roadmap.js";
export type {
  MissionPhase,
  MissionRoadmapEntry,
  NextMissionsRoadmap,
} from "./models/next-missions-roadmap.js";

export {
  EMPIRE_AUDIT_SIGNAL_TYPES,
  empireAuditSignalSchema,
  validateEmpireAuditSignal,
} from "./models/empire-audit-signal.js";
export type { EmpireAuditSignalType, EmpireAuditSignal } from "./models/empire-audit-signal.js";

export {
  empireAuditReportSchema,
  validateEmpireAuditReport,
} from "./models/empire-audit-report.js";
export type {
  EmpireAuditReportId,
  EmpireAuditReport,
  EmpireAuditReportCreateInput,
} from "./models/empire-audit-report.js";

export {
  empireAuditRecordSchema,
  validateEmpireAuditRecord,
} from "./models/empire-audit-record.js";
export type {
  EmpireAuditRecordId,
  EmpireAuditRecord,
  EmpireAuditRecordCreateInput,
} from "./models/empire-audit-record.js";

export type {
  EmpireAuditIntelligenceRepositoryQuery,
  EmpireAuditIntelligenceRepository,
} from "./repositories/empire-audit-intelligence-repository.js";

export {
  InMemoryEmpireAuditIntelligenceRepository,
  createInMemoryEmpireAuditIntelligenceRepository,
} from "./repositories/in-memory-empire-audit-intelligence-repository.js";

export {
  EMPIRE_AUDIT_SIGNAL_WEIGHTS,
  generateEmpireAudit,
  empireAuditIntelligenceScoring,
} from "./scoring/empire-audit-intelligence-scoring.js";
export type { EmpireAuditInput, EmpireAuditBreakdown } from "./scoring/empire-audit-intelligence-scoring.js";

export {
  EmpireAuditIntelligenceEngine,
  defaultEmpireAuditIntelligenceEngine,
} from "./engines/empire-audit-intelligence-engine.js";

export {
  EMPIRE_AUDIT_INTELLIGENCE_MODULE_ID,
  EMPIRE_AUDIT_INTELLIGENCE_MODULE_VERSION,
  EMPIRE_AUDIT_INTELLIGENCE_CAPABILITIES,
  EMPIRE_AUDIT_INTELLIGENCE_MODULE_CONTRACT,
  EmpireAuditIntelligenceModule,
  createEmpireAuditIntelligenceModule,
  empireAuditIntelligenceModule,
} from "./contract/empire-audit-intelligence-module.js";
export type {
  EmpireAuditIntelligenceModuleId,
  EmpireAuditIntelligenceCapability,
  EmpireAuditIntelligenceModuleContract,
} from "./contract/empire-audit-intelligence-module.js";
