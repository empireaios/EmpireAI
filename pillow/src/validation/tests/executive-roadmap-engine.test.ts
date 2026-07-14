import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import {
  assembleExecutiveRoadmapEngine,
  buildFallbackExecutiveRoadmapEngine,
  ROADMAP_HIERARCHY,
  ROADMAP_LIFECYCLE,
  ROADMAP_PRINCIPLES,
  GOVERNED_ROADMAP_DOMAINS,
} from "../../executive-roadmap-engine/index.js";

describe("E1-04 Executive Roadmap Engine", () => {
  test("buildFallbackExecutiveRoadmapEngine returns constitutional roadmap model", () => {
    const view = buildFallbackExecutiveRoadmapEngine();
    assert.equal(view.architectureVersion, "E1-04");
    assert.equal(view.roadmapHierarchy.length, ROADMAP_HIERARCHY.length);
    assert.equal(view.roadmapLifecycle.length, ROADMAP_LIFECYCLE.length);
    assert.deepEqual(view.roadmapPrinciples, [...ROADMAP_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_ROADMAP_DOMAINS.length);
    assert.ok(view.currentProgrammes.length >= 3);
    assert.ok(view.criticalPath.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE105, true);
  });

  test("assembleExecutiveRoadmapEngine consolidates E1-02 vision and E1-03 objectives", () => {
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const strategicObjectives = assembleStrategicObjectiveEngine({ corporateVision });

    const view = assembleExecutiveRoadmapEngine({
      corporateVision,
      strategicObjectives,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      journey: { currentJourney: "E1 Executive Planning", currentMission: "E1-04 Executive Roadmap Engine" },
      supervisor: { eta: "2h", status: "supervising" },
    });

    assert.equal(view.architectureVersion, "E1-04");
    assert.equal(view.integrations.corporateVisionEngine, `E1-02 · ${corporateVision.visionHealth}`);
    assert.equal(view.integrations.strategicObjectiveEngine, `E1-03 · ${strategicObjectives.objectiveHealth}`);
    assert.ok(view.currentProgrammes.some((p) => p.title.includes("E1 Executive Planning")));
    assert.ok(view.dependencies.length >= 5);
    assert.ok(view.pillowEvaluations.length >= 6);
  });
});
