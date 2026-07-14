import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { assembleExecutiveDecisionArchitecture } from "../../executive-decision-architecture/assembler.js";
import { assembleRiskAssessmentEngine } from "../../risk-assessment-engine/assembler.js";
import { assembleDecisionSimulationEngine } from "../../decision-simulation-engine/assembler.js";
import {
  assembleExecutiveRecommendationEngine,
  buildFallbackExecutiveRecommendationEngine,
  RECOMMENDATION_PIPELINE,
  RECOMMENDATION_PRINCIPLES,
  GOVERNED_RECOMMENDATION_DOMAINS,
  RECOMMENDATION_QUALITY_DIMENSIONS,
  EXPLAINABILITY_FIELDS,
} from "../../executive-recommendation-engine/index.js";

describe("E2-04 Executive Recommendation Engine", () => {
  test("buildFallbackExecutiveRecommendationEngine returns constitutional recommendation model", () => {
    const view = buildFallbackExecutiveRecommendationEngine();
    assert.equal(view.engineVersion, "E2-04");
    assert.equal(view.recommendationPipeline.length, RECOMMENDATION_PIPELINE.length);
    assert.deepEqual(view.recommendationPrinciples, [...RECOMMENDATION_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_RECOMMENDATION_DOMAINS.length);
    assert.ok(view.currentRecommendations.length >= 8);
    assert.ok(view.priorityQueue.length >= 1);
    assert.ok(view.explainability.length >= 1);
    assert.equal(view.qualityMetrics.length, RECOMMENDATION_QUALITY_DIMENSIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE205, true);
    assert.equal(EXPLAINABILITY_FIELDS.length, 9);
  });

  test("assembleExecutiveRecommendationEngine integrates E2-01 E2-02 E2-03", () => {
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

    const view = assembleExecutiveRecommendationEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      journey: { currentMission: "E2-04 Executive Recommendation Engine" },
      supervisor: { status: "monitoring recommendations" },
      ecc: { status: "recommendation execution" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E2-04");
    assert.ok(view.integrations.executiveDecisionArchitecture.includes("E2-01"));
    assert.ok(view.integrations.riskAssessmentEngine.includes("E2-02"));
    assert.ok(view.integrations.decisionSimulationEngine.includes("E2-03"));
    assert.ok(view.pillowGenerations.length >= 6);
    assert.ok(view.explainability.every((e) => e.why.length > 0 && e.what.length > 0));
  });
});
