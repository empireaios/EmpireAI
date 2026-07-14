/** PILLOW-ETRAN-001 — Executive Transparency Engine types (E5-07). */

import type {
  EXECUTIVE_TRANSPARENCY_PIPELINE,
  TRANSPARENCY_PRINCIPLES,
  GOVERNED_TRANSPARENCY_DOMAINS,
  TRANSPARENCY_CLASSIFICATIONS,
  TRANSPARENCY_ANALYSIS_DOMAINS,
  PILLOW_TRANSPARENCY_PUBLICATIONS,
} from "./paths.js";

export type ExecutiveTransparencyEngineVersion = "E5-07";

export type ExecutiveTransparencyPipelinePhase = (typeof EXECUTIVE_TRANSPARENCY_PIPELINE)[number];
export type TransparencyPrinciple = (typeof TRANSPARENCY_PRINCIPLES)[number];
export type GovernedTransparencyDomain = (typeof GOVERNED_TRANSPARENCY_DOMAINS)[number];
export type TransparencyClassification = (typeof TRANSPARENCY_CLASSIFICATIONS)[number];
export type TransparencyAnalysisDomain = (typeof TRANSPARENCY_ANALYSIS_DOMAINS)[number];
export type PillowTransparencyPublication = (typeof PILLOW_TRANSPARENCY_PUBLICATIONS)[number];

export type ExecutiveTransparencyPipelineStep = {
  phase: ExecutiveTransparencyPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type TransparencyRecord = {
  transparencyId: string;
  executiveActivity: string;
  category: GovernedTransparencyDomain;
  origin: string;
  owner: string;
  authority: string;
  visibilityLevel: TransparencyClassification;
  businessImpact: string;
  strategicImpact: string;
  relatedDecisions: string[];
  supportingEvidence: string[];
  confidence: number;
  timestamp: string;
};

export type ExecutiveActivityFeedEntry = {
  feedId: string;
  transparencyId: string;
  activity: string;
  category: GovernedTransparencyDomain;
  owner: string;
  visibilityLevel: TransparencyClassification;
  status: string;
  timestamp: string;
};

export type GovernanceTimelineEntry = {
  timelineId: string;
  transparencyId: string;
  event: string;
  domain: GovernedTransparencyDomain;
  owner: string;
  visibilityLevel: TransparencyClassification;
  timestamp: string;
};

export type DecisionTimelineEntry = {
  decisionId: string;
  transparencyId: string;
  decision: string;
  decisionMaker: string;
  authority: string;
  visibilityLevel: TransparencyClassification;
  outcome: string;
  timestamp: string;
};

export type RepositoryActivityEntry = {
  activityId: string;
  transparencyId: string;
  activity: string;
  owner: string;
  visibilityLevel: TransparencyClassification;
  impact: string;
  timestamp: string;
};

export type MissionStatusEntry = {
  missionId: string;
  transparencyId: string;
  mission: string;
  status: string;
  owner: string;
  visibilityLevel: TransparencyClassification;
  progress: number;
  timestamp: string;
};

export type ProgrammeStatusEntry = {
  programmeId: string;
  transparencyId: string;
  programme: string;
  phase: string;
  status: string;
  owner: string;
  visibilityLevel: TransparencyClassification;
  timestamp: string;
};

export type TransparencyAnalysisMetric = {
  domain: TransparencyAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveTransparencyRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowTransparencyPublicationMetric = {
  domain: PillowTransparencyPublication;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveTransparencyEngine = {
  engineVersion: ExecutiveTransparencyEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  transparencyHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  visibilityCoverageScore: number;
  transparencyRecordCount: number;
  hiddenActionCount: number;
  fullyVisibleCount: number;
  executiveActivityFeed: ExecutiveActivityFeedEntry[];
  governanceTimeline: GovernanceTimelineEntry[];
  decisionTimeline: DecisionTimelineEntry[];
  repositoryActivity: RepositoryActivityEntry[];
  missionStatus: MissionStatusEntry[];
  programmeStatus: ProgrammeStatusEntry[];
  transparencyRecords: TransparencyRecord[];
  transparencyAnalysis: TransparencyAnalysisMetric[];
  executiveTransparencyPipeline: ExecutiveTransparencyPipelineStep[];
  recommendedActions: ExecutiveTransparencyRecommendation[];
  pillowPublications: PillowTransparencyPublicationMetric[];
  transparencyPrinciples: TransparencyPrinciple[];
  governedDomains: GovernedTransparencyDomain[];
  pillowAdvisory: string[];
  integrations: {
    enterpriseGovernanceFramework: string;
    executiveConstitutionalMonitor: string;
    enterpriseAuditEngine: string;
    executiveComplianceEngine: string;
    executiveEthicsEngine: string;
    executiveAccountabilityEngine: string;
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
  readyForE508: boolean;
};
