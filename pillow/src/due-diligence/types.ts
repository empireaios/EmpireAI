/** PILLOW-011 — Continuous Due Diligence Engine types. */

export type AnalysisDomain =
  | "repository_architecture"
  | "mission_progression"
  | "repository_health"
  | "journey_consistency"
  | "architecture_decisions"
  | "ux_implementation"
  | "pillow_implementation"
  | "commercial_readiness"
  | "engineering_quality"
  | "executive_governance"
  | "automation_opportunities"
  | "recovery_readiness"
  | "repository_synchronization"
  | "technical_debt"
  | "future_scalability";

export type ReviewCategory =
  | "architecture_review"
  | "risk_review"
  | "repository_review"
  | "dependency_review"
  | "mission_review"
  | "governance_review"
  | "commercial_review"
  | "security_review"
  | "performance_review"
  | "automation_review"
  | "scalability_review"
  | "repository_drift_review";

export type RecommendationPriority =
  | "critical"
  | "high"
  | "normal"
  | "low"
  | "future";

export type OpportunityKind =
  | "architecture_improvement"
  | "commercial_opportunity"
  | "repository_improvement"
  | "mission_improvement"
  | "automation_opportunity"
  | "workflow_improvement"
  | "cost_reduction"
  | "performance_optimization"
  | "engineering_simplification"
  | "future_product_opportunity";

export interface ReviewFinding {
  category: ReviewCategory;
  domain: AnalysisDomain;
  summary: string;
  evidence: string[];
  severity: RecommendationPriority;
}

export interface DueDiligenceRecommendation {
  id: string;
  priority: RecommendationPriority;
  kind: OpportunityKind;
  reason: string;
  evidence: string[];
  affectedOwners: string[];
  expectedBenefit: string;
  estimatedImpact: "critical" | "high" | "medium" | "low";
  recommendedAction: string;
  requiresGrandKingApproval: true;
}

export interface DueDiligenceReport {
  reportId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  interrupted: boolean;
  findings: ReviewFinding[];
  recommendations: DueDiligenceRecommendation[];
  domainsAnalysed: AnalysisDomain[];
  categoriesReviewed: ReviewCategory[];
}

export interface DueDiligenceEngineState {
  engineVersion: "PILLOW-011";
  status: "ready" | "analysing" | "interrupted";
  initializedAt: string;
  doctrinePath: string;
  totalCycles: number;
  lastReport: DueDiligenceReport | null;
  interrupted: boolean;
  lastInterruptAt: string | null;
}

export interface DueDiligenceEngineOptions {
  /** Max recommendations per cycle (avoid noise). */
  maxRecommendations?: number;
}

export interface GrandKingInterrupt {
  command: string;
  at: string;
}
