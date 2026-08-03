import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  SDW_APPROVED_SUPPLIER_APIS,
  SDW_APPROVED_SUPPLIER_PLATFORMS,
  SDW_CAPABILITIES,
  SDW_INTEGRATION_TARGETS,
  SDW_METADATA_VERSION,
  SUPPLIER_DISCOVERY_REPORT_VERSION,
  buildSupplierDiscoveryWorkerConfiguration,
  createSupplierDiscoveryWorker,
  resetSupplierDiscoveryWorkerForTesting,
} from "../../supplier-discovery-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createSupplierDiscoveryWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createSupplierDiscoveryWorker(bootstrap, config);
  await engine.initialize();
  engine.connectSupplierDiscoveryWorker();
  return engine;
}

const sampleInput = {
  approvedProduct: {
    evaluationId: "pew-eval-bamboo-01",
    productId: "prod-bamboo-desk-organizer",
    productName: "Bamboo Desk Organizer",
    category: "home_goods",
    recommendation: "Proceed",
    overallScore: 78,
    discoveryId: "pdw-discovery-bamboo-01",
    businessMissionId: "cmf-cbm-commerce-01",
  },
  platformCandidates: [
    {
      supplierId: "sup-alibaba-bamboo-01",
      supplierName: "Shenzhen Bamboo Works",
      supplierPlatform: "alibaba",
      productCost: 7.5,
      moq: 50,
      shippingAvailability: "worldwide",
      supplierLocation: "Shenzhen, CN",
      sourceReference: "alibaba://product/bamboo-desk-organizer-01",
      productSku: "BBO-ORG-50",
    },
    {
      supplierId: "sup-cj-bamboo-02",
      supplierName: "CJ Home Goods Partner",
      supplierPlatform: "cjdropshipping",
      productCost: 8.2,
      moq: 1,
      shippingAvailability: "US/EU warehouses",
      supplierLocation: "unavailable",
      sourceReference: "cjdropshipping://catalog/bbo-org",
    },
  ],
  apiCandidates: [
    {
      supplierId: "sup-api-alibaba-03",
      supplierName: "Open API Bamboo Co",
      supplierPlatform: "alibaba",
      supplierApi: "alibaba_open_api",
      productCost: 7.1,
      moq: 100,
      shippingAvailability: "FOB Shenzhen",
      supplierLocation: "Guangdong, CN",
      sourceReference: "api://alibaba_open_api/products/bbo-01",
      productSku: "API-BBO-100",
    },
  ],
  validated: true,
};

describe("Q3-04 Supplier Discovery Worker", () => {
  beforeEach(resetSupplierDiscoveryWorkerForTesting);

  test("1 locks mandatory supplier-discovery-worker boundaries", () => {
    const c = buildSupplierDiscoveryWorkerConfiguration(REPO_ROOT, {
      neverEvaluateSuppliers: false as never,
      neverNegotiateSuppliers: false as never,
      neverSelectSuppliers: false as never,
      neverPlaceOrders: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ305OrLater: false as never,
      neverModifySupplierData: false as never,
    });
    assert.equal(c.neverEvaluateSuppliers, true);
    assert.equal(c.neverNegotiateSuppliers, true);
    assert.equal(c.neverSelectSuppliers, true);
    assert.equal(c.neverPlaceOrders, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ305OrLater, true);
    assert.equal(c.neverModifySupplierData, true);
  });

  test("2 initializes PILLOW-SDW-001 for Q3-04 with evaluation + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-04");
    assert.equal(state.engineVersion, "PILLOW-SDW-001");
    assert.equal(state.configuration.workerId, "wkr-supplier-discovery-01");
    for (const target of SDW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const platform of SDW_APPROVED_SUPPLIER_PLATFORMS) {
      assert.ok(state.configuration.approvedSupplierPlatforms.includes(platform));
    }
    for (const api of SDW_APPROVED_SUPPLIER_APIS) {
      assert.ok(state.configuration.approvedSupplierApis.includes(api));
    }
    assert.ok(SDW_CAPABILITIES.includes("search_approved_supplier_platforms"));
  });

  test("3 receives approved products and searches approved supplier platforms", async () => {
    const engine = await build();
    const received = engine.receiveApprovedProducts(sampleInput);
    assert.equal(received.action, "receive_approved_products");
    const platforms = engine.searchApprovedSupplierPlatforms(sampleInput);
    assert.equal(platforms.action, "search_platforms");
    assert.ok(platforms.discoveries.length >= 2);
    assert.ok(platforms.discoveries.every((d) => d.discoveryChannel === "supplier_platform"));
    assert.ok(platforms.discoveries.some((d) => d.supplierPlatform === "alibaba"));
    assert.ok(
      platforms.validation.decision === "pass" ||
        platforms.validation.decision === "partial",
    );
  });

  test("4 searches integrated supplier APIs", async () => {
    const report = (await build()).searchIntegratedSupplierApis(sampleInput);
    assert.equal(report.action, "search_apis");
    assert.ok(report.discoveries.length >= 1);
    assert.ok(report.discoveries.every((d) => d.discoveryChannel === "supplier_api"));
    assert.equal(report.discoveries[0]!.supplierApi, "alibaba_open_api");
  });

  test("5 discovers multiple supplier candidates with product / pricing / MOQ / shipping / location", async () => {
    const report = (await build()).discoverSupplierCandidates(sampleInput);
    assert.equal(report.action, "discover_candidates");
    assert.ok(report.discoveries.length >= 3);
    const withCost = report.discoveries.find((d) => d.productCost != null)!;
    assert.ok(withCost.productCost! > 0);
    assert.ok(withCost.moq != null);
    assert.ok(withCost.shippingAvailability);
    assert.ok(withCost.supplierLocation);
    assert.ok(withCost.sourceReference);
  });

  test("6 captures fields and distinguishes unavailable from missing information", async () => {
    const engine = await build();
    const report = engine.captureShippingAvailability(sampleInput);
    const cj = report.discoveries.find((d) => d.supplierId === "sup-cj-bamboo-02");
    assert.ok(cj);
    assert.equal(cj!.fieldAvailability.supplierLocation, "unavailable");
    const complete = report.discoveries.find((d) => d.supplierId === "sup-alibaba-bamboo-01")!;
    assert.equal(complete.fieldAvailability.productCost, "available");
    assert.equal(complete.fieldAvailability.moq, "available");
  });

  test("7 produces machine-readable Supplier Discovery Report with required fields", async () => {
    const report = (await build()).produceSupplierDiscoveryReport(sampleInput);
    const latest = report.latestDiscovery!;
    assert.ok(latest.discoveryId.startsWith("sdw-discovery-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.productId, "prod-bamboo-desk-organizer");
    assert.equal(latest.productName, "Bamboo Desk Organizer");
    assert.ok(latest.supplierId);
    assert.ok(latest.supplierName);
    assert.ok(latest.supplierPlatform);
    assert.ok(latest.sourceReference);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, SDW_METADATA_VERSION);
    assert.equal(latest.reportVersion, SUPPLIER_DISCOVERY_REPORT_VERSION);
    assert.equal(latest.evaluationId, "pew-eval-bamboo-01");
    assert.equal(report.catalog!.reportVersion, SUPPLIER_DISCOVERY_REPORT_VERSION);
  });

  test("8 rejects evaluate / negotiate / select / order / modify / override / Q3-05 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { evaluateSuppliers: true },
      { negotiateSuppliers: true },
      { selectSuppliers: true },
      { placeOrders: true },
      { modifySupplierData: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ305OrLater: true },
    ] as const) {
      const report = engine.produceSupplierDiscoveryReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestDiscovery, null);
    }
  });

  test("9 submits findings through Executive Reporting Runtime integration surface", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createSupplierDiscoveryWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-sdw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectSupplierDiscoveryWorker();
    const produced = engine.produceSupplierDiscoveryReport(sampleInput);
    const submitted = engine.submitFindings({
      discoveryId: produced.latestDiscovery!.discoveryId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q3-04"]);
    assert.equal(submitted.latestDiscovery!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestDiscovery!.executiveReportId, "ert-worker-sdw-001");
  });

  test("10 preserves audit history, source references, and cockpit boundaries", async () => {
    const engine = await build();
    engine.produceSupplierDiscoveryReport(sampleInput);
    const audit = engine.getAuditTrail();
    assert.ok(audit.length >= 1);
    const discoveries = engine.getDiscoveries();
    assert.ok(discoveries.every((d) => d.sourceReference.length > 0));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-04");
    assert.equal(cockpit.neverEvaluateSuppliers, true);
    assert.equal(cockpit.neverPlaceOrders, true);
    assert.ok(cockpit.totalDiscoveries >= 1);
  });
});
