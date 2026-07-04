/** PILLOW-CEV-001 — Continuous Empire Evolution types (Phase 10). */

export type InspectionDomain =
  | "architecture"
  | "engineering"
  | "commerce"
  | "infrastructure"
  | "security"
  | "operations"
  | "governance"
  | "documentation";

export interface DueDiligenceFinding {
  domain: InspectionDomain;
  severity: "critical" | "high" | "medium" | "low";
  weakness: string;
  preventiveAction: string;
}

export interface DueDiligenceCoverage {
  domainsInspected: InspectionDomain[];
  findings: DueDiligenceFinding[];
  overallWeaknessScore: number;
}

export type ImprovementCategory =
  | "technical_debt"
  | "duplicate_logic"
  | "performance"
  | "automation"
  | "cost_reduction"
  | "quality";

export interface ImprovementBacklogItem {
  id: string;
  category: ImprovementCategory;
  title: string;
  description: string;
  priority: number;
  estimatedEffort: "low" | "medium" | "high";
}

export interface SelfImprovementReport {
  backlog: ImprovementBacklogItem[];
  totalItems: number;
  topPriority: ImprovementBacklogItem | null;
}

export type OpportunityType =
  | "product"
  | "supplier"
  | "market"
  | "ai_capability"
  | "business_model"
  | "revenue";

export interface DiscoveredOpportunity {
  type: OpportunityType;
  title: string;
  valueScore: number;
  rationale: string;
  aboveThreshold: boolean;
}

export interface OpportunityDiscoveryReport {
  opportunities: DiscoveredOpportunity[];
  highValueCount: number;
  qualityThreshold: number;
}

export type RiskCategory =
  | "engineering"
  | "security"
  | "deployment"
  | "financial"
  | "operational"
  | "business";

export interface DetectedRisk {
  category: RiskCategory;
  level: "critical" | "high" | "medium" | "low";
  description: string;
  preventiveAction: string;
}

export interface RiskDetectionReport {
  risks: DetectedRisk[];
  criticalCount: number;
  overallRiskScore: number;
}

export interface OptimisationPlan {
  domain: "engineering" | "infrastructure" | "commerce" | "operations";
  action: string;
  autonomous: boolean;
  requiresApproval: boolean;
  expectedBenefit: string;
}

export interface AutonomousOptimisationReport {
  plans: OptimisationPlan[];
  autonomousCount: number;
  approvalRequiredCount: number;
}

export interface ExecutiveRecommendation {
  id: string;
  title: string;
  missionId: string | null;
  businessImpact: "low" | "medium" | "high" | "critical";
  technicalImpact: "low" | "medium" | "high" | "critical";
  estimatedEffort: "low" | "medium" | "high";
  expectedRoi: number;
  empireValueScore: number;
  rationale: string;
}

export interface EmpireEvolutionMetrics {
  automationIndex: number;
  qualityIndex: number;
  profitabilityIndex: number;
  intelligenceIndex: number;
  reliabilityIndex: number;
  maintainabilityIndex: number;
  executiveVisibilityIndex: number;
  stagnationRisk: "low" | "medium" | "high";
  evolutionTrend: "accelerating" | "steady" | "stagnating";
}

export interface Version1FinalCertification {
  certified: boolean;
  overallScore: number;
  phasesComplete: number;
  totalPhases: number;
  readinessLevel: "production" | "conditional" | "not_ready";
  summary: string;
  blockers: string[];
}

export interface ContinuousEvolutionReport {
  version: "PILLOW-CEV-001";
  generatedAt: string;
  dueDiligence: DueDiligenceCoverage;
  selfImprovement: SelfImprovementReport;
  opportunities: OpportunityDiscoveryReport;
  risks: RiskDetectionReport;
  optimisation: AutonomousOptimisationReport;
  recommendations: ExecutiveRecommendation[];
  evolution: EmpireEvolutionMetrics;
  version1Certification: Version1FinalCertification;
  recommendedActions: string[];
  executiveBrief: string;
}

export interface ContinuousEvolutionState {
  evolutionVersion: "PILLOW-CEV-001";
  status: "ready";
  initializedAt: string;
  totalEvolutionCycles: number;
  domainsMonitored: InspectionDomain[];
  improvementBacklogSize: number;
}

export interface ContinuousEvolutionDeps {
  bootstrap: import("../bootstrap/types.js").EmpireBootstrapContext;
  intelligence: import("../intelligence/types.js").RepositoryIntelligenceContext;
  dueDiligence: import("../due-diligence/engine.js").ContinuousDueDiligenceEngine;
  improvement: import("../improvement/engine.js").AutonomousImprovementEngine;
  empireCommander: import("../empire-commander/engine.js").EmpireCommanderEngine;
  empireOperatingSystem: import("../empire-operating-system/engine.js").EmpireOperatingSystemEngine;
  commerceIntelligence: import("../commerce-intelligence/engine.js").CommerceIntelligenceEngine;
  infrastructureCommander: import("../infrastructure-commander/engine.js").InfrastructureCommanderEngine;
  orchestrator?: import("../orchestrator/engine.js").EmpireAIOrchestrator;
  objective?: import("../objective/engine.js").ObjectiveEngine;
}
