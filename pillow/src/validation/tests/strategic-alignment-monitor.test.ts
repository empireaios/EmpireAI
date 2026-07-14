import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { assemblePriorityManagementEngine } from "../../priority-management-engine/assembler.js";
import { assembleExecutiveScenarioPlanner } from "../../executive-scenario-planner/assembler.js";
import { assembleLongTermGrowthPlanner } from "../../long-term-growth-planner/assembler.js";
import { assembleOpportunityPrioritizationEngine } from "../../opportunity-prioritization-engine/assembler.js";
import {
  assembleStrategicAlignmentMonitor,
  buildFallbackStrategicAlignmentMonitor,
  ALIGNMENT_PIPELINE,
  ALIGNMENT_PRINCIPLES,
  GOVERNED_ALIGNMENT_DOMAINS,
  ALIGNMENT_SCORING_DOMAINS,
  DRIFT_DETECTION_TYPES,
} from "../../strategic-alignment-monitor/index.js";

describe("E1-13 Strategic Alignment Monitor", () => {
  test("buildFallbackStrategicAlignmentMonitor returns constitutional alignment model", () => {
    const view = buildFallbackStrategicAlignmentMonitor();
    assert.equal(view.architectureVersion, "E1-13");
    assert.equal(view.alignmentPipeline.length, ALIGNMENT_PIPELINE.length);
    assert.deepEqual(view.alignmentPrinciples, [...ALIGNMENT_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_ALIGNMENT_DOMAINS.length);
    assert.equal(view.alignmentScoring.length, ALIGNMENT_SCORING_DOMAINS.length);
    assert.ok(view.alignmentAssessments.length >= 10);
    assert.ok(view.driftDetections.length >= 1);
    assert.ok(view.alignmentTrends.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE114, true);
    assert.ok(DRIFT_DETECTION_TYPES.length >= 9);
  });

  test("assembleStrategicAlignmentMonitor consolidates E1-02 through E1-12", () => {
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
    const opportunityPrioritization = assembleOpportunityPrioritizationEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      longTermGrowthPlanner,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
    });

    const view = assembleStrategicAlignmentMonitor({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      priorityManagement,
      opportunityPrioritization,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      journey: { currentMission: "E1-13 Strategic Alignment Monitor" },
      supervisor: { eta: "5h", status: "monitoring alignment" },
      ecc: { status: "corrective coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.architectureVersion, "E1-13");
    assert.equal(
      view.integrations.opportunityPrioritizationEngine,
      `E1-12 · ${opportunityPrioritization.engineHealth}`,
    );
    assert.ok(view.overallAlignmentScore >= 65);
    assert.ok(view.pillowEvaluations.length >= 6);
  });
});
