/** PILLOW-VIC-001 — Visual Intelligence Certification types (T5-10). */

import type {
  CERTIFICATION_CATEGORIES,
  CERTIFICATION_DECISIONS,
  CERTIFICATION_STATUSES,
  CERTIFIED_PROGRAMMES,
  T5_MISSION_IDS,
} from "./paths.js";
import type { VisualIntelligenceCertificationConfiguration } from "./configuration.js";

export type VisualIntelligenceCertificationEngineVersion = "PILLOW-VIC-001";
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];
export type CertificationDecision = (typeof CERTIFICATION_DECISIONS)[number];
export type CertifiedProgramme = (typeof CERTIFIED_PROGRAMMES)[number];
export type T5MissionId = (typeof T5_MISSION_IDS)[number];
export type CertificationCategory = (typeof CERTIFICATION_CATEGORIES)[number];

export type ProgrammeValidationResult = {
  programmeId: CertifiedProgramme;
  programmeName: string;
  passed: boolean;
  healthStatus: string;
  readinessScore: number;
  missionsValidated: number;
  missionsPassed: number;
  details: string[];
  warnings: string[];
  errors: string[];
  evidenceReferences: string[];
  durationMs: number;
};

export type MissionValidationResult = {
  missionId: T5MissionId;
  missionName: string;
  passed: boolean;
  healthStatus: string;
  readinessScore: number;
  details: string[];
  warnings: string[];
  errors: string[];
  evidenceReferences: string[];
  durationMs: number;
};

export type E2eValidationStep = {
  step: string;
  passed: boolean;
  details: string;
};

export type E2eValidationResult = {
  passed: boolean;
  steps: E2eValidationStep[];
  durationMs: number;
  summary: string;
};

export type ProductionReadinessResult = {
  passed: boolean;
  readinessScore: number;
  subsystemsHealthy: number;
  subsystemsTotal: number;
  recoveryOperational: boolean;
  details: string[];
  warnings: string[];
  errors: string[];
};

export type GovernanceComplianceResult = {
  passed: boolean;
  grandKingAuthorityPreserved: boolean;
  noAutonomousApproval: boolean;
  noAutonomousUxDeployment: boolean;
  validationMandatory: boolean;
  auditabilityPreserved: boolean;
  traceabilityPreserved: boolean;
  learnOnlyModeVerified: boolean;
  recommendOnlyModeVerified: boolean;
  details: string[];
  warnings: string[];
  errors: string[];
};

export type CapabilityValidationSummary = {
  programmesValidated: number;
  programmesPassed: number;
  t5MissionsValidated: number;
  t5MissionsPassed: number;
  categoriesCovered: CertificationCategory[];
  averageReadinessScore: number;
};

export type RecoveryVerificationResult = {
  subsystem: string;
  attempted: boolean;
  succeeded: boolean;
  details: string;
};

export type PerformanceSummary = {
  totalDurationMs: number;
  programmesValidated: number;
  programmesPassed: number;
  t5MissionsValidated: number;
  t5MissionsPassed: number;
  averageProgrammeDurationMs: number;
  endToEndDurationMs: number;
};

export type VisualIntelligenceCertificationReport = {
  certificationId: string;
  timestamp: string;
  certificationVersion: string;
  certifiedProgrammes: CertifiedProgramme[];
  certifiedMissions: string[];
  programmeResults: ProgrammeValidationResult[];
  t5MissionResults: MissionValidationResult[];
  endToEndValidationResult: E2eValidationResult;
  productionReadinessResult: ProductionReadinessResult;
  governanceComplianceResult: GovernanceComplianceResult;
  capabilityValidationSummary: CapabilityValidationSummary;
  detectedWarnings: string[];
  detectedFailures: string[];
  recoveryVerificationResults: RecoveryVerificationResult[];
  overallCertificationStatus: CertificationStatus;
  evidenceReferences: string[];
  confidenceScore: number;
  metadataVersion: string;
  finalCertificationDecision: CertificationDecision;
  reportOutputPath: string | null;
};

export type CertificationHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  certificationEnabled: boolean;
  lastCertificationAt: string | null;
  lastCertificationDecision: CertificationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type CertificationPerformanceStats = {
  totalCertifications: number;
  successfulCertifications: number;
  failedCertifications: number;
  averageCertificationDurationMs: number;
  peakCertificationDurationMs: number;
};

export type CertificationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type VisualIntelligenceCertificationState = {
  engineVersion: VisualIntelligenceCertificationEngineVersion;
  missionId: "T5-10";
  status: CertificationStatus;
  initializedAt: string;
  configuration: VisualIntelligenceCertificationConfiguration;
  latestReport: VisualIntelligenceCertificationReport | null;
  health: CertificationHealthReport;
  performance: CertificationPerformanceStats;
};

export type CertificationCockpitSnapshot = {
  certificationStatus: CertificationStatus;
  healthStatus: string;
  lastDecision: CertificationDecision | null;
  programmesPassed: number;
  programmesFailed: number;
  t5MissionsPassed: number;
  t5MissionsFailed: number;
  endToEndPassed: boolean;
  grandKingAuthorityPreserved: boolean;
  confidenceScore: number;
  totalCertifications: number;
  recentLogs: string[];
};

export type VisualIntelligenceEngineBundle = {
  visualFoundationCertification: import("../visual-foundation-certification-engine/engine.js").VisualFoundationCertificationEngine;
  uxIntelligenceCertification: import("../ux-intelligence-certification-engine/engine.js").UxIntelligenceCertificationEngine;
  autonomousBuilderCertification: import("../autonomous-builder-certification-engine/engine.js").AutonomousBuilderCertificationEngine;
  executiveCollaborationCertification: import("../executive-collaboration-certification-engine/engine.js").ExecutiveCollaborationCertificationEngine;
  continuousScreenObservation: import("../continuous-screen-observation-engine/engine.js").ContinuousScreenObservationEngine;
  autonomousUxAudit: import("../autonomous-ux-audit-engine/engine.js").AutonomousUxAuditEngine;
  uxOpportunityDiscovery: import("../ux-opportunity-discovery-engine/engine.js").UxOpportunityDiscoveryEngine;
  productivityIntelligence: import("../productivity-intelligence-engine/engine.js").ProductivityIntelligenceEngine;
  workflowEvolution: import("../workflow-evolution-engine/engine.js").WorkflowEvolutionEngine;
  adaptiveInterface: import("../adaptive-interface-engine/engine.js").AdaptiveInterfaceEngine;
  continuousUxEvolution: import("../continuous-ux-evolution-engine/engine.js").ContinuousUxEvolutionEngine;
  executiveWorkspaceIntelligence: import("../executive-workspace-intelligence-engine/engine.js").ExecutiveWorkspaceIntelligenceEngine;
  selfImprovingUx: import("../self-improving-ux-engine/engine.js").SelfImprovingUxEngine;
  approvalWorkflow: import("../approval-workflow/engine.js").ApprovalWorkflowEngine;
};

export type VisualIntelligenceCertificationInput = {
  sessionId?: string;
  forceCertification?: boolean;
  validationScope?: CertifiedProgramme[];
};
