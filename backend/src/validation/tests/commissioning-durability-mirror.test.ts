import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

describe("commissioning durability mirror (CQ-12)", () => {
  let tmpDir: string;
  let prevDb: string | undefined;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "opc-mirror-"));
    prevDb = process.env.DATABASE_PATH;
    process.env.DATABASE_PATH = path.join(tmpDir, "empireai-brain.db");
  });

  after(() => {
    if (prevDb === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = prevDb;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes and reads Pillow selection without Cursor selection", async () => {
    const { writeCommissioningDurabilityMirror, readCommissioningDurabilityMirror } =
      await import("../../orchestration/pillow-commissioning/commissioning-durability-mirror.js");

    const record = {
      commissioningId: "opc_test1234",
      workspaceId: "ws_empire_1",
      selectionAuthority: "pillow" as const,
      cursorSelected: false as const,
      opportunityId: "opp-1",
      productName: "Durability Test Product",
      supplier: "CJdropshipping" as const,
      marketplace: "Amazon US" as const,
      asin: "B0TESTASIN",
      cjPid: "cj1",
      amazonSellerSku: "SKU1",
      supplierCost: "$1.00",
      freight: "$2.00",
      deliveryPromise: "test",
      offerPrice: "$10.00",
      competingOffers: "1",
      expectedProfit: "$3.00",
      expectedMargin: "30%",
      brandRoute: "GENERIC_UNBRANDED",
      pillowRecommendation: "INVESTIGATE",
      riskReasons: [],
      stage: "PILLOW_RECOMMENDATION" as const,
      publicationAttempted: false as const,
      supplierSpendAttempted: false as const,
      buyable: "UNKNOWN" as const,
      grandKingDecision: "none" as const,
      approvalId: null,
      visualAmazonOutput: {
        title: "Durability Test Product",
        imageAvailable: false,
        route: "/cockpit",
        lastChecked: new Date().toISOString(),
        nextPillowAction: "monitor",
      },
      attributableCostUsd: null,
      stagesCompleted: ["PILLOW_RECOMMENDATION" as const],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: ["unit-test"],
    };

    writeCommissioningDurabilityMirror(record);
    const loaded = readCommissioningDurabilityMirror("ws_empire_1");
    assert.ok(loaded);
    assert.equal(loaded.commissioningId, "opc_test1234");
    assert.equal(loaded.selectionAuthority, "pillow");
    assert.equal(loaded.cursorSelected, false);
    assert.equal(loaded.asin, "B0TESTASIN");

    const mirrorFile = path.join(tmpDir, "commissioning-mirror", "ws_empire_1.json");
    assert.equal(fs.existsSync(mirrorFile), true);
  });
});
