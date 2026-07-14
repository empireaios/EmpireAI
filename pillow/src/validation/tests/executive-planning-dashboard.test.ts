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
import { assembleExecutiveScenarioPlanner } from "../../executive-scenario-planner/assembler.js";
import { assembleLongTermGrowthPlanner } from "../../long-term-growth-planner/assembler.js";
import { assembleOpportunityPrioritizationEngine } from "../../opportunity-prioritization-engine/assembler.js";
import { assembleStrategicAlignmentMonitor } from "../../strategic-alignment-monitor/assembler.js";
import {
  assembleExecutivePlanningDashboard,
  buildFallbackExecutivePlanningDashboard,
  PLANNING_WIDGET_IDS,
  REAL_TIME_UPDATE_TRIGGERS,
} from "../../executive-planning-dashboard/index.js";

describe("E1-14 Executive Planning Dashboard", () => {
  test("buildFallbackExecutivePlanningDashboard returns unified planning model", () => {
    const view = buildFallbackExecutivePlanningDashboard();
    assert.equal(view.architectureVersion, "E1-14");
    assert.equal(view.planningWidgets.length, PLANNING_WIDGET_IDS.length);
    assert.ok(view.executiveSummary.overallPlanningScore >= 50);
    assert.ok(view.executiveRecommendations.length >= 1);
    assert.ok(view.navigationLinks.length >= 10);
    assert.equal(view.realTimeUpdateTriggers.length, REAL_TIME_UPDATE_TRIGGERS.length);
    assert.equal(view.readyForE115, true);
  });

  test("assembleExecutivePlanningDashboard consolidates E1-01 through E1-13", () => {
    const executiveArchitecture = assembleExecutiveArchitectureFramework({});
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture,
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
      executiveArchitecture,
    });
    const executiveScenarioPlanner = assembleExecutiveScenarioPlanner({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      initiativePortfolio,
      departmentPlanning,
      executiveCalendar,
      executiveDependency,
      executiveArchitecture,
    });
    const longTermGrowthPlanner = assembleLongTermGrowthPlanner({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      executiveScenarioPlanner,
      priorityManagement,
      executiveArchitecture,
    });
    const opportunityPrioritization = assembleOpportunityPrioritizationEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      longTermGrowthPlanner,
      executiveArchitecture,
    });
    const strategicAlignment = assembleStrategicAlignmentMonitor({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      opportunityPrioritization,
      executiveArchitecture,
    });

    const view = assembleExecutivePlanningDashboard({
      executiveArchitecture,
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      initiativePortfolio,
      departmentPlanning,
      executiveCalendar,
      executiveDependency,
      executiveScenarioPlanner,
      longTermGrowthPlanner,
      opportunityPrioritization,
      strategicAlignment,
      journey: { currentMission: "E1-14 Executive Planning Dashboard" },
      supervisor: { status: "supervising" },
      ecc: { status: "coordinating" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.architectureVersion, "E1-14");
    assert.equal(view.planningWidgets.length, 12);
    assert.equal(view.integrations.corporateVisionEngine, `E1-02 · ${corporateVision.visionHealth}`);
    assert.equal(view.integrations.strategicAlignmentMonitor, `E1-13 · ${strategicAlignment.monitorHealth}`);
    assert.ok(view.pillowPublications.length >= 5);
    assert.ok(view.eccPublications.length >= 5);
    assert.ok(view.supervisorPublications.length >= 5);
  });
});
