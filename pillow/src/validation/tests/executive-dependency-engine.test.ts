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
import {
  assembleExecutiveDependencyEngine,
  buildFallbackExecutiveDependencyEngine,
  DEPENDENCY_HIERARCHY,
  DEPENDENCY_LIFECYCLE,
  DEPENDENCY_PRINCIPLES,
  GOVERNED_DEPENDENCY_DOMAINS,
  DEPENDENCY_ANALYSIS_DOMAINS,
} from "../../executive-dependency-engine/index.js";

describe("E1-09 Executive Dependency Engine", () => {
  test("buildFallbackExecutiveDependencyEngine returns constitutional dependency model", () => {
    const view = buildFallbackExecutiveDependencyEngine();
    assert.equal(view.architectureVersion, "E1-09");
    assert.equal(view.dependencyHierarchy.length, DEPENDENCY_HIERARCHY.length);
    assert.equal(view.dependencyLifecycle.length, DEPENDENCY_LIFECYCLE.length);
    assert.deepEqual(view.dependencyPrinciples, [...DEPENDENCY_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_DEPENDENCY_DOMAINS.length);
    assert.equal(view.dependencyAnalysis.length, DEPENDENCY_ANALYSIS_DOMAINS.length);
    assert.ok(view.allDependencies.length >= 3);
    assert.ok(view.criticalPath.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE110, true);
  });

  test("assembleExecutiveDependencyEngine consolidates E1-02 through E1-08", () => {
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

    const view = assembleExecutiveDependencyEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      initiativePortfolio,
      departmentPlanning,
      executiveCalendar,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      journey: { currentMission: "E1-09 Executive Dependency Engine" },
      supervisor: { eta: "5h", status: "supervising" },
    });

    assert.equal(view.architectureVersion, "E1-09");
    assert.equal(view.integrations.executiveCalendarEngine, `E1-08 · ${executiveCalendar.calendarHealth}`);
    assert.ok(view.criticalPath.length >= 1);
    assert.ok(view.dependencyGraph.length >= 2);
    assert.ok(view.pillowEvaluations.length >= 6);
  });
});
