import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { assembleExecutiveDecisionArchitecture } from "../../executive-decision-architecture/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { assembleExecutiveFinanceFramework } from "../../executive-finance-framework/assembler.js";
import { assembleCapitalAllocationEngine } from "../../capital-allocation-engine/assembler.js";
import { assembleExecutiveBudgetPlanner } from "../../executive-budget-planner/assembler.js";
import { assembleRiskAssessmentEngine } from "../../risk-assessment-engine/assembler.js";
import { assembleDecisionSimulationEngine } from "../../decision-simulation-engine/assembler.js";
import { assembleExecutiveRecommendationEngine } from "../../executive-recommendation-engine/assembler.js";
import { assembleTradeOffAnalysisEngine } from "../../trade-off-analysis-engine/assembler.js";
import { assembleInvestmentEvaluationEngine } from "../../investment-evaluation-engine/assembler.js";
import { assembleRoiIntelligenceEngine } from "../../roi-intelligence-engine/assembler.js";
import { assembleCashReserveIntelligence } from "../../cash-reserve-intelligence/assembler.js";
import {
  assembleProfitOptimizationEngine,
  buildFallbackProfitOptimizationEngine,
  PROFIT_OPTIMIZATION_PIPELINE,
  PROFIT_PRINCIPLES,
  GOVERNED_PROFIT_DOMAINS,
  OPTIMIZATION_CAPABILITIES,
} from "../../profit-optimization-engine/index.js";

describe("E3-07 Profit Optimization Engine", () => {
  test("buildFallbackProfitOptimizationEngine returns constitutional profit model", () => {
    const view = buildFallbackProfitOptimizationEngine();
    assert.equal(view.engineVersion, "E3-07");
    assert.equal(view.profitOptimizationPipeline.length, PROFIT_OPTIMIZATION_PIPELINE.length);
    assert.deepEqual(view.profitPrinciples, [...PROFIT_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_PROFIT_DOMAINS.length);
    assert.equal(view.optimizationCapabilities.length, OPTIMIZATION_CAPABILITIES.length);
    assert.ok(view.profitAssessments.length >= 10);
    assert.ok(view.enterpriseProfit.length >= 10);
    assert.ok(view.optimizationOpportunities.length >= 5);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE308, true);
  });

  test("assembleProfitOptimizationEngine integrates E3-01 through E3-06 E2-01", () => {
    const executiveArchitecture = assembleExecutiveArchitectureFramework({});
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture,
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const strategicObjectives = assembleStrategicObjectiveEngine({ corporateVision });
    const executiveRoadmap = assembleExecutiveRoadmapEngine({ corporateVision, strategicObjectives });
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const executiveDecisionArchitecture = assembleExecutiveDecisionArchitecture({
      executiveArchitecture,
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      executivePlanningCertification,
    });
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const riskAssessmentEngine = assembleRiskAssessmentEngine({
      executiveDecisionArchitecture,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });
    const decisionSimulationEngine = assembleDecisionSimulationEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });
    const executiveRecommendationEngine = assembleExecutiveRecommendationEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });
    const tradeOffAnalysisEngine = assembleTradeOffAnalysisEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });
    const executiveFinanceFramework = assembleExecutiveFinanceFramework({
      corporateVision,
      strategicObjectives,
      executiveDecisionArchitecture,
      executiveDecisionCertification,
      executivePlanningCertification,
      executiveRecommendationEngine,
    });
    const capitalAllocationEngine = assembleCapitalAllocationEngine({
      executiveFinanceFramework,
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      executiveRecommendationEngine,
      corporateVision,
      strategicObjectives,
    });
    const executiveBudgetPlanner = assembleExecutiveBudgetPlanner({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveDecisionArchitecture,
      executiveRecommendationEngine,
      corporateVision,
      strategicObjectives,
    });
    const investmentEvaluationEngine = assembleInvestmentEvaluationEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      tradeOffAnalysisEngine,
      executiveRecommendationEngine,
      corporateVision,
      strategicObjectives,
    });
    const roiIntelligenceEngine = assembleRoiIntelligenceEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      executiveDecisionArchitecture,
      executiveRecommendationEngine,
      corporateVision,
      strategicObjectives,
    });
    const cashReserveIntelligence = assembleCashReserveIntelligence({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      roiIntelligenceEngine,
      executiveDecisionArchitecture,
      executiveRecommendationEngine,
      corporateVision,
      strategicObjectives,
    });
    const view = assembleProfitOptimizationEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      roiIntelligenceEngine,
      cashReserveIntelligence,
      executiveDecisionArchitecture,
      executiveRecommendationEngine,
      corporateVision,
      strategicObjectives,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E3-07" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E3-07");
    assert.ok(view.integrations.executiveFinanceFramework.includes("E3-01"));
    assert.ok(view.integrations.capitalAllocationEngine.includes("E3-02"));
    assert.ok(view.integrations.executiveBudgetPlanner.includes("E3-03"));
    assert.ok(view.integrations.investmentEvaluationEngine.includes("E3-04"));
    assert.ok(view.integrations.roiIntelligenceEngine.includes("E3-05"));
    assert.ok(view.integrations.cashReserveIntelligence.includes("E3-06"));
    assert.ok(view.integrations.executiveDecisionArchitecture.includes("E2-01"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(
      view.profitAssessments.every(
        (p) => p.profitId && p.netProfit && p.evidence.length >= 1,
      ),
    );
    assert.equal(view.readyForE308, true);
  });
});
