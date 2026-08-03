import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  INW_CAPABILITIES,
  INW_INTEGRATION_TARGETS,
  INW_METADATA_VERSION,
  INVENTORY_REPORT_VERSION,
  STOCK_STATUSES,
  buildInventoryWorkerConfiguration,
  createInventoryWorker,
  resetInventoryWorkerForTesting,
} from "../../inventory-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createInventoryWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createInventoryWorker(bootstrap, config);
  await engine.initialize();
  engine.connectInventoryWorker();
  return engine;
}

const sampleInput = {
  approvedProduct: {
    productId: "prod-bamboo-desk-organizer",
    productName: "Bamboo Desk Organizer",
    supplierId: "sup-shenzhen-bamboo-co",
    supplierName: "Shenzhen Bamboo Co",
    currentStock: 40,
    previousStock: 120,
    supplierStockAvailable: 200,
    leadTimeDays: 14,
    dailyDemand: 5,
    safetyStockDays: 3,
    evaluationId: "sew-eval-bamboo-01",
    discoveryId: "sdw-discovery-bamboo-01",
    businessMissionId: "cmf-cbm-commerce-01",
  },
  evidenceSources: [
    {
      source: "supplier_evaluation_worker",
      claim: "Inventory linked to supplier evaluation sew-eval-bamboo-01",
      kind: "fact",
      relatedTopic: "supplier",
    },
  ],
  validated: true,
};

const lowStockInput = {
  ...sampleInput,
  approvedProduct: {
    ...sampleInput.approvedProduct,
    currentStock: 20,
    previousStock: 25,
  },
};

const outOfStockInput = {
  ...sampleInput,
  approvedProduct: {
    ...sampleInput.approvedProduct,
    currentStock: 0,
    previousStock: 40,
    supplierStockAvailable: 0,
    supplierAvailability: "unavailable",
  },
};

describe("Q3-10 Inventory Worker", () => {
  beforeEach(resetInventoryWorkerForTesting);

  test("1 locks mandatory inventory-worker boundaries", () => {
    const c = buildInventoryWorkerConfiguration(REPO_ROOT, {
      neverPurchaseInventory: false as never,
      neverModifySupplierStock: false as never,
      neverPlaceSupplierOrders: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ311OrLater: false as never,
      neverModifySupplierInventoryDirectly: false as never,
    });
    assert.equal(c.neverPurchaseInventory, true);
    assert.equal(c.neverModifySupplierStock, true);
    assert.equal(c.neverPlaceSupplierOrders, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ311OrLater, true);
    assert.equal(c.neverModifySupplierInventoryDirectly, true);
  });

  test("2 initializes PILLOW-INW-001 for Q3-10 with SEW + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-10");
    assert.equal(state.engineVersion, "PILLOW-INW-001");
    assert.equal(state.configuration.workerId, "wkr-inventory-01");
    for (const target of INW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const status of STOCK_STATUSES) {
      assert.ok(typeof status === "string");
    }
    assert.ok(INW_CAPABILITIES.includes("calculate_reorder_points"));
  });

  test("3 receives approved products", async () => {
    const engine = await build();
    const received = engine.receiveApprovedProducts(sampleInput);
    assert.equal(received.action, "receive_approved_products");
  });

  test("4 monitors stock quantities, lead times, and supplier availability", async () => {
    const engine = await build();
    const qty = engine.monitorInventoryQuantities(sampleInput);
    const lead = engine.monitorLeadTimes(sampleInput);
    const supplier = engine.monitorSupplierAvailability(sampleInput);
    assert.equal(qty.latestInventoryReport!.currentStock, 40);
    assert.equal(lead.latestInventoryReport!.leadTimeDays, 14);
    assert.ok(
      ["available", "limited", "unavailable", "unknown"].includes(
        supplier.latestInventoryReport!.supplierAvailability,
      ),
    );
  });

  test("5 calculates reorder points and detects low-stock conditions", async () => {
    const engine = await build();
    const reorder = engine.calculateReorderPoints(sampleInput);
    // reorderPoint = ceil(5*14 + 5*3) = ceil(70+15) = 85
    assert.equal(reorder.latestInventoryReport!.reorderPoint, 85);
    const low = engine.detectLowStockConditions(lowStockInput);
    assert.equal(low.latestInventoryReport!.stockStatus, "low_stock");
    assert.ok(low.latestInventoryReport!.inventoryAlerts.some((a) => a.code === "LOW_STOCK"));
  });

  test("6 detects out-of-stock and abnormal inventory changes", async () => {
    const engine = await build();
    const oos = engine.detectOutOfStockConditions(outOfStockInput);
    assert.equal(oos.latestInventoryReport!.stockStatus, "out_of_stock");
    assert.ok(oos.latestInventoryReport!.inventoryAlerts.some((a) => a.code === "OUT_OF_STOCK"));
    const abnormal = engine.detectAbnormalInventoryChanges(sampleInput);
    assert.equal(abnormal.latestInventoryReport!.abnormalChangeDetected, true);
    assert.ok(
      abnormal.latestInventoryReport!.inventoryAlerts.some((a) => a.code === "ABNORMAL_CHANGE"),
    );
  });

  test("7 generates inventory alerts and produces machine-readable Inventory Report", async () => {
    const report = (await build()).produceInventoryReport(sampleInput);
    const latest = report.latestInventoryReport!;
    assert.ok(latest.inventoryReportId.startsWith("inw-inv-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.productId, "prod-bamboo-desk-organizer");
    assert.equal(latest.supplierId, "sup-shenzhen-bamboo-co");
    assert.equal(latest.currentStock, 40);
    assert.ok(latest.stockStatus);
    assert.equal(latest.leadTimeDays, 14);
    assert.equal(latest.reorderPoint, 85);
    assert.ok(latest.supplierAvailability);
    assert.ok(latest.inventoryAlerts.length >= 1);
    assert.ok(latest.recommendedAction.length > 10);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, INW_METADATA_VERSION);
    assert.equal(latest.reportVersion, INVENTORY_REPORT_VERSION);
    assert.equal(latest.neverModifySupplierInventoryDirectly, true);
    assert.equal(latest.neverPurchaseInventory, true);
  });

  test("8 monitors supplier stock availability separately", async () => {
    const report = (await build()).monitorSupplierStockAvailability(sampleInput);
    assert.equal(report.action, "monitor_supplier_stock");
    assert.equal(report.latestInventoryReport!.supplierStockAvailable, 200);
  });

  test("9 rejects purchase / modify-stock / place-orders / override / Q3-11 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { purchaseInventory: true },
      { modifySupplierStock: true },
      { placeSupplierOrders: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ311OrLater: true },
      { modifySupplierInventory: true },
    ] as const) {
      const report = engine.produceInventoryReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestInventoryReport, null);
    }
  });

  test("10 submits findings through ERR and preserves audit / cockpit boundaries", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createInventoryWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-inw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectInventoryWorker();
    const produced = engine.produceInventoryReport(sampleInput);
    const submitted = engine.submitFindings({
      inventoryReportId: produced.latestInventoryReport!.inventoryReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q3-10"]);
    assert.equal(submitted.latestInventoryReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestInventoryReport!.executiveReportId, "ert-worker-inw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-10");
    assert.equal(cockpit.neverPurchaseInventory, true);
    assert.equal(cockpit.neverModifySupplierStock, true);
  });
});
