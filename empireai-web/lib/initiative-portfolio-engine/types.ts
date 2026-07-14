/** E1-06 — Initiative Portfolio Engine frontend types (mirrors Pillow PILLOW-IPE-001). */

export type PortfolioInitiative = {
  initiativeId: string;
  title: string;
  description: string;
  purpose: string;
  businessCase: string;
  strategicObjective: string;
  portfolio: string;
  owner: string;
  priority: number;
  currentStatus: string;
  dependencies: string[];
  budget: string;
  resources: string;
  targetCompletion: string;
  successCriteria: string[];
  businessValue: string;
  evidence: string[];
  segment: string;
  domain: string;
  progressPercent: number;
  expectedRoi: string;
  risks: string[];
};

export type PortfolioHierarchyStep = {
  layer: string;
  label: string;
  order: number;
  summary: string;
};

export type InitiativeLifecycleStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PortfolioSegmentSummary = {
  segment: string;
  label: string;
  count: number;
  summary: string;
};

export type PortfolioAnalysisMetric = {
  domain: string;
  label: string;
  value: string;
  status: string;
};

export type PortfolioRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowPortfolioEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type InitiativePortfolioEngine = {
  architectureVersion: "E1-06";
  computedAt: string;
  portfolioSummary: string;
  portfolioHealth: string;
  visionAlignment: string;
  strategicCoverage: string;
  healthScore: number;
  overallProgress: number;
  activeInitiativeCount: number;
  activeInitiatives: PortfolioInitiative[];
  portfolioHierarchy: PortfolioHierarchyStep[];
  initiativeLifecycle: InitiativeLifecycleStep[];
  portfolioSegments: PortfolioSegmentSummary[];
  portfolioAnalysis: PortfolioAnalysisMetric[];
  recommendedActions: PortfolioRecommendation[];
  pillowEvaluations: PillowPortfolioEvaluationMetric[];
  portfolioPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE107: boolean;
};
