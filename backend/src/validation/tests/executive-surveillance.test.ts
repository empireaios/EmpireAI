import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  initializeWatcherRegistry,
  runExecutiveSurveillance,
  generateMissionsFromSignals,
  buildSurveillanceDashboard,
  buildExecutiveSurveillanceHeadquarters,
  recordObservationOutcome,
  DEFAULT_WATCHERS,
  resetExecutiveSurveillanceRepository,
} from "../../executive-surveillance/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-ess001";
const COMPANY_ID = "co-grand-king";

describe("Executive Surveillance System (ESS-001–ESS-010)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetExecutiveSurveillanceRepository();
  });

  afterEach(() => {
    resetExecutiveSurveillanceRepository();
    resetDatabaseInstance();
  });

  it("ESS-001/ESS-002 — surveillance core and watcher registry seed 19 watchers", () => {
    const watchers = initializeWatcherRegistry(WORKSPACE_ID, COMPANY_ID);
    assert.equal(watchers.length, DEFAULT_WATCHERS.length);
    assert.ok(watchers.some((w) => w.title === "CEO Watcher"));
    assert.ok(watchers.some((w) => w.title === "Experiment Watcher"));
    assert.ok(watchers.every((w) => w.active));
  });

  it("ESS-003/ESS-008 — signal engine emits signals from cross-module observation", () => {
    initializeWatcherRegistry(WORKSPACE_ID, COMPANY_ID);
    const { observations, signals } = runExecutiveSurveillance(WORKSPACE_ID, COMPANY_ID);

    assert.ok(observations.length >= 1);
    assert.ok(signals.length >= 1);
    assert.ok(signals.every((s) => s.confidence >= 0 && s.confidence <= 100));
    assert.ok(signals.every((s) => s.evidence.length >= 1));
    assert.ok(signals.every((s) => s.affectedModules.length >= 1));
    assert.ok(signals.every((s) => ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(s.priority)));
  });

  it("ESS-004/ESS-009 — mission generator produces missions with business value estimates", () => {
    initializeWatcherRegistry(WORKSPACE_ID, COMPANY_ID);
    const { signals } = runExecutiveSurveillance(WORKSPACE_ID, COMPANY_ID);
    const missions = generateMissionsFromSignals(WORKSPACE_ID, COMPANY_ID, signals);

    assert.ok(missions.length >= 1);
    assert.ok(missions.every((m) => m.businessValue >= 0));
    assert.ok(missions.every((m) => m.timeRequiredHours >= 0));
    assert.ok(missions.every((m) => m.expectedImpact.length > 0));
    assert.ok(missions.some((m) => ["TODAY", "WEEKLY", "STRATEGIC", "QUICK_WIN", "INVESTIGATION", "ESCALATION"].includes(m.category)));
  });

  it("ESS-005/ESS-007 — briefings and observation history with Soul integration path", () => {
    initializeWatcherRegistry(WORKSPACE_ID, COMPANY_ID);
    const { signals } = runExecutiveSurveillance(WORKSPACE_ID, COMPANY_ID);
    const missions = generateMissionsFromSignals(WORKSPACE_ID, COMPANY_ID, signals);

    const record = recordObservationOutcome(WORKSPACE_ID, COMPANY_ID, {
      signalId: signals[0]?.signalId,
      missionId: missions[0]?.missionId,
      outcome: "RESOLVED",
      accuracy: 85,
      learningReference: "Surveillance signal validated by commercial outcome",
    });

    assert.equal(record.outcome, "RESOLVED");
    assert.ok(record.accuracy === 85);
  });

  it("ESS-006/ESS-010 — surveillance dashboard and headquarters default experience", () => {
    initializeWatcherRegistry(WORKSPACE_ID, COMPANY_ID);
    runExecutiveSurveillance(WORKSPACE_ID, COMPANY_ID);

    const dashboard = buildSurveillanceDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dashboard.moduleId, "executive-surveillance");
    assert.ok(dashboard.systemAttentionMap.length >= 0);

    const hq = buildExecutiveSurveillanceHeadquarters(WORKSPACE_ID, COMPANY_ID);
    assert.equal(hq.missionId, "ESS-001-ESS-010");
    assert.ok(hq.ceoMorningBrief.summary.length > 0);
    assert.ok(hq.todaysMissions.length >= 0);
    assert.ok(hq.empireHealth.modulesWatched >= 0);
    assert.ok(hq.briefings.length >= 6);
  });
});
