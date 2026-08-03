import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  RECOMMENDATIONS,
  SEW_CAPABILITIES,
  SEW_INTEGRATION_TARGETS,
  SEW_METADATA_VERSION,
  SUPPLIER_EVALUATION_REPORT_VERSION,
  buildSupplierEvaluationWorkerConfiguration,
  createSupplierEvaluationWorker,
  resetSupplierEvaluationWorkerForTesting,
} from "../../supplier-evaluation-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createSupplierEvaluationWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createSupplierEvaluationWorker(bootstrap, config);
  await engine.initialize();
  engine.connectSupplierEvaluationWorker();
  return engine;
}

const sampleSupplier = {
  discoveryId: "sdw-discovery-bamboo-01",
  productId: "prod-bamboo-desk-organizer",
  productName: "Bamboo Desk Organizer",
  supplierId: "sup-shenzhen-bamboo-co",
  supplierName: "Shenzhen Bamboo Co",
  supplierPlatform: "alibaba",
  productCost: 8,
  moq: 1,
  shippingAvailability: "worldwide warehouses US/EU",
  supplierLocation: "Shenzhen, China",
  sourceReference: "alibaba://supplier/shenzhen-bamboo-co",
  confidenceScore: 0.82,
  discoveryChannel: "supplier_api",
  businessMissionId: "cmf-cbm-commerce-01",
  fieldAvailability: {
    productCost: "available",
    moq: "available",
    shippingAvailability: "available",
    supplierLocation: "available",
  },
};

const sampleInput = {
  discoveredSupplier: sampleSupplier,
  yearsInBusiness: 6,
  refundPolicyDays: 30,
  onTimeDeliveryRate: 95,
  responseTimeHours: 4,
  defectRate: 0.01,
  evidenceSources: [
    {
      source: "supplier_discovery_worker",
      claim: "Traceable discovery for Shenzhen Bamboo Co",
      kind: "fact",
      relatedTopic: "traceability",
    },
    {
      source: "operator_estimate",
      claim: "Communication quality inferred from prior marketplace response patterns",
      kind: "assumption",
      relatedTopic: "communication",
    },
  ],
  validated: true,
};

describe("Q3-05 Supplier Evaluation Worker", () => {
  beforeEach(resetSupplierEvaluationWorkerForTesting);

  test("1 locks mandatory supplier-evaluation-worker boundaries", () => {
    const c = buildSupplierEvaluationWorkerConfiguration(REPO_ROOT, {
      neverDiscoverSuppliers: false as never,
      neverNegotiateSuppliers: false as never,
      neverPlaceSupplierOrders: false as never,
      neverModifySupplierInformation: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ306OrLater: false as never,
    });
    assert.equal(c.neverDiscoverSuppliers, true);
    assert.equal(c.neverNegotiateSuppliers, true);
    assert.equal(c.neverPlaceSupplierOrders, true);
    assert.equal(c.neverModifySupplierInformation, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ306OrLater, true);
  });

  test("2 initializes PILLOW-SEW-001 for Q3-05 with discovery + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-05");
    assert.equal(state.engineVersion, "PILLOW-SEW-001");
    assert.equal(state.configuration.workerId, "wkr-supplier-evaluation-01");
    for (const target of SEW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const recommendation of RECOMMENDATIONS) {
      assert.ok(state.configuration.recommendations.includes(recommendation));
    }
    assert.ok(SEW_CAPABILITIES.includes("evaluate_supplier_reliability"));
  });

  test("3 receives discovery reports and scores reliability / price / shipping", async () => {
    const engine = await build();
    const received = engine.receiveSupplierDiscoveryReports(sampleInput);
    assert.equal(received.action, "receive_discovery_reports");
    const reliability = engine.evaluateReliability(sampleInput);
    const pricing = engine.evaluatePricing(sampleInput);
    const shipping = engine.evaluateShipping(sampleInput);
    assert.ok(reliability.latestEvaluation!.reliabilityScore > 0);
    assert.ok(pricing.latestEvaluation!.priceScore > 0);
    assert.ok(shipping.latestEvaluation!.shippingScore > 0);
    assert.ok(["pass", "partial"].includes(reliability.validation.decision));
  });

  test("4 scores refund policy, fulfilment quality, communication, and risk", async () => {
    const engine = await build();
    const refund = engine.evaluateRefundPolicy(sampleInput);
    const fulfilment = engine.evaluateFulfilmentQuality(sampleInput);
    const communication = engine.evaluateCommunication(sampleInput);
    const risk = engine.evaluateRisk(sampleInput);
    assert.ok(refund.latestEvaluation!.refundPolicyScore > 0);
    assert.ok(fulfilment.latestEvaluation!.fulfilmentQualityScore > 0);
    assert.ok(communication.latestEvaluation!.communicationScore > 0);
    assert.ok(risk.latestEvaluation!.riskScore > 0);
  });

  test("5 generates overall score and Approve/Review/Reject recommendation", async () => {
    const engine = await build();
    const overall = engine.generateOverallScore(sampleInput);
    const recommend = engine.recommendAction(sampleInput);
    assert.ok(overall.latestEvaluation!.overallScore > 0);
    assert.ok(
      ["Approve", "Review", "Reject"].includes(recommend.latestEvaluation!.recommendation),
    );
    assert.equal(recommend.latestEvaluation!.recommendation, "Approve");
  });

  test("6 produces machine-readable Supplier Evaluation Report with required fields", async () => {
    const report = (await build()).produceSupplierEvaluationReport(sampleInput);
    const latest = report.latestEvaluation!;
    assert.ok(latest.evaluationId.startsWith("sew-eval-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.supplierId, "sup-shenzhen-bamboo-co");
    assert.equal(latest.supplierName, "Shenzhen Bamboo Co");
    assert.equal(latest.productId, "prod-bamboo-desk-organizer");
    assert.ok(latest.reliabilityScore >= 0);
    assert.ok(latest.priceScore >= 0);
    assert.ok(latest.shippingScore >= 0);
    assert.ok(latest.refundPolicyScore >= 0);
    assert.ok(latest.fulfilmentQualityScore >= 0);
    assert.ok(latest.communicationScore >= 0);
    assert.ok(latest.riskScore >= 0);
    assert.ok(latest.overallScore >= 0);
    assert.ok(latest.recommendation);
    assert.ok(latest.supportingEvidence.length >= 1);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, SEW_METADATA_VERSION);
    assert.equal(latest.reportVersion, SUPPLIER_EVALUATION_REPORT_VERSION);
    assert.equal(latest.discoveryId, "sdw-discovery-bamboo-01");
    assert.ok(latest.facts.length >= 1);
    assert.ok(latest.assumptions.length >= 1);
  });

  test("7 recommends Reject for weak high-risk suppliers", async () => {
    const report = (await build()).produceSupplierEvaluationReport({
      discoveredSupplier: {
        ...sampleSupplier,
        supplierName: "Unverified Dropship Shell",
        supplierId: "sup-dropship-shell",
        productCost: 55,
        moq: 500,
        shippingAvailability: "local only",
        sourceReference: null,
        confidenceScore: 0.2,
        discoveryChannel: "manual_hint",
        fieldAvailability: {
          productCost: "missing",
          moq: "available",
          shippingAvailability: "unavailable",
          supplierLocation: "unavailable",
        },
      },
      yearsInBusiness: 0,
      refundPolicyDays: 0,
      onTimeDeliveryRate: 40,
      responseTimeHours: 96,
      defectRate: 0.2,
      validated: true,
    });
    assert.equal(report.latestEvaluation!.recommendation, "Reject");
    assert.ok(report.latestEvaluation!.overallScore < 45);
  });

  test("8 rejects discover / negotiate / order / modify / override / Q3-06 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { discoverSuppliers: true },
      { negotiateSuppliers: true },
      { placeSupplierOrders: true },
      { modifySupplierInformation: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ306OrLater: true },
    ] as const) {
      const report = engine.produceSupplierEvaluationReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestEvaluation, null);
    }
  });

  test("9 submits findings through Executive Reporting Runtime integration surface", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createSupplierEvaluationWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-sew-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectSupplierEvaluationWorker();
    const produced = engine.produceSupplierEvaluationReport(sampleInput);
    const submitted = engine.submitFindings({
      evaluationId: produced.latestEvaluation!.evaluationId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q3-05"]);
    assert.equal(submitted.latestEvaluation!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestEvaluation!.executiveReportId, "ert-worker-sew-001");
  });

  test("10 preserves audit history and cockpit boundaries", async () => {
    const engine = await build();
    engine.produceSupplierEvaluationReport(sampleInput);
    const audit = engine.getAuditTrail();
    assert.ok(audit.length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-05");
    assert.equal(cockpit.neverDiscoverSuppliers, true);
    assert.equal(cockpit.neverPlaceSupplierOrders, true);
    assert.ok(cockpit.totalEvaluations >= 1);
  });
});
