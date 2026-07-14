import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleExecutivePlanningDashboard } from "../../executive-planning-dashboard/assembler.js";
import {
  assembleExecutivePlanningCertification,
  buildFallbackExecutivePlanningCertification,
  CERTIFICATION_GATES,
  CERTIFICATION_SCOPE,
  CERTIFICATION_VALIDATIONS,
} from "../../executive-planning-certification/index.js";

describe("E1-15 Executive Planning Certification", () => {
  test("buildFallbackExecutivePlanningCertification certifies E1 programme", () => {
    const view = buildFallbackExecutivePlanningCertification();
    assert.equal(view.architectureVersion, "E1-15");
    assert.equal(view.certificationScope.length, CERTIFICATION_SCOPE.length);
    assert.equal(view.certificationGates.length, CERTIFICATION_GATES.length);
    assert.equal(view.certificationValidations.length, CERTIFICATION_VALIDATIONS.length);
    assert.equal(view.programmeCertified, true);
    assert.equal(view.phaseE1Completed, true);
    assert.equal(view.allGatesPassed, true);
    assert.equal(view.gatesPassed, 10);
    assert.equal(view.criticalDefectCount, 0);
    assert.equal(view.readyForE201, true);
    assert.equal(view.nextMission, "E2-01 Decision Architecture");
  });

  test("assembleExecutivePlanningCertification validates full E1 integration", () => {
    const executiveArchitecture = assembleExecutiveArchitectureFramework({});
    const executivePlanningDashboard = assembleExecutivePlanningDashboard({
      executiveArchitecture,
    });

    const view = assembleExecutivePlanningCertification({
      executiveArchitecture,
      executivePlanningDashboard,
      journey: { currentJourney: "E1 Executive Planning Certified" },
      supervisor: { status: "supervising" },
      ecc: { status: "integrated" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.architectureVersion, "E1-15");
    assert.ok(view.certificationScope.every((s) => s.status === "certified"));
    assert.ok(view.certificationGates.every((g) => g.result === "PASS"));
    assert.ok(view.executiveQualityReview.length >= 8);
    assert.equal(view.defects.length, 0);
  });
});
