import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import {
  assemblePriorityManagementEngine,
  buildFallbackPriorityManagementEngine,
  PRIORITY_PIPELINE,
  PRIORITY_PRINCIPLES,
  GOVERNED_PRIORITY_DOMAINS,
  SCORING_DOMAINS,
} from "../../priority-management-engine/index.js";

describe("E1-05 Priority Management Engine", () => {
  test("buildFallbackPriorityManagementEngine returns constitutional priority model", () => {
    const view = buildFallbackPriorityManagementEngine();
    assert.equal(view.architectureVersion, "E1-05");
    assert.equal(view.priorityPipeline.length, PRIORITY_PIPELINE.length);
    assert.deepEqual(view.priorityPrinciples, [...PRIORITY_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_PRIORITY_DOMAINS.length);
    assert.equal(view.scoringDomains.length, SCORING_DOMAINS.length);
    assert.ok(view.currentPriorities.length >= 3);
    assert.ok(view.executionQueue.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE106, true);
  });

  test("assemblePriorityManagementEngine consolidates E1-02 through E1-04", () => {
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const strategicObjectives = assembleStrategicObjectiveEngine({ corporateVision });
    const executiveRoadmap = assembleExecutiveRoadmapEngine({ corporateVision, strategicObjectives });

    const view = assemblePriorityManagementEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      journey: { currentMission: "E1-05 Priority Management Engine" },
      supervisor: { eta: "1h", status: "supervising" },
    });

    assert.equal(view.architectureVersion, "E1-05");
    assert.equal(view.integrations.corporateVisionEngine, `E1-02 · ${corporateVision.visionHealth}`);
    assert.equal(view.integrations.executiveRoadmapEngine, `E1-04 · ${executiveRoadmap.roadmapHealth}`);
    assert.ok(view.currentPriorities[0]!.recommendedOrder === 1);
    assert.ok(view.currentPriorities.every((p) => p.scoreBreakdown.length === SCORING_DOMAINS.length));
    assert.ok(view.pillowEvaluations.length >= 6);
  });
});
