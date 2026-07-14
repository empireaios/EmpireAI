import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  MONITORED_COMPONENT_REGISTRY,
  MONITORED_DOMAINS,
  HEALTH_CLASSIFICATIONS,
  ALERT_SEVERITIES,
  MONITORING_PRINCIPLES,
  generateAlertsFromSnapshot,
  buildDefaultMonitoringSnapshot,
} from "../../guardian-monitoring/index.js";
import {
  startPillow,
  requirePillowGuardianMonitoring,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P5-04 Guardian Monitoring (PILLOW-GM-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Guardian Monitoring Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowGuardianMonitoring();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-GM-001");
    assert.equal(state.status, "ready");
  });

  test("Monitored component registry covers all domains", () => {
    assert.ok(MONITORED_COMPONENT_REGISTRY.length >= 20);
    assert.ok(MONITORED_DOMAINS.length >= 20);
    assert.ok(HEALTH_CLASSIFICATIONS.length >= 8);
    assert.ok(ALERT_SEVERITIES.length >= 5);
    assert.ok(MONITORING_PRINCIPLES.length >= 8);
    for (const c of MONITORED_COMPONENT_REGISTRY) {
      assert.ok(c.purpose);
      assert.ok(c.metricsCollected.length > 0);
      assert.ok(c.alertThresholds);
    }
  });

  test("Alert engine generates classified alerts", () => {
    const degraded = buildDefaultMonitoringSnapshot();
    degraded.eventLoopLagMs = 600;
    degraded.apiHealthy = false;
    const alerts = generateAlertsFromSnapshot(degraded);
    assert.ok(alerts.some((a) => a.severity === "critical"));
    assert.ok(alerts.every((a) => a.alertId && a.recommendedAction));
  });

  test("Builder gate evaluates guardian monitoring readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowGuardianMonitoring();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P5-04", roadmapItem: "P5-04" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — Cockpit visibility without logs", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowGuardianMonitoring();
    const visibility = engine.verifyGrandKingVisibility();
    assert.equal(visibility.complete, true);
    assert.ok(visibility.componentCount >= 20);
    assert.match(visibility.assessment.grandKingSummary, /Empire Health:/);
    assert.match(visibility.assessment.grandKingSummary, /Runtime:/);
    assert.ok(visibility.cockpitFields.includes("overallHealth"));
    assert.ok(visibility.cockpitFields.includes("alerts"));
  });

  test("Generated mission includes Guardian Monitoring preamble", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /GUARDIAN MONITORING/);
      assert.match(doc.formatted, /Guardian monitors/i);
    }
  });

  test("Historical monitoring records timeline", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowGuardianMonitoring();
    engine.runAssessment();
    engine.runAssessment();
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(Array.isArray(cockpit.historicalTrends));
    const analysis = engine.analyzeMonitoringTrends();
    assert.ok(analysis.recommendations.length > 0);
  });
});
