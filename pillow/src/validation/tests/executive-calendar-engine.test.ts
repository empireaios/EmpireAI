import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { assemblePriorityManagementEngine } from "../../priority-management-engine/assembler.js";
import { assembleInitiativePortfolioEngine } from "../../initiative-portfolio-engine/assembler.js";
import { assembleDepartmentPlanningEngine } from "../../department-planning-engine/assembler.js";
import {
  assembleExecutiveCalendarEngine,
  buildFallbackExecutiveCalendarEngine,
  CALENDAR_HIERARCHY,
  CALENDAR_LIFECYCLE,
  CALENDAR_PRINCIPLES,
  GOVERNED_CALENDAR_DOMAINS,
  EXECUTIVE_CADENCE,
} from "../../executive-calendar-engine/index.js";

describe("E1-08 Executive Calendar Engine", () => {
  test("buildFallbackExecutiveCalendarEngine returns constitutional calendar model", () => {
    const view = buildFallbackExecutiveCalendarEngine();
    assert.equal(view.architectureVersion, "E1-08");
    assert.equal(view.calendarHierarchy.length, CALENDAR_HIERARCHY.length);
    assert.equal(view.calendarLifecycle.length, CALENDAR_LIFECYCLE.length);
    assert.deepEqual(view.calendarPrinciples, [...CALENDAR_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_CALENDAR_DOMAINS.length);
    assert.equal(view.executiveCadence.length, EXECUTIVE_CADENCE.length);
    assert.ok(view.todaysAgenda.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE109, true);
  });

  test("assembleExecutiveCalendarEngine consolidates E1-02 through E1-07", () => {
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

    const view = assembleExecutiveCalendarEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      initiativePortfolio,
      departmentPlanning,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      journey: { currentMission: "E1-08 Executive Calendar Engine" },
      supervisor: { eta: "4h", status: "supervising" },
    });

    assert.equal(view.architectureVersion, "E1-08");
    assert.equal(view.integrations.departmentPlanningEngine, `E1-07 · ${departmentPlanning.planningHealth}`);
    assert.ok(view.todaysAgenda.some((e) => e.title.includes("E1-08") || e.title.includes("Daily Executive")));
    assert.ok(view.programmeMilestones.length >= 1);
    assert.ok(view.pillowEvaluations.length >= 6);
  });
});
