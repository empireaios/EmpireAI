import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CKW_CAPABILITIES,
  CKW_CHECKOUT_FLOW_TYPES,
  CKW_INTEGRATION_TARGETS,
  CKW_METADATA_VERSION,
  CKW_PAYMENT_PROVIDERS,
  CHECKOUT_WORKER_REPORT_VERSION,
  buildCheckoutWorkerConfiguration,
  createCheckoutWorker,
  resetCheckoutWorkerForTesting,
} from "../../checkout-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(options?: Parameters<typeof createCheckoutWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCheckoutWorker(bootstrap, options);
  await engine.initialize();
  engine.connect();
  return engine;
}

const productInput = {
  researchReportId: "dpr-rsh-001",
  opportunityId: "dpr-opp-001",
  businessId: "dbiz-checkout-01",
  factoryMissionId: "dpf-dpm-checkout-01",
  salesPageId: "spw-spg-001",
  productTitle: "Freelancer Client Onboarding Toolkit",
  productType: "one_time_purchase" as const,
  checkoutFlowType: "one_time_purchase" as const,
  currency: "USD",
  validated: true,
};

const fullInput = {
  ...productInput,
  validated: true,
};

describe("Q5-09 Checkout Worker", () => {
  beforeEach(resetCheckoutWorkerForTesting);

  test("1 locks mandatory checkout-worker boundaries", () => {
    const c = buildCheckoutWorkerConfiguration(REPO_ROOT, {
      neverChargeCustomers: false as never,
      neverExecutePaymentTransactions: false as never,
      neverDeliverProducts: false as never,
      neverPublishStorefronts: false as never,
      neverStoreSensitivePaymentCredentials: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ510OrLater: false as never,
      followApprovedProductInformation: false as never,
    });
    assert.equal(c.neverChargeCustomers, true);
    assert.equal(c.neverExecutePaymentTransactions, true);
    assert.equal(c.neverDeliverProducts, true);
    assert.equal(c.neverPublishStorefronts, true);
    assert.equal(c.neverStoreSensitivePaymentCredentials, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ510OrLater, true);
    assert.equal(c.followApprovedProductInformation, true);
  });

  test("2 initializes PILLOW-CKW-001 for Q5-09 with DPF + Sales Page Worker integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q5-09");
    assert.equal(state.engineVersion, "PILLOW-CKW-001");
    assert.equal(state.configuration.workerId, "wkr-checkout-01");
    for (const target of CKW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(state.configuration.integrationTargets.includes("digital_products_factory_core"));
    assert.ok(state.configuration.integrationTargets.includes("sales_page_worker"));
    for (const flow of CKW_CHECKOUT_FLOW_TYPES) {
      assert.ok(state.configuration.supportedCheckoutFlows.includes(flow));
    }
    for (const provider of CKW_PAYMENT_PROVIDERS) {
      assert.ok(state.configuration.supportedPaymentProviders.includes(provider));
    }
    assert.ok(CKW_CAPABILITIES.includes("receive_approved_digital_product_information"));
    assert.ok(CKW_CAPABILITIES.includes("produce_machine_readable_checkout_reports"));
  });

  test("3 receives approved digital product information", async () => {
    const report = (await build()).receiveApprovedDigitalProductInformation(productInput);
    assert.equal(report.action, "receive_approved_digital_product_information");
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.latestCheckout!.researchReportId, "dpr-rsh-001");
    assert.equal(report.latestCheckout!.opportunityId, "dpr-opp-001");
    assert.ok(report.latestCheckout!.checkoutId.startsWith("ckw-chk-"));
  });

  test("4 generates checkout workflow and payment provider configuration", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    const workflow = engine.generateCheckoutWorkflow(fullInput);
    assert.equal(workflow.action, "generate_checkout_workflow");
    assert.ok(workflow.latestCheckout!.checkoutFlow);
    assert.ok(workflow.latestCheckout!.checkoutFlowSteps.length >= 1);

    const payment = engine.preparePaymentProviderConfiguration(fullInput);
    assert.equal(payment.action, "prepare_payment_provider_configuration");
    const paymentConfig = payment.latestCheckout!.paymentProviderConfiguration!;
    assert.ok(paymentConfig);
    assert.equal(paymentConfig.apiKeyPresent, false);
    assert.equal(paymentConfig.secretsPresent, false);
    assert.equal(/sk_live|pk_live|card_number/i.test(JSON.stringify(paymentConfig)), false);
  });

  test("5 generates order summary, confirmation workflow, and provider abstraction", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateCheckoutWorkflow(fullInput);
    engine.preparePaymentProviderConfiguration(fullInput);

    const order = engine.generateOrderSummary(fullInput);
    assert.equal(order.action, "generate_order_summary");
    assert.ok(order.latestCheckout!.orderSummary);
    assert.ok(order.latestCheckout!.orderSummary!.lineItems.length >= 1);

    const confirmation = engine.generateCustomerConfirmationWorkflow(fullInput);
    assert.equal(confirmation.action, "generate_customer_confirmation_workflow");
    assert.ok(confirmation.latestCheckout!.confirmationWorkflow);

    const abstraction = engine.configurePaymentProviderAbstraction(fullInput);
    assert.equal(abstraction.action, "configure_payment_provider_abstraction");
    assert.ok(abstraction.latestCheckout!.supportedProviders.length >= 2);
  });

  test("6 validates purchase information and prepares post-payment handoff", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateCheckoutWorkflow(fullInput);
    engine.preparePaymentProviderConfiguration(fullInput);
    engine.generateOrderSummary(fullInput);
    engine.generateCustomerConfirmationWorkflow(fullInput);
    engine.configurePaymentProviderAbstraction(fullInput);

    const purchase = engine.validateRequiredPurchaseInformation(fullInput);
    assert.equal(purchase.action, "validate_required_purchase_information");
    assert.ok(purchase.latestCheckout!.customerInformationRequirements.length >= 1);
    assert.ok(typeof purchase.latestCheckout!.purchaseInformationValid === "boolean");

    const handoff = engine.preparePostPaymentHandoff(fullInput);
    assert.equal(handoff.action, "prepare_post_payment_handoff");
    assert.ok(
      ["prepared", "ready_for_handoff"].includes(handoff.latestCheckout!.deliveryHandoffStatus),
    );
    assert.equal(handoff.latestCheckout!.handoffTarget, "digital-delivery-worker");
  });

  test("7 validates checkout readiness", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateCheckoutWorkflow(fullInput);
    engine.preparePaymentProviderConfiguration(fullInput);
    engine.generateOrderSummary(fullInput);
    engine.generateCustomerConfirmationWorkflow(fullInput);
    engine.configurePaymentProviderAbstraction(fullInput);
    engine.validateRequiredPurchaseInformation(fullInput);
    engine.preparePostPaymentHandoff(fullInput);

    const readiness = engine.validateCheckoutReadiness(fullInput);
    assert.equal(readiness.action, "validate_checkout_readiness");
    assert.ok(readiness.latestCheckout!.validationResults);
    assert.ok(typeof readiness.latestCheckout!.checkoutReady === "boolean");
    assert.ok(readiness.latestCheckout!.confidenceScore > 0);
  });

  test("8 produces Checkout Report with all required fields", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateCheckoutWorkflow(fullInput);
    engine.preparePaymentProviderConfiguration(fullInput);
    engine.generateOrderSummary(fullInput);
    engine.generateCustomerConfirmationWorkflow(fullInput);
    engine.configurePaymentProviderAbstraction(fullInput);
    engine.validateRequiredPurchaseInformation(fullInput);
    engine.preparePostPaymentHandoff(fullInput);
    engine.validateCheckoutReadiness(fullInput);

    const report = engine.produceCheckoutReport(fullInput);
    const latest = report.latestCheckout!;
    assert.ok(latest.checkoutId.startsWith("ckw-chk-"));
    assert.ok(latest.timestamp);
    assert.ok(latest.productId.startsWith("ckw-prd-") || latest.productId.length > 0);
    assert.ok(latest.productTitle.length > 0);
    assert.ok(latest.checkoutFlow);
    assert.ok(latest.paymentProviderConfiguration);
    assert.ok(latest.orderSummary);
    assert.ok(Array.isArray(latest.customerInformationRequirements));
    assert.ok(latest.customerInformationRequirements.length >= 1);
    assert.ok(latest.deliveryHandoffStatus);
    assert.ok(latest.validationResults);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, CKW_METADATA_VERSION);
    assert.equal(latest.reportVersion, CHECKOUT_WORKER_REPORT_VERSION);
    assert.equal(latest.neverChargeCustomers, true);
    assert.equal(latest.neverExecutePaymentTransactions, true);
    assert.equal(latest.neverDeliverProducts, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
  });

  test("9 rejects charge/deliver/publish/credentials/override/Q5-10 boundaries", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductInformation(productInput);
    for (const forbidden of [
      { chargeCustomers: true },
      { executePaymentTransactions: true },
      { processPayments: true },
      { deliverProducts: true },
      { publishStorefronts: true },
      { storeSensitivePaymentCredentials: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ510OrLater: true },
    ] as const) {
      const report = engine.produceCheckoutReport({
        ...fullInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestCheckout, null);
    }
  });

  test("10 lists + submits via ERR + cockpit", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCheckoutWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-ckw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveApprovedDigitalProductInformation(productInput);
    engine.generateCheckoutWorkflow(fullInput);
    engine.preparePaymentProviderConfiguration(fullInput);
    engine.generateOrderSummary(fullInput);
    engine.generateCustomerConfirmationWorkflow(fullInput);
    engine.configurePaymentProviderAbstraction(fullInput);
    engine.validateRequiredPurchaseInformation(fullInput);
    engine.preparePostPaymentHandoff(fullInput);
    engine.validateCheckoutReadiness(fullInput);
    const produced = engine.produceCheckoutReport(fullInput);
    const listed = engine.list();
    assert.ok(listed.checkouts.length >= 1);
    const submitted = engine.submitReport({
      checkoutId: produced.latestCheckout!.checkoutId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q5-09"]);
    assert.equal(submitted.latestCheckout!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestCheckout!.executiveReportId, "ert-worker-ckw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q5-09");
    assert.equal(cockpit.neverChargeCustomers, true);
    assert.equal(cockpit.neverExecutePaymentTransactions, true);
    assert.equal(cockpit.neverDeliverProducts, true);
  });
});
