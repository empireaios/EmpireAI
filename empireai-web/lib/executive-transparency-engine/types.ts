/** E5-07 — Executive Transparency Engine frontend types (mirrors Pillow PILLOW-ETRAN-001). */

export type TransparencyRecord = {
  transparencyId: string;
  executiveActivity: string;
  category: string;
  origin: string;
  owner: string;
  authority: string;
  visibilityLevel: string;
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
  category: string;
  owner: string;
  visibilityLevel: string;
  status: string;
  timestamp: string;
};

export type GovernanceTimelineEntry = {
  timelineId: string;
  transparencyId: string;
  event: string;
  domain: string;
  owner: string;
  visibilityLevel: string;
  timestamp: string;
};

export type DecisionTimelineEntry = {
  decisionId: string;
  transparencyId: string;
  decision: string;
  decisionMaker: string;
  authority: string;
  visibilityLevel: string;
  outcome: string;
  timestamp: string;
};

export type RepositoryActivityEntry = {
  activityId: string;
  transparencyId: string;
  activity: string;
  owner: string;
  visibilityLevel: string;
  impact: string;
  timestamp: string;
};

export type MissionStatusEntry = {
  missionId: string;
  transparencyId: string;
  mission: string;
  status: string;
  owner: string;
  visibilityLevel: string;
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
  visibilityLevel: string;
  timestamp: string;
};

export type TransparencyAnalysisMetric = {
  domain: string;
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
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveTransparencyPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ExecutiveTransparencyEngine = {
  engineVersion: string;
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
  transparencyPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE508: boolean;
};
