import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  assembleBuilderConsoleView,
  buildFallbackBuilderConsoleView,
} from "../../builder-console/index.js";
import { buildDefaultTelemetry } from "../../builder-monitor/monitor-assessment.js";

describe("P7-05 Builder Console", () => {
  test("assembles full console view from telemetry", () => {
    const telemetry = {
      ...buildDefaultTelemetry(),
      currentMission: "P7-05 Builder Console",
      currentRoadmapItem: "P7-05",
      currentPhase: "implementation",
      currentStep: "Dashboard assembly",
      currentActivity: "Testing assembler",
      missionState: "running",
      overallProgress: 65,
      stageProgress: 40,
      elapsedTimeMs: 120_000,
      estimatedRemainingTimeMs: 60_000,
      filesModified: ["BuilderConsoleDashboard.tsx"],
      currentBranch: "main",
      validationState: "in_progress",
      recoveryState: "none",
      heartbeatAt: new Date().toISOString(),
      executionHealth: "healthy" as const,
    };

    const view = assembleBuilderConsoleView({
      telemetry,
      builderCockpit: {
        grandKingSummary: "Builder executing P7-05",
        analysis: { recommendations: ["Continue mission"] },
      },
      supervisor: { executionState: "running", missionHealth: "healthy", progress: "65%" },
      eta: { estimatedRemainingTimeMs: 60_000, executionVelocity: "2.1 steps/min" },
      ecc: { currentMission: "P7-05", priority: "high" },
    });

    assert.equal(view.architectureVersion, "P7-05");
    assert.equal(view.liveExecution.currentMission, "P7-05 Builder Console");
    assert.equal(view.liveExecution.overallProgress, 65);
    assert.ok(view.validation.architectureReview);
    assert.ok(view.supervisor.progress);
    assert.ok(view.ecc.missionQueue.length >= 1);
  });

  test("fallback view when Pillow unavailable", () => {
    const view = buildFallbackBuilderConsoleView();
    assert.equal(view.architectureVersion, "P7-05");
    assert.match(view.grandKingSummary, /Pillow/i);
  });
});
