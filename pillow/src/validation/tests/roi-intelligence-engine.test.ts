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
import {
  assembleRoiIntelligenceEngine,
  buildFallbackRoiIntelligenceEngine,
  ROI_PIPELINE,
  ROI_PRINCIPLES,
  GOVERNED_ROI_DOMAINS,
  ROI_ANALYSIS_DOMAINS,
} from "../../roi-intelligence-engine/index.js";

describe("E3-05 ROI Intelligence Engine", () => {
  test("buildFallbackRoiIntelligenceEngine returns constitutional ROI model", () => {
    const view = buildFallbackRoiIntelligenceEngine();
    assert.equal(view.engineVersion, "E3-05");
    assert.equal(view.roiPipeline.length, ROI_PIPELINE.length);
    assert.deepEqual(view.roiPrinciples, [...ROI_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_ROI_DOMAINS.length);
    assert.ok(view.roiAssessments.length >= 10);
    assert.ok(view.enterpriseRoi.length >= 10);
    assert.ok(view.businessRoi.length >= 5);
    assert.ok(view.roiAnalysis.length >= ROI_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE306, true);
  });

  test("assembleRoiIntelligenceEngine integrates E3-01 E3-02 E3-03 E3-04 E2-01", () => {
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
    const view = assembleRoiIntelligenceEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      executiveDecisionArchitecture,
      executiveRecommendationEngine,
      corporateVision,
      strategicObjectives,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E3-05" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E3-05");
    assert.ok(view.integrations.executiveFinanceFramework.includes("E3-01"));
    assert.ok(view.integrations.capitalAllocationEngine.includes("E3-02"));
    assert.ok(view.integrations.executiveBudgetPlanner.includes("E3-03"));
    assert.ok(view.integrations.investmentEvaluationEngine.includes("E3-04"));
    assert.ok(view.integrations.executiveDecisionArchitecture.includes("E2-01"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(
      view.roiAssessments.every(
        (r) => r.roiId && r.roiPercentage > 0 && r.evidence.length >= 1,
      ),
    );
    assert.equal(view.readyForE306, true);
  });
});
