/** E2-06 — Conflict Resolution Engine frontend types (mirrors Pillow PILLOW-CRE-001). */

export type EnterpriseConflict = {
  conflictId: string;
  title: string;
  description: string;
  conflictType: string;
  domain: string;
  source: string;
  affectedSystems: string[];
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  dependencies: string[];
  severity: string;
  priority: number;
  recommendedResolution: string;
  resolutionStrategy: string;
  confidence: number;
  evidence: string[];
  resolutionStatus: string;
  escalated: boolean;
};

export type ConflictAnalysisMetric = {
  dimension: string;
  label: string;
  score: number;
  status: string;
};

export type ResolutionStatusEntry = {
  conflictId: string;
  title: string;
  resolutionStrategy: string;
  recommendedResolution: string;
  status: string;
  progress: number;
  escalated: boolean;
};

export type ConflictEscalation = {
  order: number;
  conflictId: string;
  title: string;
  severity: string;
  reason: string;
  owner: string;
};

export type ConflictPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ConflictResolutionRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowConflictEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ConflictResolutionEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  conflictHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeConflictCount: number;
  criticalConflictCount: number;
  escalationCount: number;
  activeConflicts: EnterpriseConflict[];
  conflictAnalysis: ConflictAnalysisMetric[];
  resolutionStatus: ResolutionStatusEntry[];
  escalations: ConflictEscalation[];
  conflictPipeline: ConflictPipelineStep[];
  recommendedActions: ConflictResolutionRecommendation[];
  pillowEvaluations: PillowConflictEvaluationMetric[];
  conflictPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE207: boolean;
};
