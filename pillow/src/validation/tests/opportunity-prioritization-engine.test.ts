import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { assemblePriorityManagementEngine } from "../../priority-management-engine/assembler.js";
import { assembleExecutiveScenarioPlanner } from "../../executive-scenario-planner/assembler.js";
import { assembleLongTermGrowthPlanner } from "../../long-term-growth-planner/assembler.js";
import {
  assembleOpportunityPrioritizationEngine,
  buildFallbackOpportunityPrioritizationEngine,
  OPPORTUNITY_PIPELINE,
  OPPORTUNITY_PRINCIPLES,
  GOVERNED_OPPORTUNITY_DOMAINS,
  PRIORITIZATION_MODEL_DOMAINS,
} from "../../opportunity-prioritization-engine/index.js";

describe("E1-12 Opportunity Prioritization Engine", () => {
  test("buildFallbackOpportunityPrioritizationEngine returns constitutional opportunity model", () => {
    const view = buildFallbackOpportunityPrioritizationEngine();
    assert.equal(view.architectureVersion, "E1-12");
    assert.equal(view.opportunityPipeline.length, OPPORTUNITY_PIPELINE.length);
    assert.deepEqual(view.opportunityPrinciples, [...OPPORTUNITY_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_OPPORTUNITY_DOMAINS.length);
    assert.ok(view.allOpportunities.length >= 8);
    assert.ok(view.highestPriorityOpportunities.length >= 1);
    assert.equal(view.prioritizationModel.length, PRIORITIZATION_MODEL_DOMAINS.length);
    assert.ok(view.opportunityQueue.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE113, true);
  });

  test("assembleOpportunityPrioritizationEngine consolidates E1-02 through E1-11", () => {
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
    const longTermGrowthPlanner = assembleLongTermGrowthPlanner({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      executiveScenarioPlanner,
      priorityManagement,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
    });

    const view = assembleOpportunityPrioritizationEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      longTermGrowthPlanner,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      journey: { currentMission: "E1-12 Opportunity Prioritization Engine" },
      supervisor: { eta: "5h", status: "monitoring queue" },
      ecc: { status: "opportunity execution" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.architectureVersion, "E1-12");
    assert.equal(view.integrations.longTermGrowthPlanner, `E1-11 · ${longTermGrowthPlanner.plannerHealth}`);
    assert.ok(view.allOpportunities[0]!.priorityScore >= view.allOpportunities[1]!.priorityScore);
    assert.ok(view.pillowEvaluations.length >= 6);
    assert.ok(view.topOpportunityScore >= 70);
  });
});
