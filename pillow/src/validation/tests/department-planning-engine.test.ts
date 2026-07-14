import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { assemblePriorityManagementEngine } from "../../priority-management-engine/assembler.js";
import { assembleInitiativePortfolioEngine } from "../../initiative-portfolio-engine/assembler.js";
import {
  assembleDepartmentPlanningEngine,
  buildFallbackDepartmentPlanningEngine,
  DEPARTMENT_HIERARCHY,
  DEPARTMENT_LIFECYCLE,
  PLANNING_PRINCIPLES,
  GOVERNED_DEPARTMENTS,
  CROSS_DEPARTMENT_DOMAINS,
} from "../../department-planning-engine/index.js";

describe("E1-07 Department Planning Engine", () => {
  test("buildFallbackDepartmentPlanningEngine returns constitutional department model", () => {
    const view = buildFallbackDepartmentPlanningEngine();
    assert.equal(view.architectureVersion, "E1-07");
    assert.equal(view.departmentHierarchy.length, DEPARTMENT_HIERARCHY.length);
    assert.equal(view.departmentLifecycle.length, DEPARTMENT_LIFECYCLE.length);
    assert.deepEqual(view.planningPrinciples, [...PLANNING_PRINCIPLES]);
    assert.equal(view.governedDepartments.length, GOVERNED_DEPARTMENTS.length);
    assert.equal(view.departments.length, GOVERNED_DEPARTMENTS.length);
    assert.equal(view.crossDepartmentCoordination.length, CROSS_DEPARTMENT_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE108, true);
  });

  test("assembleDepartmentPlanningEngine consolidates E1-02 through E1-06", () => {
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

    const view = assembleDepartmentPlanningEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      initiativePortfolio,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      journey: { currentMission: "E1-07 Department Planning Engine" },
      supervisor: { eta: "3h", status: "supervising" },
    });

    assert.equal(view.architectureVersion, "E1-07");
    assert.equal(view.integrations.initiativePortfolioEngine, `E1-06 · ${initiativePortfolio.portfolioHealth}`);
    assert.ok(view.departments.some((d) => d.departmentName === "Governance"));
    assert.ok(view.departments.every((d) => d.assignedInitiatives.length >= 1));
    assert.ok(view.pillowEvaluations.length >= 6);
  });
});
