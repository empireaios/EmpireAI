/** PILLOW-EC-001 — Empire Commander types (Phase 8). */

export type EmpireDomain =
  | "engineering"
  | "infrastructure"
  | "commerce"
  | "ux"
  | "business"
  | "operations"
  | "financial"
  | "customer";

export interface DomainSignal {
  domain: EmpireDomain;
  healthScore: number;
  summary: string;
  risks: string[];
  opportunities: string[];
}

export interface CrossDomainSynthesis {
  overallHealthScore: number;
  domainSignals: DomainSignal[];
  connectedInsights: string[];
  systemicRisks: string[];
}

export type DecisionImpactLevel = "low" | "medium" | "high" | "critical";

export interface ExecutiveDecisionOption {
  id: string;
  label: string;
  businessImpact: DecisionImpactLevel;
  technicalImpact: DecisionImpactLevel;
  financialImpact: DecisionImpactLevel;
  operationalImpact: DecisionImpactLevel;
  riskLevel: DecisionImpactLevel;
  sustainabilityScore: number;
  compositeScore: number;
  recommendation: "recommended" | "acceptable" | "defer" | "reject";
  rationale: string;
}

export interface ExecutiveDecisionEvaluation {
  query: string;
  options: ExecutiveDecisionOption[];
  bestOptionId: string;
  executiveSummary: string;
}

export interface EnginePriority {
  engineId: string;
  label: string;
  priority: number;
  status: "ready" | "degraded" | "blocked";
  dependencyNotes: string[];
}

export interface EngineCoordinationPlan {
  priorities: EnginePriority[];
  conflicts: string[];
  deduplicationNotes: string[];
  scheduledActions: string[];
}

export interface StrategicPlan {
  horizon: "30d" | "90d" | "180d";
  roadmapItems: string[];
  executionPlan: string[];
  growthInitiatives: string[];
  technologyEvolution: string[];
  commerceExpansion: string[];
  operationalPriorities: string[];
}

export interface OptimizationRecommendation {
  area: string;
  currentState: string;
  targetImprovement: string;
  expectedBenefit: string;
  priority: number;
}

export interface BusinessOptimizationReport {
  recommendations: OptimizationRecommendation[];
  profitLevers: string[];
  efficiencyLevers: string[];
  automationLevers: string[];
}

export interface EmpireCommanderReport {
  version: "PILLOW-EC-001";
  generatedAt: string;
  crossDomain: CrossDomainSynthesis;
  decisionEvaluation: ExecutiveDecisionEvaluation | null;
  coordination: EngineCoordinationPlan;
  strategicPlan: StrategicPlan;
  optimization: BusinessOptimizationReport;
  engineeringSummary: string;
  infrastructureSummary: string;
  commerceSummary: string;
  businessSummary: string;
  riskAssessment: string;
  strategicPriorities: string[];
  recommendedActions: string[];
  executiveBrief: string;
}

export interface EmpireCommanderState {
  commanderVersion: "PILLOW-EC-001";
  status: "ready";
  initializedAt: string;
  totalCommands: number;
  domainsMonitored: EmpireDomain[];
  enginesCoordinated: number;
}

export interface EmpireCommanderDeps {
  bootstrap: import("../bootstrap/types.js").EmpireBootstrapContext;
  intelligence: import("../intelligence/types.js").RepositoryIntelligenceContext;
  technicalChief: import("../technical-chief/engine.js").TechnicalChiefEngine;
  uxDesigner: import("../ux-designer/engine.js").UxDesignerEngine;
  cursorBridge: import("../cursor-bridge/engine.js").CursorBridgeEngine;
  infrastructureCommander: import("../infrastructure-commander/engine.js").InfrastructureCommanderEngine;
  commerceIntelligence: import("../commerce-intelligence/engine.js").CommerceIntelligenceEngine;
  planner?: import("../planner/engine.js").MissionPlannerEngine;
  dueDiligence?: import("../due-diligence/engine.js").ContinuousDueDiligenceEngine;
  improvement?: import("../improvement/engine.js").AutonomousImprovementEngine;
  orchestrator?: import("../orchestrator/engine.js").EmpireAIOrchestrator;
  objective?: import("../objective/engine.js").ObjectiveEngine;
}
