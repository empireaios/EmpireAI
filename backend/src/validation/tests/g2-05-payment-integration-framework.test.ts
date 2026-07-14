import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PAYMENT_DOMAIN_CAPABILITIES,
  PAYMENT_EKLS_OUTCOME_KINDS,
  PAYMENT_INTEGRATION_LIFECYCLE,
  PAYMENT_INTEGRATION_VERSION,
  PAYMENT_METHOD_KINDS,
  PAYMENT_SECURITY_FEATURES,
  PaymentContractValidationError,
  advancePaymentLifecycle,
  assertNoSensitivePaymentPayload,
  buildPaymentAdapterContract,
  canTransitionPaymentLifecycle,
  discoverPaymentCapabilitiesForBrain,
  discoverPayments,
  getPaymentPluginHost,
  listPaymentBrainDomainCapabilities,
  listPaymentConsumerBindings,
  listPaymentEklsOutcomeKinds,
  listPaymentEngineBindings,
  listPaymentIntegrationLifecyclePhases,
  providePaymentCapabilityToAllConsumers,
  providePaymentCapabilityToConsumer,
  recordPaymentEklsOutcome,
  resetInfrastructureCommerceForTests,
  resolveAllPaymentCapabilities,
  resolveCurrenciesForPayment,
  resolvePaymentRegistrySnapshot,
  searchPaymentEklsOutcomes,
  transitionPaymentLifecycle,
  validatePaymentIntegration,
  validatePaymentPillowGovernance,
  validatePaymentSecurityProfile,
} from "../../orchestration/infrastructure-commerce/index.js";
import type { CommercePaymentRow } from "../../registry/types/commerce-registry-types.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

describe("G2-05 — Payment Integration Framework", () => {
  it("exposes universal payment integration lifecycle phases", () => {
    assert.deepEqual(listPaymentIntegrationLifecyclePhases(), PAYMENT_INTEGRATION_LIFECYCLE);
    assert.equal(PAYMENT_INTEGRATION_LIFECYCLE.length, 12);
  });

  it("supports future payment methods without hardcoded payment providers", () => {
    assert.ok(PAYMENT_METHOD_KINDS.includes("card"));
    assert.ok(PAYMENT_METHOD_KINDS.includes("digital_wallet"));
    assert.ok(PAYMENT_METHOD_KINDS.includes("bank_transfer"));
    assert.ok(PAYMENT_METHOD_KINDS.includes("bnpl"));
    assert.ok(PAYMENT_METHOD_KINDS.includes("cryptocurrency"));
    assert.ok(PAYMENT_METHOD_KINDS.includes("future_technology"));
  });

  it("discovers payment providers from REG-PAYMENT via registry integration", () => {
    resetInfrastructureCommerceForTests();
    const discovery = discoverPayments(TEST_CONTEXT);
    assert.equal(discovery.discoverySource, "RegistryLoader:REG-PAYMENT");
    assert.ok(discovery.discoveredCount >= 2);
    assert.equal(discovery.providers[0]?.providerId, "pay-foundation-psp-primary");
  });

  it("resolves payment registry snapshot from required registries", () => {
    resetInfrastructureCommerceForTests();
    const snapshot = resolvePaymentRegistrySnapshot(TEST_CONTEXT);
    assert.ok(snapshot.payments.length >= 2);
    assert.ok(snapshot.policies.length >= 1);
    assert.ok(snapshot.countryCommerce.length >= 1);
    assert.equal(
      snapshot.registrySource,
      "RegistryLoader:REG-PAYMENT|REG-COMMERCE-POLICY|REG-COUNTRY-COMMERCE",
    );
  });

  it("builds payment adapter contracts with required contract fields", () => {
    resetInfrastructureCommerceForTests();
    const row = resolvePaymentRegistrySnapshot(TEST_CONTEXT).payments[0] as CommercePaymentRow;
    const contract = buildPaymentAdapterContract(
      row,
      resolveCurrenciesForPayment(TEST_CONTEXT, row),
    );
    assert.equal(contract.version, "1.0.0");
    assert.ok(contract.paymentMethods.length >= 1);
    assert.ok(contract.securityFeatures.length >= 1);
    assert.equal(contract.refundSupport.supported, true);
    assert.equal(contract.domainContracts.payment_intent.supported, true);
    assert.equal(contract.discoverySource, "RegistryLoader:REG-PAYMENT");
  });

  it("validates payment integration contracts from registry rows", () => {
    resetInfrastructureCommerceForTests();
    const result = validatePaymentIntegration(TEST_CONTEXT, "pay-foundation-psp-primary");
    assert.equal(result.valid, true);
    assert.ok(result.contract);
    assert.equal(result.contract?.authenticationMethod, "oauth2");
    assert.ok(result.contract?.paymentMethods.includes("card"));
  });

  it("resolves payment domain capabilities dynamically", () => {
    resetInfrastructureCommerceForTests();
    const primary = resolveAllPaymentCapabilities(TEST_CONTEXT).find(
      (entry) => entry.providerId === "pay-foundation-psp-primary",
    );
    const secondary = resolveAllPaymentCapabilities(TEST_CONTEXT).find(
      (entry) => entry.providerId === "pay-foundation-psp-secondary",
    );
    assert.ok(primary);
    assert.ok(secondary);
    assert.equal(primary.registryBacked, true);
    assert.equal(primary.policyCompliant, true);
    assert.ok(primary.resolvedCapabilities.length >= 6);
    assert.ok(secondary.resolvedCapabilities.length < primary.resolvedCapabilities.length);
    assert.ok(secondary.resolvedCapabilities.includes("payout"));
  });

  it("discovers payment capabilities for Brain through RegistryLoader only", () => {
    resetInfrastructureCommerceForTests();
    const brainCapabilities = discoverPaymentCapabilitiesForBrain(TEST_CONTEXT);
    assert.ok(brainCapabilities.length >= 2);
    for (const entry of brainCapabilities) {
      assert.equal(entry.discoverySource, "RegistryLoader:REG-PAYMENT");
      assert.ok(entry.capabilities.length >= 1);
      assert.ok(entry.paymentMethods.length >= 1);
    }
    assert.deepEqual(listPaymentBrainDomainCapabilities(), [...PAYMENT_DOMAIN_CAPABILITIES]);
  });

  it("provides payment capability envelopes to business engines and automation", () => {
    resetInfrastructureCommerceForTests();
    const bindings = listPaymentEngineBindings();
    assert.ok(bindings.includes("live-payment-engine"));
    assert.ok(bindings.includes("marketplace-infrastructure-engine"));
    assert.ok(bindings.includes("storefront-assembly-engine"));
    assert.ok(bindings.includes("analytics-intelligence-engine"));
    assert.ok(listPaymentConsumerBindings().includes("business-automation"));

    const paymentEngine = providePaymentCapabilityToConsumer(
      TEST_CONTEXT,
      "live-payment-engine",
    );
    assert.ok(paymentEngine.length >= 2);
    assert.equal(paymentEngine[0]?.discoverySource, "RegistryLoader:payment-engine-bridge");

    const automation = providePaymentCapabilityToConsumer(TEST_CONTEXT, "business-automation");
    assert.ok(automation.length >= 2);

    const allConsumers = providePaymentCapabilityToAllConsumers(TEST_CONTEXT);
    assert.ok(allConsumers.length >= bindings.length + 1);
  });

  it("enforces payment integration lifecycle transitions", () => {
    assert.equal(canTransitionPaymentLifecycle("discover", "validate"), true);
    assert.equal(canTransitionPaymentLifecycle("discover", "capture"), false);

    const approved = transitionPaymentLifecycle("discover", {
      providerId: "pay-foundation-psp-primary",
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      pillowGovernance: true,
      targetPhase: "validate",
    });
    assert.equal(approved.allowed, true);
    assert.equal(approved.currentPhase, "validate");
  });

  it("advances payment lifecycle under Pillow governance", () => {
    resetInfrastructureCommerceForTests();
    const result = advancePaymentLifecycle({
      ...TEST_ACTOR,
      providerId: "pay-foundation-psp-primary",
      targetPhase: "validate",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.currentPhase, "validate");
  });

  it("registers payment plugins through framework host without core changes", () => {
    resetInfrastructureCommerceForTests();
    const host = getPaymentPluginHost();
    const manifest = {
      pluginId: "g2-test-payment-plugin",
      pluginName: "G2 Test Payment Plugin",
      version: "0.1.0",
      paymentRegistryRowId: "pay-foundation-psp-primary",
      paymentMethods: ["card" as const],
      securityFeatures: ["tokenisation" as const, "credential_isolation" as const],
      pillowGovernance: true as const,
      extensions: { adapterProfile: "generic" },
    };
    const result = host.registerPlugin(TEST_ACTOR, manifest);
    assert.equal(result.accepted, true);
    assert.ok(host.listPlugins().some((plugin) => plugin.pluginId === manifest.pluginId));
  });

  it("passes Pillow payment governance checks", () => {
    resetInfrastructureCommerceForTests();
    const result = validatePaymentPillowGovernance({
      ...TEST_ACTOR,
      providerId: "pay-foundation-psp-primary",
      operation: "discover",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.trustVerified, true);
    assert.equal(result.policyCompliant, true);
    assert.equal(result.workspaceIsolated, true);
    assert.equal(result.securityValidated, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("validates payment security profile without storing credentials", () => {
    resetInfrastructureCommerceForTests();
    const row = resolvePaymentRegistrySnapshot(TEST_CONTEXT).payments[0] as CommercePaymentRow;
    const contract = buildPaymentAdapterContract(
      row,
      resolveCurrenciesForPayment(TEST_CONTEXT, row),
    );
    const security = validatePaymentSecurityProfile(contract);
    assert.equal(security.valid, true);
    assert.equal(security.tokenisationReady, true);
    assert.equal(security.credentialIsolated, true);
    assert.equal(security.webhookVerificationReady, true);
    assert.equal(
      assertNoSensitivePaymentPayload({ providerId: "pay-foundation-psp-primary", amount: 100 }),
      true,
    );
    assert.equal(assertNoSensitivePaymentPayload({ pan: "4111111111111111" }), false);
    assert.ok(PAYMENT_SECURITY_FEATURES.includes("future_vault"));
  });

  it("records payment EKLS outcomes through Pillow-governed channel", () => {
    resetInfrastructureCommerceForTests();
    assert.deepEqual(listPaymentEklsOutcomeKinds(), [...PAYMENT_EKLS_OUTCOME_KINDS]);

    const recorded = recordPaymentEklsOutcome({
      ...TEST_ACTOR,
      providerId: "pay-foundation-psp-primary",
      kind: "payment_outcome",
      signalValue: 0.98,
      signalUnit: "ratio",
      summary: "Foundation payment outcome recorded without credentials",
    });
    assert.equal(recorded.accepted, true);
    assert.ok(recorded.outcomeId);
    assert.equal(recorded.eklsGoverned, true);

    const search = searchPaymentEklsOutcomes({
      ...TEST_ACTOR,
      providerId: "pay-foundation-psp-primary",
      kind: "payment_outcome",
    });
    assert.equal(search.length, 1);
    assert.equal(search[0]?.kind, "payment_outcome");
    assert.equal(search[0]?.credentialFree, true);
  });

  it("rejects malformed payment integration configuration", () => {
    assert.throws(
      () =>
        buildPaymentAdapterContract({
          id: "pay-bad-config",
          name: "Bad Config",
          description: "bad",
          status: "VALIDATED",
          version: "1.0.0",
          owner: "pillow:governance",
          dependencies: [],
          capabilities: ["authorize"],
          configuration: {},
          supportedRegions: ["global"],
          supportedCountries: ["*"],
          validation: { schemaVersion: "g2-01-v1" },
          pluginSupport: { allowPluginRegistration: true },
          workspaceScope: { scope: "global" },
          futureCompatibility: { minSchemaVersion: "g2-01-v1" },
          paymentKind: "psp",
        }),
      PaymentContractValidationError,
    );
  });

  it("validates foundation payment contracts without hardcoded business entities", () => {
    resetInfrastructureCommerceForTests();
    const serialized = JSON.stringify(discoverPayments(TEST_CONTEXT));
    const forbidden = ["Stripe", "PayPal", "Adyen", "Square", "Braintree", "Klarna"];
    for (const token of forbidden) {
      assert.equal(
        serialized.toLowerCase().includes(token.toLowerCase()),
        false,
        `payment framework must not hardcode business entity token: ${token}`,
      );
    }
    assert.equal(PAYMENT_INTEGRATION_VERSION, "g2-05-v1");
  });
});
