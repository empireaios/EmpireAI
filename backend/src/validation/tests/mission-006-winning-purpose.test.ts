import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import { buildPillowOperatingState } from "../../orchestration/pillow-commissioning/operating-state.js";
import {
  classifyGrandKingUxFinding,
  COMMERCIAL_KPI_PRESERVATION,
  COST_DISCIPLINE_ABOVE_AUTONOMY,
  GRAND_KING_UX_DEFECT_CLASSES,
  PILLOW_WINNING_PURPOSE,
  WINNING_IS_NOT,
  WINNING_OPERATING_QUESTION,
  activityModeFromOperatingState,
  buildWinningPurposeBrief,
} from "../../orchestration/pillow-commissioning/winning-purpose-doctrine.js";
import { SMART_VIABLE_LISTING_KPI } from "../../orchestration/pillow-commerce-presale/smart-viable-kpi.js";
import { configureValidationEnvironment } from "../harness.js";

const WS = "ws_empire_1";

describe("Mission 006 winning purpose + UX doctrine", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    process.env.DATABASE_PATH = ":memory:";
    resetDatabaseInstance();
  });

  afterEach(() => {
    resetDatabaseInstance();
  });

  it("defines winning as economic value — not activity maximisation", () => {
    assert.match(PILLOW_WINNING_PURPOSE, /economic value/i);
    assert.match(WINNING_OPERATING_QUESTION, /probability of winning/i);
    assert.ok(WINNING_IS_NOT.some((x) => /API calls/i.test(x)));
    assert.match(COST_DISCIPLINE_ABOVE_AUTONOMY, /never overrides/i);
  });

  it("preserves 1,000 SMART KPI sequencing", () => {
    assert.equal(SMART_VIABLE_LISTING_KPI.target, 1000);
    assert.equal(COMMERCIAL_KPI_PRESERVATION.immediateScaleKpi, 1000);
    assert.equal(COMMERCIAL_KPI_PRESERVATION.firstRealDollarAfter, 1000);
    assert.equal(COMMERCIAL_KPI_PRESERVATION.tenThousandAfter, 1000);
    assert.match(SMART_VIABLE_LISTING_KPI.sequence, /AFTER 1,000/i);
    assert.match(SMART_VIABLE_LISTING_KPI.winningNote, /Mission 006/);
    assert.equal(COMMERCIAL_KPI_PRESERVATION.cursorMustNotSelectPortfolio, true);
  });

  it("classifies Grand King UX defects into Class 1/2/3", () => {
    assert.equal(
      classifyGrandKingUxFinding({ trapsInterface: true, preventsOperation: true }),
      "CLASS_1",
    );
    assert.equal(classifyGrandKingUxFinding({ confusingWorkflow: true }), "CLASS_2");
    assert.equal(classifyGrandKingUxFinding({ aestheticOnly: true }), "CLASS_3");
    assert.equal(GRAND_KING_UX_DEFECT_CLASSES.CLASS_1_OPERATIONAL_BLOCKER.id, "CLASS_1");
  });

  it("maps operating state to activity modes and attaches winning purpose", () => {
    assert.equal(activityModeFromOperatingState("WAITING_FOR_GRAND_KING"), "WAITING_FOR_AUTHORITY");
    assert.equal(activityModeFromOperatingState("COST_GUARD_ACTIVE"), "BLOCKED");
    assert.equal(activityModeFromOperatingState("IDLE_NO_QUALIFYING_WORK"), "IDLE_FOR_VALID_REASON");

    const op = buildPillowOperatingState(WS);
    assert.ok(op.activityMode);
    assert.equal(op.winningPurpose, PILLOW_WINNING_PURPOSE);
    assert.equal(op.winningOperatingQuestion, WINNING_OPERATING_QUESTION);

    const brief = buildWinningPurposeBrief(op.state);
    assert.equal(brief.doctrineId, "MISSION-006-WINNING-PURPOSE");
    assert.equal(brief.commercialKpi.corridor.supplier, "CJdropshipping");
  });
});
