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
import { assembleExecutiveRecommendationEngine } from "../../executive-recommendation-engine/assembler.js";
import {
  assembleResourceAllocationEngine,
  buildFallbackResourceAllocationEngine,
  RESOURCE_PIPELINE,
  RESOURCE_PRINCIPLES,
  GOVERNED_RESOURCE_DOMAINS,
  ALLOCATION_OPTIMIZATION_DIMENSIONS,
  RESOURCE_BALANCING_METRICS,
} from "../../resource-allocation-engine/index.js";

describe("E2-05 Resource Allocation Engine", () => {
  test("buildFallbackResourceAllocationEngine returns constitutional allocation model", () => {
    const view = buildFallbackResourceAllocationEngine();
    assert.equal(view.engineVersion, "E2-05");
    assert.equal(view.resourcePipeline.length, RESOURCE_PIPELINE.length);
    assert.deepEqual(view.resourcePrinciples, [...RESOURCE_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_RESOURCE_DOMAINS.length);
    assert.ok(view.currentAllocations.length >= 8);
    assert.ok(view.capacityMetrics.length >= 1);
    assert.equal(view.allocationOptimization.length, ALLOCATION_OPTIMIZATION_DIMENSIONS.length);
    assert.equal(view.resourceBalancing.length, RESOURCE_BALANCING_METRICS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE206, true);
  });

  test("assembleResourceAllocationEngine integrates E2-01 through E2-04", () => {
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
    const executiveRecommendationEngine = assembleExecutiveRecommendationEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });

    const view = assembleResourceAllocationEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      journey: { currentMission: "E2-05 Resource Allocation Engine" },
      supervisor: { status: "monitoring resources" },
      ecc: { status: "resource scheduling" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E2-05");
    assert.ok(view.integrations.executiveDecisionArchitecture.includes("E2-01"));
    assert.ok(view.integrations.executiveRecommendationEngine.includes("E2-04"));
    assert.ok(view.pillowEvaluations.length >= 6);
    assert.ok(view.currentAllocations.every((a) => a.utilization >= 0 && a.utilization <= 100));
  });
});
