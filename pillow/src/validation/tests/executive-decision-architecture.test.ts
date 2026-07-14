import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import {
  assembleExecutiveDecisionArchitecture,
  buildFallbackExecutiveDecisionArchitecture,
  DECISION_PIPELINE,
  DECISION_PRINCIPLES,
  GOVERNED_DECISION_DOMAINS,
} from "../../executive-decision-architecture/index.js";

describe("E2-01 Executive Decision Architecture", () => {
  test("buildFallbackExecutiveDecisionArchitecture returns constitutional decision model", () => {
    const view = buildFallbackExecutiveDecisionArchitecture();
    assert.equal(view.architectureVersion, "E2-01");
    assert.equal(view.decisionPipeline.length, DECISION_PIPELINE.length);
    assert.deepEqual(view.decisionPrinciples, [...DECISION_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_DECISION_DOMAINS.length);
    assert.ok(view.currentDecisions.length >= 6);
    assert.ok(view.decisionQueue.length >= 1);
    assert.ok(view.decisionGovernance.length >= 10);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE202, true);
  });

  test("assembleExecutiveDecisionArchitecture integrates E1 planning programme", () => {
    const executiveArchitecture = assembleExecutiveArchitectureFramework({});
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture,
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const strategicObjectives = assembleStrategicObjectiveEngine({ corporateVision });
    const executiveRoadmap = assembleExecutiveRoadmapEngine({ corporateVision, strategicObjectives });
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();

    const view = assembleExecutiveDecisionArchitecture({
      executiveArchitecture,
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      executivePlanningCertification,
      journey: { currentMission: "E2-01 Decision Architecture" },
      supervisor: { status: "monitoring decisions" },
      ecc: { status: "decision execution" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.architectureVersion, "E2-01");
    assert.equal(view.integrations.corporateVisionEngine, `E1-02 · ${corporateVision.visionHealth}`);
    assert.ok(view.integrations.executivePlanningProgramme.includes("certified"));
    assert.ok(view.pillowEvaluations.length >= 6);
  });
});
