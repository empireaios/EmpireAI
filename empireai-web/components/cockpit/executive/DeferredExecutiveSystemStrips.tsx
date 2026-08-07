"use client";

import { useState } from "react";
import { LiveEtaCountdownStrip } from "@/components/cockpit/live-eta/LiveEtaDashboard";
import { ExplainabilityStrip } from "@/components/cockpit/explainability/ExplainabilityDashboard";
import { FactoryStrip } from "@/components/cockpit/factory/FactoryDashboard";
import { BusinessAutomationStrip } from "@/components/cockpit/automation/BusinessAutomationDashboard";
import { CommercialIntelligenceStrip } from "@/components/cockpit/intelligence/CommercialIntelligenceDashboard";
import { GrandKingStrip } from "@/components/cockpit/grand-king/GrandKingOperatingDashboard";
import { RepositoryEvolutionStrip } from "@/components/cockpit/repository-evolution/RepositoryEvolutionDashboard";
import { KnowledgeEvolutionStrip } from "@/components/cockpit/knowledge-evolution/KnowledgeEvolutionDashboard";
import { ArchitectureEvolutionStrip } from "@/components/cockpit/architecture-evolution/ArchitectureEvolutionDashboard";
import { AiEvolutionStrip } from "@/components/cockpit/ai-evolution/AiEvolutionDashboard";
import { EmpireEvolutionStrip } from "@/components/cockpit/empire-evolution/EmpireEvolutionDashboard";
import { ExecutiveArchitectureStrip } from "@/components/cockpit/executive-architecture/ExecutiveArchitectureDashboard";
import { ExecutivePlanningDashboardStrip } from "@/components/cockpit/executive-planning-dashboard/ExecutivePlanningDashboardPanel";
import { ExecutivePlanningCertificationStrip } from "@/components/cockpit/executive-planning-certification/ExecutivePlanningCertificationPanel";
import { ExecutiveDecisionArchitectureStrip } from "@/components/cockpit/executive-decision/ExecutiveDecisionArchitectureDashboard";
import { RiskAssessmentEngineStrip } from "@/components/cockpit/risk-assessment/RiskAssessmentEngineDashboard";
import { DecisionSimulationEngineStrip } from "@/components/cockpit/decision-simulation/DecisionSimulationEngineDashboard";
import { ExecutiveRecommendationEngineStrip } from "@/components/cockpit/executive-recommendation/ExecutiveRecommendationEngineDashboard";
import { ResourceAllocationEngineStrip } from "@/components/cockpit/resource-allocation/ResourceAllocationEngineDashboard";
import { ConflictResolutionEngineStrip } from "@/components/cockpit/conflict-resolution/ConflictResolutionEngineDashboard";
import { ExecutiveApprovalIntelligenceStrip } from "@/components/cockpit/executive-approval/ExecutiveApprovalIntelligenceDashboard";
import { CrisisDecisionEngineStrip } from "@/components/cockpit/crisis-decision/CrisisDecisionEngineDashboard";
import { ExecutiveEscalationEngineStrip } from "@/components/cockpit/executive-escalation/ExecutiveEscalationEngineDashboard";
import { TradeOffAnalysisEngineStrip } from "@/components/cockpit/trade-off-analysis/TradeOffAnalysisEngineDashboard";
import { ExecutiveConsensusEngineStrip } from "@/components/cockpit/executive-consensus/ExecutiveConsensusEngineDashboard";
import { ExecutivePolicyEngineStrip } from "@/components/cockpit/executive-policy/ExecutivePolicyEngineDashboard";
import { DecisionAuditEngineStrip } from "@/components/cockpit/decision-audit/DecisionAuditEngineDashboard";
import { ExecutiveConfidenceEngineStrip } from "@/components/cockpit/executive-confidence/ExecutiveConfidenceEngineDashboard";
import { AutonomousDecisionMonitorStrip } from "@/components/cockpit/autonomous-decision-monitor/AutonomousDecisionMonitorDashboard";
import { ExecutiveDecisionCertificationStrip } from "@/components/cockpit/executive-decision-certification/ExecutiveDecisionCertificationPanel";
import { ExecutiveFinanceFrameworkStrip } from "@/components/cockpit/executive-finance/ExecutiveFinanceFrameworkDashboard";
import { CapitalAllocationEngineStrip } from "@/components/cockpit/capital-allocation/CapitalAllocationEngineDashboard";
import { ExecutiveBudgetPlannerStrip } from "@/components/cockpit/executive-budget/ExecutiveBudgetPlannerDashboard";
import { InvestmentEvaluationEngineStrip } from "@/components/cockpit/investment-evaluation/InvestmentEvaluationEngineDashboard";
import { RoiIntelligenceEngineStrip } from "@/components/cockpit/roi-intelligence/RoiIntelligenceEngineDashboard";
import { CashReserveIntelligenceStrip } from "@/components/cockpit/cash-reserve/CashReserveIntelligenceDashboard";
import { ProfitOptimizationEngineStrip } from "@/components/cockpit/profit-optimization/ProfitOptimizationEngineDashboard";
import { CostOptimizationEngineStrip } from "@/components/cockpit/cost-optimization/CostOptimizationEngineDashboard";
import { FinancialScenarioEngineStrip } from "@/components/cockpit/financial-scenario/FinancialScenarioEngineDashboard";
import { ExecutiveKpiEngineStrip } from "@/components/cockpit/executive-kpi/ExecutiveKpiEngineDashboard";
import { CapitalRiskEngineStrip } from "@/components/cockpit/capital-risk/CapitalRiskEngineDashboard";
import { ExecutiveForecastIntelligenceStrip } from "@/components/cockpit/executive-forecast/ExecutiveForecastIntelligenceDashboard";
import { ExecutivePerformanceDashboardStrip } from "@/components/cockpit/executive-performance/ExecutivePerformanceDashboardPanel";
import { EnterpriseValuationEngineStrip } from "@/components/cockpit/enterprise-valuation/EnterpriseValuationEngineDashboard";
import { ExecutiveCapitalStrategyStrip } from "@/components/cockpit/executive-capital-strategy/ExecutiveCapitalStrategyDashboard";
import { FinancialExecutiveCertificationStrip } from "@/components/cockpit/financial-executive-certification/FinancialExecutiveCertificationPanel";
import { MarketIntelligenceEngineStrip } from "@/components/cockpit/market-intelligence-engine/MarketIntelligenceEngineDashboard";
import { CompetitorIntelligenceEngineStrip } from "@/components/cockpit/competitor-intelligence-engine/CompetitorIntelligenceEngineDashboard";
import { OpportunityDiscoveryEngineStrip } from "@/components/cockpit/opportunity-discovery-engine/OpportunityDiscoveryEngineDashboard";
import { ThreatDetectionEngineStrip } from "@/components/cockpit/threat-detection-engine/ThreatDetectionEngineDashboard";
import { IndustryIntelligenceEngineStrip } from "@/components/cockpit/industry-intelligence-engine/IndustryIntelligenceEngineDashboard";
import { CustomerBehaviourIntelligenceStrip } from "@/components/cockpit/customer-behaviour-intelligence/CustomerBehaviourIntelligenceDashboard";
import { InnovationIntelligenceEngineStrip } from "@/components/cockpit/innovation-intelligence-engine/InnovationIntelligenceEngineDashboard";
import { ExecutiveKnowledgeGraphStrip } from "@/components/cockpit/executive-knowledge-graph/ExecutiveKnowledgeGraphDashboard";
import { ExecutivePredictionEngineStrip } from "@/components/cockpit/executive-prediction-engine/ExecutivePredictionEngineDashboard";
import { ExecutiveInsightEngineStrip } from "@/components/cockpit/executive-insight-engine/ExecutiveInsightEngineDashboard";
import { EnterprisePatternEngineStrip } from "@/components/cockpit/enterprise-pattern-engine/EnterprisePatternEngineDashboard";
import { ExecutiveBenchmarkEngineStrip } from "@/components/cockpit/executive-benchmark-engine/ExecutiveBenchmarkEngineDashboard";
import { CrossBusinessIntelligenceStrip } from "@/components/cockpit/cross-business-intelligence/CrossBusinessIntelligenceDashboard";
import { ExecutiveAdvisoryEngineStrip } from "@/components/cockpit/executive-advisory-engine/ExecutiveAdvisoryEngineDashboard";
import { ExecutiveIntelligenceCertificationStrip } from "@/components/cockpit/executive-intelligence-certification/ExecutiveIntelligenceCertificationPanel";
import { EnterpriseGovernanceFrameworkStrip } from "@/components/cockpit/enterprise-governance-framework/EnterpriseGovernanceFrameworkDashboard";
import { ExecutiveConstitutionalMonitorStrip } from "@/components/cockpit/executive-constitutional-monitor/ExecutiveConstitutionalMonitorDashboard";
import { EnterpriseAuditEngineStrip } from "@/components/cockpit/enterprise-audit-engine/EnterpriseAuditEngineDashboard";
import { ExecutiveComplianceEngineStrip } from "@/components/cockpit/executive-compliance-engine/ExecutiveComplianceEngineDashboard";
import { ExecutiveEthicsEngineStrip } from "@/components/cockpit/executive-ethics-engine/ExecutiveEthicsEngineDashboard";
import { ExecutiveAccountabilityEngineStrip } from "@/components/cockpit/executive-accountability-engine/ExecutiveAccountabilityEngineDashboard";
import { ExecutiveTransparencyEngineStrip } from "@/components/cockpit/executive-transparency-engine/ExecutiveTransparencyEngineDashboard";
import { ExecutiveExceptionManagerStrip } from "@/components/cockpit/executive-exception-manager/ExecutiveExceptionManagerDashboard";
import { EnterpriseRiskGovernanceStrip } from "@/components/cockpit/enterprise-risk-governance/EnterpriseRiskGovernanceDashboard";
import { ExecutiveReviewBoardStrip } from "@/components/cockpit/executive-review-board/ExecutiveReviewBoardDashboard";
import { ExecutivePolicyEvolutionStrip } from "@/components/cockpit/executive-policy-evolution/ExecutivePolicyEvolutionDashboard";
import { ExecutiveTrustEngineStrip } from "@/components/cockpit/executive-trust-engine/ExecutiveTrustEngineDashboard";
import { EnterpriseConstitutionalGuardianStrip } from "@/components/cockpit/enterprise-constitutional-guardian/EnterpriseConstitutionalGuardianDashboard";
import { ExecutiveResilienceEngineStrip } from "@/components/cockpit/executive-resilience-engine/ExecutiveResilienceEngineDashboard";
import { GrandKingExecutiveCockpitStrip } from "@/components/cockpit/grand-king-executive-cockpit/GrandKingExecutiveCockpitDashboard";
import { ExecutiveGovernanceCertificationStrip } from "@/components/cockpit/executive-governance-certification/ExecutiveGovernanceCertificationPanel";
import { CorporateVisionStrip } from "@/components/cockpit/corporate-vision/CorporateVisionDashboard";
import { StrategicObjectiveStrip } from "@/components/cockpit/strategic-objective/StrategicObjectiveDashboard";
import { ExecutiveRoadmapStrip } from "@/components/cockpit/executive-roadmap/ExecutiveRoadmapDashboard";
import { PriorityManagementStrip } from "@/components/cockpit/priority-management/PriorityManagementDashboard";
import { InitiativePortfolioStrip } from "@/components/cockpit/initiative-portfolio/InitiativePortfolioDashboard";
import { DepartmentPlanningStrip } from "@/components/cockpit/department-planning/DepartmentPlanningDashboard";
import { ExecutiveCalendarStrip } from "@/components/cockpit/executive-calendar/ExecutiveCalendarDashboard";
import { ExecutiveDependencyStrip } from "@/components/cockpit/executive-dependency/ExecutiveDependencyDashboard";
import { ExecutiveScenarioStrip } from "@/components/cockpit/executive-scenario/ExecutiveScenarioDashboard";
import { LongTermGrowthStrip } from "@/components/cockpit/long-term-growth/LongTermGrowthDashboard";
import { OpportunityPrioritizationStrip } from "@/components/cockpit/opportunity-prioritization/OpportunityPrioritizationDashboard";
import { StrategicAlignmentStrip } from "@/components/cockpit/strategic-alignment/StrategicAlignmentDashboard";

/**
 * Certification / extended engine strips. Mounted only on demand.
 * Root-cause fix: mounting ~70 strips with 5s polling on every Executive Home
 * load saturates production Brain event loop → Railway 502.
 * Panels remain available via cockpit navigation and this deferred section.
 */
export function DeferredExecutiveSystemStrips() {
  const [mounted, setMounted] = useState(false);

  if (!mounted) {
    return (
      <section className="rounded-xl border border-gold/15 bg-black/20 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#e8e0d0]">Extended system panels</p>
            <p className="mt-0.5 text-xs text-[#8a847a]">
              Certification and specialist engines stay off the default dashboard so Executive Home
              stays responsive. Open only when you need them.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMounted(true)}
            className="shrink-0 rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-medium text-[#d4af37] hover:bg-gold/20"
          >
            Load extended panels
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-amber-200/80">
        Extended panels loaded — each may refresh independently. Close and reopen Executive Home to
        unload them if the dashboard feels heavy.
      </p>
      <LiveEtaCountdownStrip />
      <ExplainabilityStrip />
      <FactoryStrip />
      <BusinessAutomationStrip />
      <CommercialIntelligenceStrip />
      <GrandKingStrip />
      <RepositoryEvolutionStrip />
      <KnowledgeEvolutionStrip />
      <ArchitectureEvolutionStrip />
      <AiEvolutionStrip />
      <EmpireEvolutionStrip />
      <ExecutiveArchitectureStrip />
      <ExecutivePlanningDashboardStrip />
      <ExecutivePlanningCertificationStrip />
      <ExecutiveDecisionArchitectureStrip />
      <RiskAssessmentEngineStrip />
      <DecisionSimulationEngineStrip />
      <ExecutiveRecommendationEngineStrip />
      <ResourceAllocationEngineStrip />
      <ConflictResolutionEngineStrip />
      <ExecutiveApprovalIntelligenceStrip />
      <CrisisDecisionEngineStrip />
      <ExecutiveEscalationEngineStrip />
      <TradeOffAnalysisEngineStrip />
      <ExecutiveConsensusEngineStrip />
      <ExecutivePolicyEngineStrip />
      <DecisionAuditEngineStrip />
      <ExecutiveConfidenceEngineStrip />
      <AutonomousDecisionMonitorStrip />
      <ExecutiveDecisionCertificationStrip />
      <ExecutiveFinanceFrameworkStrip />
      <CapitalAllocationEngineStrip />
      <ExecutiveBudgetPlannerStrip />
      <InvestmentEvaluationEngineStrip />
      <RoiIntelligenceEngineStrip />
      <CashReserveIntelligenceStrip />
      <ProfitOptimizationEngineStrip />
      <CostOptimizationEngineStrip />
      <FinancialScenarioEngineStrip />
      <ExecutiveKpiEngineStrip />
      <CapitalRiskEngineStrip />
      <ExecutiveForecastIntelligenceStrip />
      <ExecutivePerformanceDashboardStrip />
      <EnterpriseValuationEngineStrip />
      <ExecutiveCapitalStrategyStrip />
      <FinancialExecutiveCertificationStrip />
      <MarketIntelligenceEngineStrip />
      <CompetitorIntelligenceEngineStrip />
      <OpportunityDiscoveryEngineStrip />
      <ThreatDetectionEngineStrip />
      <IndustryIntelligenceEngineStrip />
      <CustomerBehaviourIntelligenceStrip />
      <InnovationIntelligenceEngineStrip />
      <ExecutiveKnowledgeGraphStrip />
      <ExecutivePredictionEngineStrip />
      <ExecutiveInsightEngineStrip />
      <EnterprisePatternEngineStrip />
      <ExecutiveBenchmarkEngineStrip />
      <CrossBusinessIntelligenceStrip />
      <ExecutiveAdvisoryEngineStrip />
      <ExecutiveIntelligenceCertificationStrip />
      <EnterpriseGovernanceFrameworkStrip />
      <ExecutiveConstitutionalMonitorStrip />
      <EnterpriseAuditEngineStrip />
      <ExecutiveComplianceEngineStrip />
      <ExecutiveEthicsEngineStrip />
      <ExecutiveAccountabilityEngineStrip />
      <ExecutiveTransparencyEngineStrip />
      <ExecutiveExceptionManagerStrip />
      <EnterpriseRiskGovernanceStrip />
      <ExecutiveReviewBoardStrip />
      <ExecutivePolicyEvolutionStrip />
      <ExecutiveTrustEngineStrip />
      <EnterpriseConstitutionalGuardianStrip />
      <ExecutiveResilienceEngineStrip />
      <GrandKingExecutiveCockpitStrip />
      <ExecutiveGovernanceCertificationStrip />
      <CorporateVisionStrip />
      <StrategicObjectiveStrip />
      <ExecutiveRoadmapStrip />
      <PriorityManagementStrip />
      <InitiativePortfolioStrip />
      <DepartmentPlanningStrip />
      <ExecutiveCalendarStrip />
      <ExecutiveDependencyStrip />
      <ExecutiveScenarioStrip />
      <LongTermGrowthStrip />
      <OpportunityPrioritizationStrip />
      <StrategicAlignmentStrip />
    </div>
  );
}
