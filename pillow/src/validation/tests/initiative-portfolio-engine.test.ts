import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { assemblePriorityManagementEngine } from "../../priority-management-engine/assembler.js";
import {
  assembleInitiativePortfolioEngine,
  buildFallbackInitiativePortfolioEngine,
  PORTFOLIO_HIERARCHY,
  INITIATIVE_LIFECYCLE,
  PORTFOLIO_PRINCIPLES,
  GOVERNED_PORTFOLIO_DOMAINS,
  PORTFOLIO_ANALYSIS_DOMAINS,
} from "../../initiative-portfolio-engine/index.js";

describe("E1-06 Initiative Portfolio Engine", () => {
  test("buildFallbackInitiativePortfolioEngine returns constitutional portfolio model", () => {
    const view = buildFallbackInitiativePortfolioEngine();
    assert.equal(view.architectureVersion, "E1-06");
    assert.equal(view.portfolioHierarchy.length, PORTFOLIO_HIERARCHY.length);
    assert.equal(view.initiativeLifecycle.length, INITIATIVE_LIFECYCLE.length);
    assert.deepEqual(view.portfolioPrinciples, [...PORTFOLIO_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_PORTFOLIO_DOMAINS.length);
    assert.equal(view.portfolioAnalysis.length, PORTFOLIO_ANALYSIS_DOMAINS.length);
    assert.ok(view.activeInitiatives.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE107, true);
  });

  test("assembleInitiativePortfolioEngine consolidates E1-02 through E1-05", () => {
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

    const view = assembleInitiativePortfolioEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      journey: { currentMission: "E1-06 Initiative Portfolio Engine" },
      supervisor: { eta: "2h", status: "supervising" },
    });

    assert.equal(view.architectureVersion, "E1-06");
    assert.equal(view.integrations.priorityManagementEngine, `E1-05 · ${priorityManagement.priorityHealth}`);
    assert.ok(view.activeInitiatives.some((i) => i.title.includes("E1-06")));
    assert.ok(view.portfolioSegments.length >= 7);
    assert.ok(view.pillowEvaluations.length >= 6);
  });
});
