/** E2-08 — Crisis Decision Engine frontend types (mirrors Pillow PILLOW-CDE-001). */

export type EnterpriseCrisis = {
  crisisId: string;
  title: string;
  description: string;
  category: string;
  domain: string;
  detectionSource: string;
  severity: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  riskScore: number;
  affectedSystems: string[];
  dependencies: string[];
  currentStatus: string;
  recommendedActions: string[];
  confidence: number;
  evidence: string[];
  recoveryProgress: number;
  requiredAuthority: string;
};

export type CrisisResponsePlan = {
  crisisId: string;
  title: string;
  domain: string;
  label: string;
  value: string;
  status: string;
};

export type RecoveryProgressEntry = {
  crisisId: string;
  title: string;
  severity: string;
  recoveryProgress: number;
  recoveryStrategy: string;
  status: string;
};

export type ExecutiveCrisisAction = {
  order: number;
  crisisId: string;
  title: string;
  action: string;
  authority: string;
  status: string;
};

export type CrisisPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type CrisisDecisionRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowCrisisEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type CrisisDecisionEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  crisisHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeCrisisCount: number;
  criticalCrisisCount: number;
  activeCrises: EnterpriseCrisis[];
  crisisResponsePlans: CrisisResponsePlan[];
  recoveryProgress: RecoveryProgressEntry[];
  executiveActions: ExecutiveCrisisAction[];
  crisisPipeline: CrisisPipelineStep[];
  recommendedActions: CrisisDecisionRecommendation[];
  pillowEvaluations: PillowCrisisEvaluationMetric[];
  crisisPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE209: boolean;
};
