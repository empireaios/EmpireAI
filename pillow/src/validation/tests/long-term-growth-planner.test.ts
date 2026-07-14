import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { assemblePriorityManagementEngine } from "../../priority-management-engine/assembler.js";
import { assembleExecutiveScenarioPlanner } from "../../executive-scenario-planner/assembler.js";
import {
  assembleLongTermGrowthPlanner,
  buildFallbackLongTermGrowthPlanner,
  GROWTH_HIERARCHY,
  GROWTH_PLANNING_PIPELINE,
  GROWTH_PRINCIPLES,
  GOVERNED_GROWTH_DOMAINS,
  PLANNING_HORIZONS,
  GROWTH_ANALYSIS_DOMAINS,
} from "../../long-term-growth-planner/index.js";

describe("E1-11 Long-Term Growth Planner", () => {
  test("buildFallbackLongTermGrowthPlanner returns constitutional growth model", () => {
    const view = buildFallbackLongTermGrowthPlanner();
    assert.equal(view.architectureVersion, "E1-11");
    assert.equal(view.growthHierarchy.length, GROWTH_HIERARCHY.length);
    assert.equal(view.growthPipeline.length, GROWTH_PLANNING_PIPELINE.length);
    assert.deepEqual(view.growthPrinciples, [...GROWTH_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_GROWTH_DOMAINS.length);
    assert.equal(view.planningHorizons.length, PLANNING_HORIZONS.length);
    assert.ok(view.growthInitiatives.length >= 6);
    assert.ok(view.growthRoadmap.length >= 1);
    assert.equal(view.growthAnalysis.length, GROWTH_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE112, true);
  });

  test("assembleLongTermGrowthPlanner consolidates E1-02 through E1-10", () => {
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
    const executiveScenarioPlanner = assembleExecutiveScenarioPlanner({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
    });

    const view = assembleLongTermGrowthPlanner({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      executiveScenarioPlanner,
      priorityManagement,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      journey: { currentMission: "E1-11 Long-Term Growth Planner" },
      supervisor: { eta: "5h", status: "supervising" },
      ecc: { status: "growth programme coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.architectureVersion, "E1-11");
    assert.equal(view.integrations.executiveScenarioPlanner, `E1-10 · ${executiveScenarioPlanner.plannerHealth}`);
    assert.ok(view.strategicOpportunities.length >= 1);
    assert.ok(view.growthRisks.length >= 1);
    assert.ok(view.investmentPipeline.length >= 1);
    assert.ok(view.pillowEvaluations.length >= 6);
  });
});
