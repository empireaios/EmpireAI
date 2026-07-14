/** E5-11 — Executive Policy Evolution frontend types (mirrors Pillow PILLOW-EPEV-001). */

export type PolicyEvolutionRecord = {
  evolutionId: string;
  policyId: string;
  policyName: string;
  domain: string;
  evolutionReason: string;
  currentVersion: string;
  proposedVersion: string;
  businessJustification: string;
  strategicImpact: string;
  governanceImpact: string;
  riskAssessment: string;
  approvalStatus: string;
  confidence: number;
  evidence: string[];
  effectiveDate: string;
  classification: string;
};

export type PolicyVersionEntry = {
  versionId: string;
  policyId: string;
  policyName: string;
  version: string;
  domain: string;
  status: string;
  effectiveDate: string;
  owner: string;
};

export type EvolutionQueueEntry = {
  queueId: string;
  evolutionId: string;
  policyName: string;
  proposedVersion: string;
  classification: string;
  approvalStatus: string;
  priority: number;
  scheduledDate: string;
};

export type ImprovementOpportunityEntry = {
  opportunityId: string;
  policyId: string;
  policyName: string;
  domain: string;
  opportunity: string;
  expectedImpact: string;
  confidence: number;
  status: string;
};

export type PolicyEffectivenessEntry = {
  effectivenessId: string;
  policyId: string;
  policyName: string;
  domain: string;
  effectivenessScore: number;
  complianceRate: number;
  adoptionRate: number;
  status: string;
};

export type GovernanceStabilityEntry = {
  stabilityId: string;
  domain: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutivePolicyEvolution = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  evolutionHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  totalEvolutionCount: number;
  pendingEvolutionCount: number;
  approvedEvolutionCount: number;
  publishedEvolutionCount: number;
  regressionRiskCount: number;
  policyEvolutionRegister: PolicyEvolutionRecord[];
  policyVersions: PolicyVersionEntry[];
  evolutionQueue: EvolutionQueueEntry[];
  improvementOpportunities: ImprovementOpportunityEntry[];
  policyEffectiveness: PolicyEffectivenessEntry[];
  governanceStability: GovernanceStabilityEntry[];
  policyEvolutionAnalysis: Array<{ domain: string; label: string; score: number; status: string; summary: string }>;
  policyEvolutionPipeline: Array<{ phase: string; label: string; order: number; status: string }>;
  recommendedActions: Array<{
    id: string;
    title: string;
    category: string;
    why: string;
    what: string;
    how: string;
    confidencePercent: number;
  }>;
  pillowEvaluations: Array<{ domain: string; label: string; status: string; summary: string }>;
  evolutionPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  monitoringStatus: {
    backgroundMonitoring: string;
    pendingEvolutionCount: number;
    approvedEvolutionCount: number;
    publishedEvolutionCount: number;
    policyStabilityScore: number;
    lastScanAt: string;
    nextScanAt: string;
  };
  executiveReport: {
    currentStatus: string;
    totalEvolutions: number;
    pendingEvolutions: number;
    publishedEvolutions: number;
    executiveSummary: string;
    generatedAt: string;
  };
  metrics: {
    totalEvolutions: number;
    pendingCount: number;
    approvedCount: number;
    publishedCount: number;
    averageConfidence: number;
    policyStabilityScore: number;
    governanceStabilityScore: number;
  };
  healthStatus: {
    status: string;
    healthScore: number;
    evolutionRegisterCount: number;
    regressionRiskCount: number;
    auditEventCount: number;
    lastEventAt: string | null;
  };
  readyForE512: boolean;
};
