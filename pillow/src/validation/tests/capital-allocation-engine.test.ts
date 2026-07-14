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
import { assembleRiskAssessmentEngine } from "../../risk-assessment-engine/assembler.js";
import { assembleDecisionSimulationEngine } from "../../decision-simulation-engine/assembler.js";
import { assembleExecutiveRecommendationEngine } from "../../executive-recommendation-engine/assembler.js";
import { assembleOpportunityPrioritizationEngine } from "../../opportunity-prioritization-engine/assembler.js";
import {
  assembleCapitalAllocationEngine,
  buildFallbackCapitalAllocationEngine,
  CAPITAL_PIPELINE,
  CAPITAL_PRINCIPLES,
  GOVERNED_CAPITAL_DOMAINS,
  CAPITAL_OPTIMIZATION_DOMAINS,
} from "../../capital-allocation-engine/index.js";

describe("E3-02 Capital Allocation Engine", () => {
  test("buildFallbackCapitalAllocationEngine returns constitutional capital model", () => {
    const view = buildFallbackCapitalAllocationEngine();
    assert.equal(view.engineVersion, "E3-02");
    assert.equal(view.capitalPipeline.length, CAPITAL_PIPELINE.length);
    assert.deepEqual(view.capitalPrinciples, [...CAPITAL_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_CAPITAL_DOMAINS.length);
    assert.ok(view.currentAllocations.length >= 10);
    assert.ok(view.capitalPortfolio.length >= 10);
    assert.ok(view.capitalOptimization.length >= CAPITAL_OPTIMIZATION_DOMAINS.length);
    assert.ok(view.investmentPerformance.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE303, true);
  });

  test("assembleCapitalAllocationEngine integrates E3-01 E2-01 E2-02 E2-04", () => {
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
    const opportunityPrioritization = assembleOpportunityPrioritizationEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      executivePlanningCertification,
    });
    const executiveFinanceFramework = assembleExecutiveFinanceFramework({
      corporateVision,
      strategicObjectives,
      executiveDecisionArchitecture,
      executiveDecisionCertification,
      executivePlanningCertification,
      executiveRecommendationEngine,
      opportunityPrioritization,
    });
    const view = assembleCapitalAllocationEngine({
      executiveFinanceFramework,
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      executiveRecommendationEngine,
      opportunityPrioritization,
      corporateVision,
      strategicObjectives,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E3-02" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E3-02");
    assert.ok(view.integrations.executiveFinanceFramework.includes("E3-01"));
    assert.ok(view.integrations.executiveDecisionArchitecture.includes("E2-01"));
    assert.ok(view.integrations.riskAssessmentEngine.includes("E2-02"));
    assert.ok(view.integrations.executiveRecommendationEngine.includes("E2-04"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.currentAllocations.every((a) => a.allocationId && a.allocatedCapital && a.evidence.length >= 1));
    assert.equal(view.readyForE303, true);
  });
});
