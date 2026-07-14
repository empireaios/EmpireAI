import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { assembleExecutiveDecisionArchitecture } from "../../executive-decision-architecture/assembler.js";
import { assembleRiskAssessmentEngine } from "../../risk-assessment-engine/assembler.js";
import {
  assembleDecisionSimulationEngine,
  buildFallbackDecisionSimulationEngine,
  SIMULATION_PIPELINE,
  SIMULATION_PRINCIPLES,
  GOVERNED_SIMULATION_DOMAINS,
  SIMULATION_TYPES,
  COMPARATIVE_ANALYSIS_DIMENSIONS,
} from "../../decision-simulation-engine/index.js";

describe("E2-03 Decision Simulation Engine", () => {
  test("buildFallbackDecisionSimulationEngine returns constitutional simulation model", () => {
    const view = buildFallbackDecisionSimulationEngine();
    assert.equal(view.engineVersion, "E2-03");
    assert.equal(view.simulationPipeline.length, SIMULATION_PIPELINE.length);
    assert.deepEqual(view.simulationPrinciples, [...SIMULATION_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_SIMULATION_DOMAINS.length);
    assert.ok(view.availableSimulations.length >= 10);
    assert.ok(view.scenarioComparison.length >= 1);
    assert.ok(view.predictedOutcomes.length >= 1);
    assert.equal(view.comparativeAnalysis.length, COMPARATIVE_ANALYSIS_DIMENSIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.ok(view.recommendedOption.length > 0);
    assert.equal(view.readyForE204, true);
  });

  test("assembleDecisionSimulationEngine integrates E2-01 and E2-02", () => {
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

    const view = assembleDecisionSimulationEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      journey: { currentMission: "E2-03 Decision Simulation Engine" },
      supervisor: { status: "monitoring simulations" },
      ecc: { status: "simulation scheduling" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E2-03");
    assert.ok(view.integrations.executiveDecisionArchitecture.includes("E2-01"));
    assert.ok(view.integrations.riskAssessmentEngine.includes("E2-02"));
    assert.ok(view.pillowEvaluations.length >= 6);
    const scenarios = new Set(view.availableSimulations.map((s) => s.scenario));
    assert.ok(scenarios.size >= 3);
    assert.ok(SIMULATION_TYPES.some((t) => scenarios.has(t)));
  });
});
