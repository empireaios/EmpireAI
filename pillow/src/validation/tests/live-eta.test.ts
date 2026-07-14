import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  assembleLiveEtaExperience,
  buildFallbackLiveEtaExperience,
} from "../../live-eta/index.js";
import { buildDefaultTelemetry } from "../../builder-monitor/monitor-assessment.js";

describe("P7-06 Live ETA Experience", () => {
  test("assembles full live ETA from execution evidence", () => {
    const telemetry = {
      ...buildDefaultTelemetry(),
      currentMission: "P7-06 Live ETA",
      currentRoadmapItem: "P7-06",
      currentPhase: "implementation",
      currentStep: "Dashboard assembly",
      currentActivity: "Testing assembler",
      missionState: "running",
      overallProgress: 72,
      stageProgress: 50,
      elapsedTimeMs: 180_000,
      estimatedRemainingTimeMs: 90_000,
      filesModified: ["LiveEtaDashboard.tsx"],
      currentBranch: "main",
      repositoryActivity: "2 files modified",
      currentQueue: "validation",
      currentWorker: "builder",
      validationState: "in_progress",
      recoveryState: "none",
      heartbeatAt: new Date().toISOString(),
      executionHealth: "healthy" as const,
    };

    const view = assembleLiveEtaExperience({
      telemetry,
      estimate: {
        missionId: "P7-06",
        missionTitle: "P7-06 Live ETA",
        capturedAt: new Date().toISOString(),
        elapsedTimeMs: 180_000,
        estimatedRemainingTimeMs: 90_000,
        predictedCompletionAt: new Date(Date.now() + 90_000).toISOString(),
        confidencePercent: 78,
        confidenceLevel: "high",
        completionPercent: 72,
        executionVelocity: 2.4,
        criticalPath: ["assembler", "dashboard", "tests"],
        blockingDependencies: [],
        currentDelayReason: null,
        lastEtaUpdate: new Date().toISOString(),
        reason: "Progress advancing at 2.4%/min",
        evidence: ["Builder telemetry active", "Supervisor heartbeat OK"],
        knownUncertainty: [],
        recommendedAction: "Continue mission",
        pipeline: [],
      },
      supervisor: {
        currentPhase: "execution",
        currentStep: "Dashboard assembly",
        missionHealth: "healthy",
        heartbeat: new Date().toISOString(),
      },
      etaAnalysis: {
        etaAccuracy: ["78% confidence"],
        predictionQuality: ["Stable velocity"],
        recommendations: ["Continue"],
      },
    });

    assert.equal(view.architectureVersion, "P7-06");
    assert.equal(view.missionCountdown.progressPercent, 72);
    assert.equal(view.supervisorTimer.missionHealth, "healthy");
    assert.equal(view.builderCountdown.currentActivity, "Testing assembler");
    assert.ok(view.confidence.confidencePercent >= 75);
    assert.equal(view.execution.executionVelocity, 2.4);
  });

  test("fallback view when Pillow unavailable", () => {
    const view = buildFallbackLiveEtaExperience();
    assert.equal(view.architectureVersion, "P7-06");
    assert.match(view.grandKingSummary, /Pillow|evidence/i);
  });
});
