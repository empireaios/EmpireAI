import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { assemblePriorityManagementEngine } from "../../priority-management-engine/assembler.js";
import { assembleInitiativePortfolioEngine } from "../../initiative-portfolio-engine/assembler.js";
import { assembleDepartmentPlanningEngine } from "../../department-planning-engine/assembler.js";
import { assembleExecutiveCalendarEngine } from "../../executive-calendar-engine/assembler.js";
import { assembleExecutiveDependencyEngine } from "../../executive-dependency-engine/assembler.js";
import {
  assembleExecutiveScenarioPlanner,
  buildFallbackExecutiveScenarioPlanner,
  SCENARIO_PIPELINE,
  SCENARIO_PRINCIPLES,
  GOVERNED_SCENARIO_DOMAINS,
  TRADE_OFF_DOMAINS,
} from "../../executive-scenario-planner/index.js";

describe("E1-10 Executive Scenario Planner", () => {
  test("buildFallbackExecutiveScenarioPlanner returns constitutional scenario model", () => {
    const view = buildFallbackExecutiveScenarioPlanner();
    assert.equal(view.architectureVersion, "E1-10");
    assert.equal(view.scenarioPipeline.length, SCENARIO_PIPELINE.length);
    assert.deepEqual(view.scenarioPrinciples, [...SCENARIO_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_SCENARIO_DOMAINS.length);
    assert.ok(view.availableScenarios.length >= 8);
    assert.ok(view.recommendedScenario);
    assert.ok(view.simulationOutputs.length >= 6);
    assert.equal(view.tradeOffAnalysis.length, TRADE_OFF_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE111, true);
  });

  test("assembleExecutiveScenarioPlanner consolidates E1-02 through E1-09", () => {
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const strategicObjectives = assembleStrategicObjectiveEngine({ corporateVision });
    const executiveRoadmap = assembleExecutiveRoadmapEngine({ corporateVision, strategicObjectives });
    const priorityManagement = assemblePriorityManagementEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
    });
    const initiativePortfolio = assembleInitiativePortfolioEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
    });
    const departmentPlanning = assembleDepartmentPlanningEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      initiativePortfolio,
    });
    const executiveCalendar = assembleExecutiveCalendarEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      initiativePortfolio,
      departmentPlanning,
    });
    const executiveDependency = assembleExecutiveDependencyEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      initiativePortfolio,
      departmentPlanning,
      executiveCalendar,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
    });

    const view = assembleExecutiveScenarioPlanner({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      initiativePortfolio,
      departmentPlanning,
      executiveCalendar,
      executiveDependency,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      journey: { currentMission: "E1-10 Executive Scenario Planner" },
      supervisor: { eta: "5h", status: "supervising" },
      ecc: { status: "scenario preparation" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.architectureVersion, "E1-10");
    assert.equal(view.integrations.executiveDependencyEngine, `E1-09 · ${executiveDependency.dependencyHealth}`);
    assert.ok(view.scenarioComparison.length >= 1);
    assert.ok(view.alternativeOptions.length >= 1);
    assert.ok(view.pillowEvaluations.length >= 6);
    assert.ok(view.recommendedScenario?.recommended);
  });
});
