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
import { assembleResourceAllocationEngine } from "../../resource-allocation-engine/assembler.js";
import {
  assembleConflictResolutionEngine,
  buildFallbackConflictResolutionEngine,
  CONFLICT_PIPELINE,
  CONFLICT_PRINCIPLES,
  GOVERNED_CONFLICT_DOMAINS,
  CONFLICT_ANALYSIS_DIMENSIONS,
  RESOLUTION_STRATEGIES,
} from "../../conflict-resolution-engine/index.js";

describe("E2-06 Conflict Resolution Engine", () => {
  test("buildFallbackConflictResolutionEngine returns constitutional conflict model", () => {
    const view = buildFallbackConflictResolutionEngine();
    assert.equal(view.engineVersion, "E2-06");
    assert.equal(view.conflictPipeline.length, CONFLICT_PIPELINE.length);
    assert.deepEqual(view.conflictPrinciples, [...CONFLICT_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_CONFLICT_DOMAINS.length);
    assert.ok(view.activeConflicts.length >= 8);
    assert.equal(view.conflictAnalysis.length, CONFLICT_ANALYSIS_DIMENSIONS.length);
    assert.ok(view.resolutionStatus.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE207, true);
    assert.ok(RESOLUTION_STRATEGIES.length >= 10);
  });

  test("assembleConflictResolutionEngine integrates E2-01 through E2-05", () => {
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
    const resourceAllocationEngine = assembleResourceAllocationEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });

    const view = assembleConflictResolutionEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      resourceAllocationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      journey: { currentMission: "E2-06 Conflict Resolution Engine" },
      supervisor: { status: "monitoring conflicts" },
      ecc: { status: "conflict resolution coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E2-06");
    assert.ok(view.integrations.resourceAllocationEngine.includes("E2-05"));
    assert.ok(view.integrations.executiveRecommendationEngine.includes("E2-04"));
    assert.ok(view.pillowEvaluations.length >= 6);
    assert.ok(view.activeConflicts.every((c) => c.recommendedResolution.length > 0));
  });
});
