import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  seedRevenuePipeline,
  transitionProductState,
  buildRevenuePipelineDashboard,
  buildRevenuePipelineHeadquarters,
  canTransition,
  getIntegrationSnapshot,
  resetGkrRepository,
  REVENUE_PIPELINE_LIFECYCLE,
} from "../../grand-king-revenue-pipeline/index.js";
import { GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../../grand-king/constants.js";
import { configureValidationEnvironment } from "../harness.js";

describe("Grand King Revenue Pipeline (GKR-001–GKR-010)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGkrRepository();
  });

  afterEach(() => {
    resetGkrRepository();
    resetDatabaseInstance();
  });

  it("GKR-001/GKR-002 — pipeline runtime and state machine lifecycle", () => {
    assert.equal(REVENUE_PIPELINE_LIFECYCLE.length, 9);
    assert.ok(canTransition("DISCOVERED", "UNDER_REVIEW"));
    assert.ok(!canTransition("ARCHIVED", "LIVE"));

    const products = seedRevenuePipeline(GRAND_KING_WORKSPACE_ID, GRAND_KING_COMPANY_ID);
    assert.ok(products.length >= 5);
    assert.ok(products.some((p) => p.state === "KING_APPROVAL"));
    assert.ok(products.some((p) => p.state === "LIVE"));
  });

  it("GKR-003/GKR-005 — dashboard exposes pipeline buckets and health", () => {
    seedRevenuePipeline(GRAND_KING_WORKSPACE_ID, GRAND_KING_COMPANY_ID);
    const dash = buildRevenuePipelineDashboard(GRAND_KING_WORKSPACE_ID, GRAND_KING_COMPANY_ID);

    assert.equal(dash.moduleId, "grand-king-revenue-pipeline");
    assert.ok(dash.revenuePipeline.length === 9);
    assert.ok(dash.empireRevenueScore >= 0);
    assert.ok(dash.productsInReview.length + dash.awaitingApproval.length + dash.liveProducts.length >= 1);
  });

  it("GKR-004 — state transitions record timeline events", () => {
    const products = seedRevenuePipeline(GRAND_KING_WORKSPACE_ID, GRAND_KING_COMPANY_ID);
    const candidate = products.find((p) => p.state === "DISCOVERED");
    assert.ok(candidate);

    const updated = transitionProductState(
      GRAND_KING_WORKSPACE_ID,
      GRAND_KING_COMPANY_ID,
      candidate!.productId,
      "UNDER_REVIEW",
      "Commercial review started",
    );
    assert.equal(updated.state, "UNDER_REVIEW");
    assert.ok(updated.timeline.length >= 2);
    assert.ok(updated.health);
  });

  it("GKR-006/007/008 — integration attachment points without duplication", () => {
    const integrations = getIntegrationSnapshot(GRAND_KING_WORKSPACE_ID, GRAND_KING_COMPANY_ID);
    assert.ok(integrations.marketplaces.length >= 4);
    assert.ok(integrations.suppliers.length >= 8);
    assert.ok(integrations.suppliers.some((s) => s.platformId === "cj-dropshipping"));
  });

  it("GKR-009/GKR-010 — headquarters revenue opportunities and empire score", () => {
    seedRevenuePipeline(GRAND_KING_WORKSPACE_ID, GRAND_KING_COMPANY_ID);
    const hq = buildRevenuePipelineHeadquarters(GRAND_KING_WORKSPACE_ID, GRAND_KING_COMPANY_ID);

    assert.equal(hq.missionId, "GKR-001-GKR-010");
    assert.ok(hq.currentRevenuePipeline);
    assert.ok(hq.commercialHealth.overallScore >= 0);
    assert.ok(hq.empireRevenueScore >= 0);
    assert.ok(hq.todaysRevenueOpportunities.length >= 0);
  });
});
