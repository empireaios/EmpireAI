import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  assembleCockpitUxArchitecture,
  buildFallbackCockpitUxArchitecture,
  COCKPIT_CENTRES,
  COCKPIT_UX_PRINCIPLES,
  EXECUTIVE_HOME_FIELDS,
  COCKPIT_WIDGETS,
} from "../../cockpit-ux-architecture/index.js";

describe("P7-02 Cockpit UX Architecture", () => {
  test("buildFallbackCockpitUxArchitecture returns constitutional Cockpit UX model", () => {
    const view = buildFallbackCockpitUxArchitecture();
    assert.equal(view.architectureVersion, "P7-02");
    assert.equal(view.centres.length, COCKPIT_CENTRES.length);
    assert.deepEqual(view.uxPrinciples, [...COCKPIT_UX_PRINCIPLES]);
    assert.equal(view.executiveHome.length, EXECUTIVE_HOME_FIELDS.length);
    assert.equal(view.widgets.length, COCKPIT_WIDGETS.length);
    assert.equal(view.readyForP703, true);
    assert.ok(view.pillowPublications.length >= 6);
    assert.ok(view.supervisorPublications.length >= 6);
    assert.ok(view.guardianPublications.length >= 5);
  });

  test("assembleCockpitUxArchitecture consolidates founder shell and execution stack", () => {
    const view = assembleCockpitUxArchitecture({
      founderShell: {
        shellHealth: "healthy",
        executiveHome: {
          missionStatus: "P7-02 Cockpit UX",
          builderStatus: "ready",
          supervisorStatus: "supervising",
          productionStatus: "validated",
          revenue: "Pre-revenue",
          recommendations: ["Complete Pillow UX next"],
          alerts: [],
          pendingActions: ["Review mission queue"],
        },
        context: {
          currentMission: "P7-02",
          currentJourney: "P7 Experience",
          currentBusiness: "Grand King portfolio",
        },
      },
      supervisor: {
        currentMission: "P7-02",
        progressPercent: "75%",
        currentStep: "Widget consolidation",
        eta: "45m",
        missionHealth: "healthy",
      },
      guardian: { overallHealth: "healthy", availability: "99.9%" },
      journey: { currentJourney: "P7 Experience · Cockpit UX" },
    });

    assert.equal(view.architectureVersion, "P7-02");
    assert.equal(view.integrations.founderShell, "P7-01 · PILLOW-FS-001");
    assert.ok(view.executiveAwarenessScore >= 70);
    assert.equal(
      view.executiveHome.find((m) => m.field === "current_mission")?.value,
      "P7-02",
    );
    assert.ok(view.realtimeDomains.length >= 8);
  });
});
