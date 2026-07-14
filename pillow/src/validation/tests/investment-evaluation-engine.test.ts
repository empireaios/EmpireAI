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
import {
  assembleInvestmentEvaluationEngine,
  buildFallbackInvestmentEvaluationEngine,
  INVESTMENT_EVALUATION_PIPELINE,
  INVESTMENT_PRINCIPLES,
  GOVERNED_INVESTMENT_DOMAINS,
  INVESTMENT_ANALYSIS_DOMAINS,
} from "../../investment-evaluation-engine/index.js";

describe("E3-04 Investment Evaluation Engine", () => {
  test("buildFallbackInvestmentEvaluationEngine returns constitutional investment model", () => {
    const view = buildFallbackInvestmentEvaluationEngine();
    assert.equal(view.engineVersion, "E3-04");
    assert.equal(view.investmentPipeline.length, INVESTMENT_EVALUATION_PIPELINE.length);
    assert.deepEqual(view.investmentPrinciples, [...INVESTMENT_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_INVESTMENT_DOMAINS.length);
    assert.ok(view.enterpriseInvestments.length >= 10);
    assert.ok(view.investmentPortfolio.length >= 10);
    assert.ok(view.investmentAnalysis.length >= INVESTMENT_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE305, true);
  });

  test("assembleInvestmentEvaluationEngine integrates E3-01 E3-02 E3-03 E2-02 E2-10", () => {
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
    const view = assembleInvestmentEvaluationEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      tradeOffAnalysisEngine,
      executiveRecommendationEngine,
      corporateVision,
      strategicObjectives,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E3-04" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E3-04");
    assert.ok(view.integrations.executiveFinanceFramework.includes("E3-01"));
    assert.ok(view.integrations.capitalAllocationEngine.includes("E3-02"));
    assert.ok(view.integrations.executiveBudgetPlanner.includes("E3-03"));
    assert.ok(view.integrations.riskAssessmentEngine.includes("E2-02"));
    assert.ok(view.integrations.tradeOffAnalysisEngine.includes("E2-10"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(
      view.enterpriseInvestments.every(
        (i) => i.investmentId && i.requiredCapital && i.evidence.length >= 1,
      ),
    );
    assert.equal(view.readyForE305, true);
  });
});
