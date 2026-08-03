import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  RECOMMENDATIONS,
  SNW_CAPABILITIES,
  SNW_INTEGRATION_TARGETS,
  SNW_METADATA_VERSION,
  SUPPLIER_NEGOTIATION_REPORT_VERSION,
  buildSupplierNegotiationWorkerConfiguration,
  createSupplierNegotiationWorker,
  resetSupplierNegotiationWorkerForTesting,
} from "../../supplier-negotiation-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createSupplierNegotiationWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createSupplierNegotiationWorker(bootstrap, config);
  await engine.initialize();
  engine.connectSupplierNegotiationWorker();
  return engine;
}

const strongSupplier = {
  evaluationId: "sew-eval-bamboo-01",
  discoveryId: "sdw-discovery-bamboo-01",
  supplierId: "sup-shenzhen-bamboo-co",
  supplierName: "Shenzhen Bamboo Co",
  productId: "prod-bamboo-desk-organizer",
  productName: "Bamboo Desk Organizer",
  reliabilityScore: 92,
  priceScore: 85,
  shippingScore: 88,
  refundPolicyScore: 90,
  fulfilmentQualityScore: 94,
  communicationScore: 90,
  riskScore: 80,
  overallScore: 88.5,
  recommendation: "Approve",
  confidenceScore: 0.84,
  businessMissionId: "cmf-cbm-commerce-01",
  productCost: 8,
  moq: 50,
  shippingAvailability: "worldwide warehouses US/EU",
  supplierLocation: "Shenzhen, China",
  supplierPlatform: "alibaba",
};

const alternateSupplier = {
  evaluationId: "sew-eval-bamboo-02",
  discoveryId: "sdw-discovery-bamboo-02",
  supplierId: "sup-guangzhou-woodworks",
  supplierName: "Guangzhou Woodworks",
  productId: "prod-bamboo-desk-organizer",
  productName: "Bamboo Desk Organizer",
  reliabilityScore: 70,
  priceScore: 78,
  shippingScore: 65,
  refundPolicyScore: 60,
  fulfilmentQualityScore: 72,
  communicationScore: 68,
  riskScore: 62,
  overallScore: 69.5,
  recommendation: "Review",
  confidenceScore: 0.7,
  productCost: 9.5,
  moq: 100,
  shippingAvailability: "FOB Shenzhen",
};

const sampleInput = {
  evaluatedSuppliers: [strongSupplier, alternateSupplier],
  targetMoq: 20,
  targetUnitPrice: 7.2,
  preferredShippingTerms: "FOB with optional DDP for US/EU pilot",
  evidenceSources: [
    {
      source: "supplier_evaluation_worker",
      claim: "Both candidates scored from Supplier Evaluation Reports",
      kind: "fact",
      relatedTopic: "traceability",
    },
    {
      source: "operator_estimate",
      claim: "Volume leverage may unlock MOQ reduction",
      kind: "assumption",
      relatedTopic: "moq",
    },
  ],
  validated: true,
};

describe("Q3-06 Supplier Negotiation Worker", () => {
  beforeEach(resetSupplierNegotiationWorkerForTesting);

  test("1 locks mandatory supplier-negotiation-worker boundaries", () => {
    const c = buildSupplierNegotiationWorkerConfiguration(REPO_ROOT, {
      neverContactSuppliers: false as never,
      neverCommitAgreements: false as never,
      neverPlaceOrders: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ307OrLater: false as never,
    });
    assert.equal(c.neverContactSuppliers, true);
    assert.equal(c.neverCommitAgreements, true);
    assert.equal(c.neverPlaceOrders, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ307OrLater, true);
  });

  test("2 initializes PILLOW-SNW-001 for Q3-06 with evaluation + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-06");
    assert.equal(state.engineVersion, "PILLOW-SNW-001");
    assert.equal(state.configuration.workerId, "wkr-supplier-negotiation-01");
    for (const target of SNW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const recommendation of RECOMMENDATIONS) {
      assert.ok(state.configuration.recommendations.includes(recommendation));
    }
    assert.ok(SNW_CAPABILITIES.includes("compare_multiple_suppliers"));
  });

  test("3 receives evaluation reports and compares suppliers", async () => {
    const engine = await build();
    const received = engine.receiveSupplierEvaluationReports(sampleInput);
    assert.equal(received.action, "receive_evaluation_reports");
    const compared = engine.compareSuppliers(sampleInput);
    assert.ok(compared.latestNegotiation!.candidateSuppliers.length >= 2);
    assert.ok(compared.latestNegotiation!.comparisonSummary.includes("Compared"));
    assert.ok(["pass", "partial"].includes(compared.validation.decision));
  });

  test("4 identifies negotiation opportunities and prepares MOQ / shipping terms", async () => {
    const engine = await build();
    const opportunities = engine.identifyNegotiationOpportunities(sampleInput);
    const moq = engine.prepareMoqQuestions(sampleInput);
    const shipping = engine.prepareShippingTerms(sampleInput);
    assert.ok(opportunities.latestNegotiation!.negotiationOpportunities.length >= 1);
    assert.ok(moq.latestNegotiation!.moqNegotiation.questions.length >= 1);
    assert.ok(shipping.latestNegotiation!.shippingNegotiation.questions.length >= 1);
  });

  test("5 prepares pricing, fulfilment, refund questions and draft message", async () => {
    const engine = await build();
    const pricing = engine.preparePricingQuestions(sampleInput);
    const fulfilment = engine.prepareFulfilmentQuestions(sampleInput);
    const refund = engine.prepareRefundQuestions(sampleInput);
    const draft = engine.prepareDraftNegotiationMessage(sampleInput);
    assert.ok(pricing.latestNegotiation!.priceNegotiation.questions.length >= 1);
    assert.ok(fulfilment.latestNegotiation!.fulfilmentQuestions.questions.length >= 1);
    assert.ok(refund.latestNegotiation!.refundQuestions.questions.length >= 1);
    assert.ok(draft.latestNegotiation!.draftNegotiationMessage.includes("has not been sent"));
  });

  test("6 recommends preferred supplier Prefer/Review/Defer", async () => {
    const engine = await build();
    const recommend = engine.recommendPreferredSupplier(sampleInput);
    assert.ok(
      ["Prefer", "Review", "Defer"].includes(recommend.latestNegotiation!.recommendation),
    );
    assert.equal(recommend.latestNegotiation!.recommendation, "Prefer");
    assert.equal(
      recommend.latestNegotiation!.preferredSupplier?.supplierId,
      "sup-shenzhen-bamboo-co",
    );
  });

  test("7 produces machine-readable Supplier Negotiation Report with required fields", async () => {
    const report = (await build()).produceSupplierNegotiationReport(sampleInput);
    const latest = report.latestNegotiation!;
    assert.ok(latest.negotiationId.startsWith("snw-neg-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.productId, "prod-bamboo-desk-organizer");
    assert.ok(latest.candidateSuppliers.length >= 2);
    assert.ok(latest.preferredSupplier);
    assert.ok(latest.comparisonSummary);
    assert.ok(latest.moqNegotiation.questions.length >= 1);
    assert.ok(latest.priceNegotiation.questions.length >= 1);
    assert.ok(latest.shippingNegotiation.questions.length >= 1);
    assert.ok(latest.fulfilmentQuestions.questions.length >= 1);
    assert.ok(latest.refundQuestions.questions.length >= 1);
    assert.ok(latest.draftNegotiationMessage.includes("not transmitted"));
    assert.ok(latest.recommendation);
    assert.ok(latest.supportingEvidence.length >= 1);
    assert.equal(latest.metadataVersion, SNW_METADATA_VERSION);
    assert.equal(latest.reportVersion, SUPPLIER_NEGOTIATION_REPORT_VERSION);
    assert.ok(latest.evaluationIds.includes("sew-eval-bamboo-01"));
  });

  test("8 recommends Defer for weak evaluated suppliers", async () => {
    const report = (await build()).produceSupplierNegotiationReport({
      evaluatedSupplier: {
        evaluationId: "sew-eval-weak-01",
        supplierId: "sup-weak-shell",
        supplierName: "Weak Shell Trading",
        productId: "prod-weak",
        productName: "Weak Product",
        overallScore: 30,
        recommendation: "Reject",
        reliabilityScore: 20,
        priceScore: 25,
        shippingScore: 20,
        refundPolicyScore: 15,
        fulfilmentQualityScore: 18,
        communicationScore: 20,
        riskScore: 15,
        moq: 1000,
        productCost: 60,
      },
      validated: true,
    });
    assert.equal(report.latestNegotiation!.recommendation, "Defer");
  });

  test("9 rejects contact / commit / order / override / Q3-07 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { contactSuppliers: true },
      { commitAgreements: true },
      { placeOrders: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ307OrLater: true },
    ] as const) {
      const report = engine.produceSupplierNegotiationReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestNegotiation, null);
    }
  });

  test("10 submits findings through ERR and preserves audit / cockpit boundaries", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createSupplierNegotiationWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-snw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectSupplierNegotiationWorker();
    const produced = engine.produceSupplierNegotiationReport(sampleInput);
    const submitted = engine.submitFindings({
      negotiationId: produced.latestNegotiation!.negotiationId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q3-06"]);
    assert.equal(submitted.latestNegotiation!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestNegotiation!.executiveReportId, "ert-worker-snw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-06");
    assert.equal(cockpit.neverContactSuppliers, true);
    assert.equal(cockpit.neverPlaceOrders, true);
  });
});
