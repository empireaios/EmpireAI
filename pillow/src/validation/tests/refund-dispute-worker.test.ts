import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CASE_TYPES,
  RDW_CAPABILITIES,
  RDW_INTEGRATION_TARGETS,
  RDW_METADATA_VERSION,
  REFUND_DISPUTE_REPORT_VERSION,
  buildRefundDisputeWorkerConfiguration,
  createRefundDisputeWorker,
  resetRefundDisputeWorkerForTesting,
} from "../../refund-dispute-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createRefundDisputeWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createRefundDisputeWorker(bootstrap, config);
  await engine.initialize();
  engine.connectRefundDisputeWorker();
  return engine;
}

const refundInput = {
  caseRequest: {
    orderId: "ord-bamboo-001",
    customerId: "cust-empire-42",
    productId: "prod-bamboo-desk-organizer",
    productName: "Bamboo Desk Organizer",
    supplierId: "sup-shenzhen-bamboo-co",
    supplierName: "Shenzhen Bamboo Co",
    caseType: "refund",
    reason: "Item arrived damaged — customer requests refund under policy",
    requestedAmount: 43.8,
    orderReportId: "orw-ord-bamboo-01",
    evaluationId: "sew-eval-bamboo-01",
    discoveryId: "sdw-discovery-bamboo-01",
    businessMissionId: "cmf-cbm-commerce-01",
  },
  evidenceSources: [
    {
      source: "order_worker",
      claim: "Case linked to Order Report orw-ord-bamboo-01",
      kind: "fact",
      relatedTopic: "order",
    },
  ],
  validated: true,
};

const returnInput = {
  ...refundInput,
  caseRequest: {
    ...refundInput.caseRequest,
    caseType: "return",
    reason: "Customer requests return within window",
    requestedAmount: null,
    requireSupplierCoordination: true,
  },
};

const disputeInput = {
  ...refundInput,
  caseRequest: {
    ...refundInput.caseRequest,
    caseType: "customer_dispute",
    reason: "Customer disputes fulfilment quality",
    requestedAmount: 120,
  },
};

describe("Q3-12 Refund & Dispute Worker", () => {
  beforeEach(resetRefundDisputeWorkerForTesting);

  test("1 locks mandatory refund-dispute-worker boundaries", () => {
    const c = buildRefundDisputeWorkerConfiguration(REPO_ROOT, {
      neverModifyFinancialLedgersDirectly: false as never,
      neverOverrideMarketplacePolicies: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ313OrLater: false as never,
      neverAuthorizeOutsideAuthorityMatrix: false as never,
    });
    assert.equal(c.neverModifyFinancialLedgersDirectly, true);
    assert.equal(c.neverOverrideMarketplacePolicies, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ313OrLater, true);
    assert.equal(c.neverAuthorizeOutsideAuthorityMatrix, true);
  });

  test("2 initializes PILLOW-RDW-001 for Q3-12 with order + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-12");
    assert.equal(state.engineVersion, "PILLOW-RDW-001");
    assert.equal(state.configuration.workerId, "wkr-refund-dispute-01");
    for (const target of RDW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const type of CASE_TYPES) {
      assert.ok(typeof type === "string");
    }
    assert.ok(RDW_CAPABILITIES.includes("validate_requests_against_policies"));
  });

  test("3 receives refund requests and classifies case type", async () => {
    const engine = await build();
    const received = engine.receiveRefundRequests(refundInput);
    const classified = engine.classifyCaseTypes(refundInput);
    assert.equal(received.action, "receive_refund_request");
    assert.equal(classified.latestCase!.caseType, "refund");
  });

  test("4 receives return requests and validates against policies", async () => {
    const engine = await build();
    const received = engine.receiveReturnRequests(returnInput);
    const validated = engine.validateRequestsAgainstPolicies(returnInput);
    assert.equal(received.action, "receive_return_request");
    assert.ok(validated.latestCase!.policyEvaluation.policyId);
    assert.ok(
      ["allow", "deny", "escalate", "review"].includes(
        validated.latestCase!.policyEvaluation.decision,
      ),
    );
  });

  test("5 handles customer disputes and escalates beyond authority when required", async () => {
    const engine = await build();
    const dispute = engine.receiveCustomerDisputes(disputeInput);
    const escalated = engine.escalateExceptionalCases(disputeInput);
    assert.equal(dispute.action, "receive_customer_dispute");
    assert.ok(
      escalated.latestCase!.escalationStatus === "escalated_to_pillow" ||
        escalated.latestCase!.escalations.some((e) => e.target === "pillow") ||
        escalated.latestCase!.policyEvaluation.decision === "escalate",
    );
  });

  test("6 tracks case status, coordinates suppliers, and generates communications", async () => {
    const engine = await build();
    const tracked = engine.trackCaseStatus(returnInput);
    const coordinated = engine.coordinateWithSuppliers(returnInput);
    const communications = engine.generateCustomerCommunications(refundInput);
    assert.ok(tracked.latestCase!.currentStatus);
    assert.ok(coordinated.latestCase!.supplierCoordination.length >= 1);
    assert.ok(communications.latestCase!.customerCommunications.length >= 1);
    assert.ok(communications.latestCase!.customerCommunications[0]!.message.length > 10);
  });

  test("7 records final case outcomes", async () => {
    const engine = await build();
    const recorded = engine.recordFinalCaseOutcomes({
      ...refundInput,
      resolutionOutcome: "Refund workflow approved within delegated authority — ledger update deferred to authorized financial systems",
      validated: true,
    });
    assert.ok(recorded.latestCase!.resolution.summary.length > 10);
    assert.ok(recorded.latestCase!.resolution.outcome);
  });

  test("8 produces machine-readable Refund & Dispute Report with required fields", async () => {
    const report = (await build()).produceRefundDisputeReport(refundInput);
    const latest = report.latestCase!;
    assert.ok(latest.caseId.startsWith("rdw-case-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.orderId, "ord-bamboo-001");
    assert.equal(latest.customerId, "cust-empire-42");
    assert.equal(latest.supplierId, "sup-shenzhen-bamboo-co");
    assert.equal(latest.caseType, "refund");
    assert.ok(latest.reason.length > 5);
    assert.ok(latest.policyEvaluation.decision);
    assert.ok(latest.currentStatus);
    assert.ok(latest.actionsTaken.length >= 1);
    assert.ok(latest.customerCommunications.length >= 1);
    assert.ok(latest.resolution);
    assert.ok(latest.escalationStatus);
    assert.equal(latest.metadataVersion, RDW_METADATA_VERSION);
    assert.equal(latest.reportVersion, REFUND_DISPUTE_REPORT_VERSION);
    assert.equal(latest.neverModifyFinancialLedgersDirectly, true);
    assert.equal(latest.neverAuthorizeOutsideAuthorityMatrix, true);
  });

  test("9 rejects ledger / marketplace-override / authority / Pillow / Q3-13 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { modifyFinancialLedgers: true },
      { overrideMarketplacePolicies: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ313OrLater: true },
      { authorizeOutsideAuthorityMatrix: true },
    ] as const) {
      const report = engine.produceRefundDisputeReport({
        ...refundInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestCase, null);
    }
  });

  test("10 submits findings through ERR and preserves audit / cockpit boundaries", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createRefundDisputeWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-rdw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectRefundDisputeWorker();
    const produced = engine.produceRefundDisputeReport(refundInput);
    const submitted = engine.submitFindings({
      caseId: produced.latestCase!.caseId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q3-12"]);
    assert.equal(submitted.latestCase!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestCase!.executiveReportId, "ert-worker-rdw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-12");
    assert.equal(cockpit.neverModifyFinancialLedgersDirectly, true);
    assert.equal(cockpit.neverAuthorizeOutsideAuthorityMatrix, true);
  });
});
