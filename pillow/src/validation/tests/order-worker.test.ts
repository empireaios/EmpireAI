import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ORDER_STATUSES,
  ORW_CAPABILITIES,
  ORW_INTEGRATION_TARGETS,
  ORW_METADATA_VERSION,
  ORDER_REPORT_VERSION,
  buildOrderWorkerConfiguration,
  createOrderWorker,
  resetOrderWorkerForTesting,
} from "../../order-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createOrderWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createOrderWorker(bootstrap, config);
  await engine.initialize();
  engine.connectOrderWorker();
  return engine;
}

const sampleInput = {
  confirmedOrder: {
    orderId: "ord-bamboo-001",
    customerId: "cust-empire-42",
    productId: "prod-bamboo-desk-organizer",
    productName: "Bamboo Desk Organizer",
    supplierId: "sup-shenzhen-bamboo-co",
    supplierName: "Shenzhen Bamboo Co",
    quantity: 2,
    fulfilmentStatus: "in_progress",
    shippingStatus: "preparing",
    orderReceivedAt: new Date().toISOString(),
    inventoryReportId: "inw-inv-bamboo-01",
    evaluationId: "sew-eval-bamboo-01",
    discoveryId: "sdw-discovery-bamboo-01",
    businessMissionId: "cmf-cbm-commerce-01",
  },
  evidenceSources: [
    {
      source: "inventory_worker",
      claim: "Order linked to Inventory Report inw-inv-bamboo-01",
      kind: "fact",
      relatedTopic: "inventory",
    },
  ],
  validated: true,
};

const delayedInput = {
  ...sampleInput,
  confirmedOrder: {
    ...sampleInput.confirmedOrder,
    fulfilmentStatus: "awaiting_supplier",
    shippingStatus: "not_shipped",
    orderReceivedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    delayDaysThreshold: 7,
  },
};

const failedInput = {
  ...sampleInput,
  confirmedOrder: {
    ...sampleInput.confirmedOrder,
    fulfilmentStatus: "failed",
    shippingStatus: "failed",
  },
};

describe("Q3-11 Order Worker", () => {
  beforeEach(resetOrderWorkerForTesting);

  test("1 locks mandatory order-worker boundaries", () => {
    const c = buildOrderWorkerConfiguration(REPO_ROOT, {
      neverProcessPayments: false as never,
      neverIssueRefunds: false as never,
      neverModifyInventoryDirectly: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ312OrLater: false as never,
      neverAlterFinancialRecords: false as never,
    });
    assert.equal(c.neverProcessPayments, true);
    assert.equal(c.neverIssueRefunds, true);
    assert.equal(c.neverModifyInventoryDirectly, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ312OrLater, true);
    assert.equal(c.neverAlterFinancialRecords, true);
  });

  test("2 initializes PILLOW-ORW-001 for Q3-11 with inventory + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-11");
    assert.equal(state.engineVersion, "PILLOW-ORW-001");
    assert.equal(state.configuration.workerId, "wkr-order-01");
    for (const target of ORW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const status of ORDER_STATUSES) {
      assert.ok(typeof status === "string");
    }
    assert.ok(ORW_CAPABILITIES.includes("route_orders_to_supplier"));
  });

  test("3 receives confirmed customer orders", async () => {
    const engine = await build();
    const received = engine.receiveConfirmedCustomerOrders(sampleInput);
    assert.equal(received.action, "receive_confirmed_orders");
  });

  test("4 routes orders to supplier and tracks fulfilment", async () => {
    const engine = await build();
    const routed = engine.routeOrdersToSupplier(sampleInput);
    const fulfilment = engine.trackFulfilmentStatus(sampleInput);
    assert.equal(routed.latestOrderReport!.routedSupplierId, "sup-shenzhen-bamboo-co");
    assert.ok(routed.latestOrderReport!.routingRationale.length > 10);
    assert.equal(fulfilment.latestOrderReport!.fulfilmentStatus, "in_progress");
  });

  test("5 tracks shipment and generates customer updates", async () => {
    const engine = await build();
    const shipment = engine.trackShipmentStatus(sampleInput);
    const updates = engine.generateCustomerStatusUpdates(sampleInput);
    assert.equal(shipment.latestOrderReport!.shippingStatus, "preparing");
    assert.ok(updates.latestOrderReport!.customerUpdates.length >= 1);
    assert.ok(updates.latestOrderReport!.customerUpdates[0]!.message.length > 10);
  });

  test("6 detects delayed orders and failed fulfilment", async () => {
    const engine = await build();
    const delayed = engine.detectDelayedOrders(delayedInput);
    assert.equal(delayed.latestOrderReport!.delayed, true);
    assert.ok(delayed.latestOrderReport!.exceptions.some((e) => e.code === "DELAYED_ORDER"));
    const failed = engine.detectFailedFulfilment(failedInput);
    assert.equal(failed.latestOrderReport!.failedFulfilment, true);
    assert.ok(failed.latestOrderReport!.exceptions.some((e) => e.code === "FULFILMENT_FAILED"));
  });

  test("7 detects exceptions, escalates critical issues, and maintains history", async () => {
    const engine = await build();
    const exceptions = engine.detectFulfilmentExceptions(failedInput);
    const escalated = engine.escalateCriticalOrderIssues(failedInput);
    const history = engine.maintainCompleteOrderHistory(sampleInput);
    assert.ok(exceptions.latestOrderReport!.exceptions.length >= 1);
    assert.ok(escalated.latestOrderReport!.escalations.some((e) => e.target === "pillow"));
    assert.ok(history.latestOrderReport!.orderHistory.length >= 1);
    assert.ok(history.latestOrderReport!.fulfilmentHistory.length >= 1);
  });

  test("8 produces machine-readable Order Report with required fields", async () => {
    const report = (await build()).produceOrderReport(sampleInput);
    const latest = report.latestOrderReport!;
    assert.ok(latest.orderReportId.startsWith("orw-ord-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.orderId, "ord-bamboo-001");
    assert.equal(latest.customerId, "cust-empire-42");
    assert.equal(latest.productId, "prod-bamboo-desk-organizer");
    assert.equal(latest.supplierId, "sup-shenzhen-bamboo-co");
    assert.ok(latest.orderStatus);
    assert.ok(latest.fulfilmentStatus);
    assert.ok(latest.shippingStatus);
    assert.ok(Array.isArray(latest.exceptions));
    assert.ok(latest.customerUpdates.length >= 1);
    assert.ok(latest.recommendedAction.length > 10);
    assert.equal(latest.metadataVersion, ORW_METADATA_VERSION);
    assert.equal(latest.reportVersion, ORDER_REPORT_VERSION);
    assert.equal(latest.neverProcessPayments, true);
    assert.equal(latest.neverAlterFinancialRecords, true);
  });

  test("9 rejects payments / refunds / inventory / override / Q3-12 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { processPayments: true },
      { issueRefunds: true },
      { modifyInventory: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ312OrLater: true },
      { alterFinancialRecords: true },
    ] as const) {
      const report = engine.produceOrderReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestOrderReport, null);
    }
  });

  test("10 submits findings through ERR and preserves audit / cockpit boundaries", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createOrderWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-orw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectOrderWorker();
    const produced = engine.produceOrderReport(sampleInput);
    const submitted = engine.submitFindings({
      orderReportId: produced.latestOrderReport!.orderReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q3-11"]);
    assert.equal(submitted.latestOrderReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestOrderReport!.executiveReportId, "ert-worker-orw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-11");
    assert.equal(cockpit.neverProcessPayments, true);
    assert.equal(cockpit.neverModifyInventoryDirectly, true);
  });
});
