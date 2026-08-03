import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  DDW_CAPABILITIES,
  DDW_DELIVERY_METHODS,
  DDW_DELIVERY_TYPES,
  DDW_INTEGRATION_TARGETS,
  DDW_METADATA_VERSION,
  DIGITAL_DELIVERY_WORKER_REPORT_VERSION,
  buildDigitalDeliveryWorkerConfiguration,
  createDigitalDeliveryWorker,
  resetDigitalDeliveryWorkerForTesting,
} from "../../digital-delivery-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(options?: Parameters<typeof createDigitalDeliveryWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createDigitalDeliveryWorker(bootstrap, options);
  await engine.initialize();
  engine.connect();
  return engine;
}

const checkoutInput = {
  checkoutId: "ckw-chk-001",
  orderId: "ddw-ord-test-001",
  productId: "ddw-prd-001",
  productTitle: "Freelancer Client Onboarding Toolkit",
  customerReference: "cust-ref-001",
  customerEmail: "customer@example.com",
  deliveryType: "secure_file_download" as const,
  deliveryMethod: "secure_file_download" as const,
  assetLabels: ["Main Toolkit PDF", "Bonus Templates Pack"],
  researchReportId: "dpr-rsh-001",
  opportunityId: "dpr-opp-001",
  businessId: "dbiz-ddw-01",
  factoryMissionId: "dpf-ddw-01",
  checkoutCompletionValidated: true,
  validated: true,
};

const fullInput = {
  ...checkoutInput,
  validated: true,
};

describe("Q5-10 Digital Delivery Worker", () => {
  beforeEach(resetDigitalDeliveryWorkerForTesting);

  test("1 locks mandatory digital-delivery-worker boundaries", () => {
    const c = buildDigitalDeliveryWorkerConfiguration(REPO_ROOT, {
      neverProcessPayments: false as never,
      neverCreateProducts: false as never,
      neverPublishStorefronts: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ511OrLater: false as never,
      neverExposeUnauthorizedAccess: false as never,
      deliverOnlyVerifiedPurchases: false as never,
    });
    assert.equal(c.neverProcessPayments, true);
    assert.equal(c.neverCreateProducts, true);
    assert.equal(c.neverPublishStorefronts, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ511OrLater, true);
    assert.equal(c.neverExposeUnauthorizedAccess, true);
    assert.equal(c.deliverOnlyVerifiedPurchases, true);
  });

  test("2 initializes PILLOW-DDW-001 for Q5-10 with checkout_worker integration", async () => {
    const state = (
      await build({
        dependencies: {
          checkoutWorker: {
            getCheckouts: () => [
              {
                checkoutId: "ckw-chk-001",
                productId: "ddw-prd-001",
                productTitle: "Freelancer Client Onboarding Toolkit",
                deliveryHandoffStatus: "ready_for_handoff",
                checkoutReady: true,
                purchaseInformationValid: true,
              },
            ],
            getLatestCheckoutId: () => "ckw-chk-001",
          },
        },
      })
    ).getState();
    assert.equal(state.missionId, "Q5-10");
    assert.equal(state.engineVersion, "PILLOW-DDW-001");
    assert.equal(state.configuration.workerId, "wkr-digital-delivery-01");
    for (const target of DDW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(state.configuration.integrationTargets.includes("checkout_worker"));
    assert.ok(state.configuration.integrationTargets.includes("digital_products_factory_core"));
    for (const type of DDW_DELIVERY_TYPES) {
      assert.ok(state.configuration.supportedDeliveryTypes.includes(type));
    }
    for (const method of DDW_DELIVERY_METHODS) {
      assert.ok(state.configuration.supportedDeliveryMethods.includes(method));
    }
    assert.ok(DDW_CAPABILITIES.includes("receive_validated_checkout_completion"));
    assert.ok(DDW_CAPABILITIES.includes("produce_machine_readable_digital_delivery_reports"));
  });

  test("3 receives validated checkout completion → ddw-dlv-*", async () => {
    const report = (await build()).receiveValidatedCheckoutCompletion(checkoutInput);
    assert.equal(report.action, "receive_validated_checkout_completion");
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.latestDelivery!.checkoutId, "ckw-chk-001");
    assert.ok(report.latestDelivery!.deliveryId.startsWith("ddw-dlv-"));
  });

  test("4 verifies eligibility and delivers assets", async () => {
    const engine = await build();
    engine.receiveValidatedCheckoutCompletion(checkoutInput);
    const eligibility = engine.verifyFulfilmentEligibility(fullInput);
    assert.equal(eligibility.action, "verify_fulfilment_eligibility");
    assert.equal(eligibility.latestDelivery!.eligibilityVerified, true);

    const assets = engine.deliverPurchasedDigitalAssets(fullInput);
    assert.equal(assets.action, "deliver_purchased_digital_assets");
    assert.ok(assets.latestDelivery!.deliveredAssets.length >= 1);
    assert.ok(assets.latestDelivery!.deliveredAssets[0]!.assetId.startsWith("ddw-ast-"));
  });

  test("5 grants access and secure download links (no live tokens; placeholders only)", async () => {
    const engine = await build();
    engine.receiveValidatedCheckoutCompletion(checkoutInput);
    engine.verifyFulfilmentEligibility(fullInput);
    engine.deliverPurchasedDigitalAssets(fullInput);

    const access = engine.grantProductAccess(fullInput);
    assert.equal(access.action, "grant_product_access");
    assert.equal(access.latestDelivery!.accessGranted, true);
    assert.ok(access.latestDelivery!.accessGrants.length >= 1);
    assert.ok(access.latestDelivery!.accessGrants[0]!.grantId.startsWith("ddw-grant-"));

    const links = engine.generateSecureDownloadLinks(fullInput);
    assert.equal(links.action, "generate_secure_download_links");
    assert.ok(links.latestDelivery!.secureDownloadLinks.length >= 1);
    const link = links.latestDelivery!.secureDownloadLinks[0]!;
    assert.equal(link.tokenPresent, false);
    assert.equal(link.authorized, true);
    assert.ok(link.urlPlaceholder.startsWith("https://delivery.empireai.local/dl/"));
    assert.equal(/sk_live|pk_live|bearer|token=/i.test(JSON.stringify(link)), false);
  });

  test("6 tracks status, handles retries, and detects failures", async () => {
    const engine = await build();
    engine.receiveValidatedCheckoutCompletion(checkoutInput);
    engine.verifyFulfilmentEligibility(fullInput);
    engine.deliverPurchasedDigitalAssets(fullInput);
    engine.grantProductAccess(fullInput);
    engine.generateSecureDownloadLinks(fullInput);

    const status = engine.trackDeliveryStatus(fullInput);
    assert.equal(status.action, "track_delivery_status");
    assert.ok(status.latestDelivery!.deliveryStatus);

    const retries = engine.handleDeliveryRetries(fullInput);
    assert.equal(retries.action, "handle_delivery_retries");
    assert.ok(retries.latestDelivery!.retryStatus);

    const failures = engine.detectFulfilmentFailures(fullInput);
    assert.equal(failures.action, "detect_fulfilment_failures");
    assert.ok(failures.latestDelivery!.deliveryStatus);
  });

  test("7 produces customer delivery confirmation", async () => {
    const engine = await build();
    engine.receiveValidatedCheckoutCompletion(checkoutInput);
    engine.verifyFulfilmentEligibility(fullInput);
    engine.deliverPurchasedDigitalAssets(fullInput);
    engine.grantProductAccess(fullInput);
    engine.generateSecureDownloadLinks(fullInput);
    engine.trackDeliveryStatus(fullInput);

    const confirmation = engine.produceCustomerDeliveryConfirmations(fullInput);
    assert.equal(confirmation.action, "produce_customer_delivery_confirmations");
    assert.ok(confirmation.latestDelivery!.fulfilmentConfirmation);
    assert.equal(confirmation.latestDelivery!.fulfilmentConfirmation.confirmed, true);
    assert.ok(
      confirmation.latestDelivery!.fulfilmentConfirmation.confirmationId.startsWith("ddw-conf-"),
    );
  });

  test("8 produces Digital Delivery Report with all required fields", async () => {
    const engine = await build();
    engine.receiveValidatedCheckoutCompletion(checkoutInput);
    engine.verifyFulfilmentEligibility(fullInput);
    engine.deliverPurchasedDigitalAssets(fullInput);
    engine.grantProductAccess(fullInput);
    engine.generateSecureDownloadLinks(fullInput);
    engine.trackDeliveryStatus(fullInput);
    engine.handleDeliveryRetries(fullInput);
    engine.detectFulfilmentFailures(fullInput);
    engine.produceCustomerDeliveryConfirmations(fullInput);

    const report = engine.produceDigitalDeliveryReport(fullInput);
    const latest = report.latestDelivery!;
    assert.ok(latest.deliveryId.startsWith("ddw-dlv-"));
    assert.ok(latest.timestamp);
    assert.ok(latest.orderId.startsWith("ddw-ord-"));
    assert.ok(latest.productId.startsWith("ddw-prd-"));
    assert.ok(latest.customerReference.length > 0);
    assert.ok(Array.isArray(latest.deliveredAssets));
    assert.ok(latest.deliveredAssets.length >= 1);
    assert.ok(typeof latest.accessGranted === "boolean");
    assert.ok(Array.isArray(latest.accessGrants));
    assert.ok(latest.deliveryMethod);
    assert.ok(latest.deliveryStatus);
    assert.ok(latest.retryStatus);
    assert.ok(latest.fulfilmentConfirmation);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, DDW_METADATA_VERSION);
    assert.equal(latest.reportVersion, DIGITAL_DELIVERY_WORKER_REPORT_VERSION);
    assert.equal(latest.neverProcessPayments, true);
    assert.equal(latest.neverCreateProducts, true);
    assert.equal(latest.neverExposeUnauthorizedAccess, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
  });

  test("9 rejects processPayments/createProducts/publishStorefronts/override/Q5-11/exposeUnauthorizedAccess", async () => {
    const engine = await build();
    engine.receiveValidatedCheckoutCompletion(checkoutInput);
    for (const forbidden of [
      { processPayments: true },
      { createProducts: true },
      { publishStorefronts: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ511OrLater: true },
      { exposeUnauthorizedAccess: true },
      { bypassPillowGovernance: true },
    ] as const) {
      const report = engine.produceDigitalDeliveryReport({
        ...fullInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestDelivery, null);
    }
  });

  test("10 lists + ERR submit missionId Q5-10 + cockpit + audit", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createDigitalDeliveryWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-ddw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveValidatedCheckoutCompletion(checkoutInput);
    engine.verifyFulfilmentEligibility(fullInput);
    engine.deliverPurchasedDigitalAssets(fullInput);
    engine.grantProductAccess(fullInput);
    engine.generateSecureDownloadLinks(fullInput);
    engine.trackDeliveryStatus(fullInput);
    engine.handleDeliveryRetries(fullInput);
    engine.detectFulfilmentFailures(fullInput);
    engine.produceCustomerDeliveryConfirmations(fullInput);
    const produced = engine.produceDigitalDeliveryReport(fullInput);
    const listed = engine.list();
    assert.ok(listed.deliveries.length >= 1);
    const submitted = engine.submitReport({
      deliveryId: produced.latestDelivery!.deliveryId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q5-10"]);
    assert.equal(submitted.latestDelivery!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestDelivery!.executiveReportId, "ert-worker-ddw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q5-10");
    assert.equal(cockpit.neverProcessPayments, true);
    assert.equal(cockpit.neverCreateProducts, true);
    assert.equal(cockpit.neverExposeUnauthorizedAccess, true);
  });
});
