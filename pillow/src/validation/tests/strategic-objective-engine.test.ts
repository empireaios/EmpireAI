import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import {
  assembleStrategicObjectiveEngine,
  buildFallbackStrategicObjectiveEngine,
  OBJECTIVE_HIERARCHY,
  OBJECTIVE_LIFECYCLE,
  OBJECTIVE_PRINCIPLES,
  GOVERNED_OBJECTIVE_DOMAINS,
} from "../../strategic-objective-engine/index.js";

describe("E1-03 Strategic Objective Engine", () => {
  test("buildFallbackStrategicObjectiveEngine returns constitutional objective model", () => {
    const view = buildFallbackStrategicObjectiveEngine();
    assert.equal(view.architectureVersion, "E1-03");
    assert.equal(view.objectiveHierarchy.length, OBJECTIVE_HIERARCHY.length);
    assert.equal(view.objectiveLifecycle.length, OBJECTIVE_LIFECYCLE.length);
    assert.deepEqual(view.objectivePrinciples, [...OBJECTIVE_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_OBJECTIVE_DOMAINS.length);
    assert.ok(view.currentStrategicObjectives.length >= 3);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE104, true);
  });

  test("assembleStrategicObjectiveEngine consolidates E1-02 vision and PILLOW-019 objective", () => {
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });

    const view = assembleStrategicObjectiveEngine({
      corporateVision,
      executiveArchitecture: assembleExecutiveArchitectureFramework({}),
      activeObjective: {
        objectiveId: "test-obj",
        title: "Test Strategic Objective",
        successCriteria: [{ id: "c1", label: "Criterion 1", complete: true }],
        phase: "execution",
        progressPercent: 50,
        currentTask: "Current task",
        nextTask: "Next task",
        blockers: [],
        complete: false,
      },
      journey: { currentJourney: "E1 Executive Planning" },
    });

    assert.equal(view.architectureVersion, "E1-03");
    assert.equal(view.integrations.corporateVisionEngine, `E1-02 · ${corporateVision.visionHealth}`);
    assert.ok(view.currentStrategicObjectives.some((o) => o.objectiveId === "test-obj"));
    assert.equal(view.objectiveMeasurements.length, 10);
    assert.ok(view.pillowEvaluations.length >= 6);
  });
});
