import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  assertPaidAutonomousAllowed,
  buildCostGuardStatus,
  getCostGuardLimits,
  recordCostSpend,
  runSafeHardStopProof,
  setCostGuardLimits,
} from "../../orchestration/pillow-commissioning/cost-guard.js";
import { listFlightEvents, recordFlightEvent } from "../../orchestration/pillow-commissioning/flight-recorder.js";
import { getBirthRecord } from "../../orchestration/pillow-commissioning/birth.js";
import { buildSinceLastVisitBrief } from "../../orchestration/pillow-commissioning/since-last-visit.js";
import { buildPillowOperatingState } from "../../orchestration/pillow-commissioning/operating-state.js";
import { buildCostControlCentreSnapshot } from "../../orchestration/pillow-commissioning/cost-control-centre.js";
import { buildScaleCostOptimisationReport } from "../../orchestration/pillow-commissioning/intelligence-tiers.js";
import { runPillowOneProductCommissioning } from "../../orchestration/pillow-commissioning/one-product-commissioning.js";
import {
  resetInstitutionalMemoryRepository,
  seedInstitutionalMemoryBootstrap,
} from "../../orchestration/executive-learning/institutional-memory-service.js";
import { configureValidationEnvironment } from "../harness.js";

const WS = "ws_empire_1";

describe("Mission 004 pillow commissioning", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    process.env.DATABASE_PATH = ":memory:";
    resetDatabaseInstance();
    resetInstitutionalMemoryRepository();
    seedInstitutionalMemoryBootstrap(WS);
  });

  afterEach(() => {
    resetInstitutionalMemoryRepository();
    resetDatabaseInstance();
  });

  it("records Flight Recorder events durably", () => {
    recordFlightEvent({
      workspaceId: WS,
      eventType: "OBSERVE",
      businessArea: "commerce",
      subsystem: "test",
      objective: "Observe pipeline",
      authority: "pillow",
      result: "Observed",
      evidenceConsidered: ["unit-test"],
    });
    const events = listFlightEvents(WS, { limit: 10 });
    assert.equal(events.length, 1);
    assert.equal(events[0]!.eventType, "OBSERVE");
    assert.ok(events[0]!.recordedAt);
  });

  it("Cost Guard does not invent limits and hard-stop proof blocks paid activity", () => {
    const status = buildCostGuardStatus(WS);
    assert.ok(status.unconfiguredLimitKeys.length > 0);
    assert.equal(status.hardStopActive, false);

    const proof = runSafeHardStopProof(WS, "unit-test@empire.ai");
    assert.equal(proof.ok, true);
    assert.ok(proof.blockedReason);

    const restored = getCostGuardLimits(WS);
    assert.equal(restored.autonomousPaidActionLimitUsd, null);

    setCostGuardLimits(
      WS,
      { autonomousPaidActionLimitUsd: 0.0001, dailyAiBudgetUsd: 0.0001 },
      "unit",
    );
    recordCostSpend({
      workspaceId: WS,
      kind: "autonomous_paid",
      amountUsd: 1,
      provider: "test",
    });
    const blocked = assertPaidAutonomousAllowed(WS, 0.01);
    assert.equal(blocked.allowed, false);
  });

  it("since-last-visit and operating state are honest (not generic LIVE)", () => {
    recordFlightEvent({
      workspaceId: WS,
      eventType: "COMMERCE_CYCLE",
      businessArea: "commerce",
      subsystem: "test",
      objective: "Cycle",
      authority: "pillow",
      result: "complete",
      evidenceConsidered: [],
    });
    const brief = buildSinceLastVisitBrief(WS, { recordVisit: true });
    assert.ok(brief.lastVisitAt);
    assert.ok(brief.operatingState);
    assert.notEqual(brief.operatingState, "LIVE");

    const op = buildPillowOperatingState(WS);
    assert.ok(!/^LIVE$/i.test(op.humanLabel));
    assert.notEqual(String(op.state), "LIVE");
  });

  it("birth remains without timestamp until Grand King authorises", () => {
    const birth = getBirthRecord(WS);
    assert.equal(birth.birthTimestamp, null);
    assert.notEqual(birth.status, "BORN");
  });

  it("one-product commissioning refuses Cursor preselection when no production opportunity", () => {
    const result = runPillowOneProductCommissioning(WS);
    assert.equal(result.ok, false);
    assert.match(result.error ?? "", /Cursor must not preselect/i);
  });

  it("Cost Control Centre keeps Actual/Committed/Forecast separate", () => {
    const snap = buildCostControlCentreSnapshot(WS);
    assert.ok(snap.actualVsCommittedVsForecast.note.includes("never merged"));
    assert.ok(snap.billingExposure.length >= 3);
    assert.ok(snap.blindSpots.length > 0);
    assert.equal(snap.scaleForecast.basis, "INSUFFICIENT_MEASURED_DATA");
  });

  it("scale cost optimisation report isolates Cursor from production selection", () => {
    const report = buildScaleCostOptimisationReport(WS);
    assert.equal(report.cursorIsolationProof.cursorSelectedCommissioningProduct, false);
    assert.equal(report.cursorIsolationProof.cursorSelectedThousandPortfolio, false);
    assert.ok(report.tierMap.some((t) => t.tier === "TIER_0"));
  });
});
