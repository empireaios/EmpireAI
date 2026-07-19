import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createFinancialFrameworkEngine,
  resetFinancialFrameworkForTesting,
} from "../../financial-framework/index.js";
import {
  createPaymentGatewayIntegrationEngine,
  resetPaymentGatewayIntegrationForTesting,
  buildPaymentGatewayIntegrationConfiguration,
  PAYMENT_GATEWAY_INTEGRATION_SYSTEM_PATH,
  PG_CAPABILITIES,
  PAYMENT_GATEWAY_ID,
} from "../../payment-gateway-integration/index.js";
import { appendPgLog, getPgLogs } from "../../payment-gateway-integration/pg-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildPaymentGatewayIntegrationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const ff = createFinancialFrameworkEngine(bootstrap);
  await ff.initialize();
  const engine = createPaymentGatewayIntegrationEngine(bootstrap, ff, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff };
}

describe("R3-02 Payment Gateway Integration", () => {
  beforeEach(() => {
    resetFinancialFrameworkForTesting();
    resetPaymentGatewayIntegrationForTesting();
  });

  test("buildPaymentGatewayIntegrationConfiguration loads defaults", () => {
    const config = buildPaymentGatewayIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://payment-gateway-api");
    assert.equal(config.defaultCurrency, "USD");
    assert.ok(PG_CAPABILITIES.includes("payment_request_creation"));
  });

  test("payment gateway integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PG-001");
    assert.equal(state.missionId, "R3-02");
    assert.ok(PAYMENT_GATEWAY_INTEGRATION_SYSTEM_PATH.includes("PAYMENT_GATEWAY"));
  });

  test("connectPaymentGateway registers with Financial Framework via R3-02", async () => {
    const { engine, ff } = await buildEngine();
    const report = engine.connectPaymentGateway();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === PAYMENT_GATEWAY_ID));
  });

  test("connectPaymentGateway produces machine-readable pg-* gateway records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectPaymentGateway();
    assert.ok(report.gatewayRunReportId.startsWith("pg-run-"));
    assert.ok(report.gatewayRecord.gatewayRecordId.startsWith("pg-"));
    assert.equal(report.gatewayRecord.gatewayId, PAYMENT_GATEWAY_ID);
    assert.equal(report.gatewayRecord.metadataVersion, "PG-001-v1");
    assert.ok(report.gatewayRecord.supportedCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectPaymentGateway({
      credentialRef: "vault://payment-gateway-api",
    });
    assert.equal(report.gatewayRecord.authenticationStatus, "authenticated");
    assert.equal(report.gatewayRecord.sessionStatus, "active");
    assert.equal(report.gatewayRecord.credentialRefPresent, true);
    const logs = getPgLogs(50);
    assert.ok(!logs.some((l) => /bearer|api_key=|token=/i.test(l.details)));
  });

  test("createPaymentRequest produces machine-readable payment records", async () => {
    const { engine } = await buildEngine();
    engine.connectPaymentGateway();
    const report = engine.createPaymentRequest({
      customerReference: "cust-1001",
      orderReference: "ord-5001",
      paymentAmount: 49.99,
      currency: "USD",
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "create_payment");
    assert.equal(report.paymentRecords.length, 1);
    const payment = report.paymentRecords[0]!;
    assert.ok(payment.paymentId.startsWith("pg-pay-"));
    assert.equal(payment.orderReference, "ord-5001");
    assert.equal(payment.paymentStatus, "pending");
    assert.equal(payment.metadataVersion, "PG-001-v1");
  });

  test("payment authorization capture and cancellation lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectPaymentGateway();
    const created = engine.createPaymentRequest({
      customerReference: "cust-1001",
      orderReference: "ord-5002",
      paymentAmount: 29.99,
    });
    const paymentId = created.paymentRecords[0]!.paymentId;

    const authorized = engine.processPaymentAuthorization({ paymentId });
    assert.notEqual(authorized.validation.decision, "fail");
    assert.equal(authorized.paymentRecords[0]?.paymentStatus, "authorized");
    assert.equal(authorized.paymentRecords[0]?.authorizationStatus, "authorized");

    const captured = engine.processPaymentCapture({ paymentId });
    assert.notEqual(captured.validation.decision, "fail");
    assert.equal(captured.paymentRecords[0]?.paymentStatus, "captured");

    const created2 = engine.createPaymentRequest({
      customerReference: "cust-1002",
      orderReference: "ord-5003",
      paymentAmount: 19.99,
    });
    const paymentId2 = created2.paymentRecords[0]!.paymentId;
    engine.processPaymentAuthorization({ paymentId: paymentId2 });
    const cancelled = engine.processPaymentCancellation({ paymentId: paymentId2 });
    assert.notEqual(cancelled.validation.decision, "fail");
    assert.equal(cancelled.paymentRecords[0]?.paymentStatus, "cancelled");
  });

  test("duplicate payment requests are rejected", async () => {
    const { engine } = await buildEngine();
    engine.connectPaymentGateway();
    engine.createPaymentRequest({
      customerReference: "cust-1001",
      orderReference: "ord-dup",
      paymentAmount: 10,
    });
    const duplicate = engine.createPaymentRequest({
      customerReference: "cust-1001",
      orderReference: "ord-dup",
      paymentAmount: 10,
    });
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("payment webhook handling works", async () => {
    const { engine } = await buildEngine();
    engine.connectPaymentGateway();
    const created = engine.createPaymentRequest({
      customerReference: "cust-1001",
      orderReference: "ord-wh",
      paymentAmount: 15,
    });
    const txnId = created.paymentRecords[0]!.transactionId;
    const report = engine.handlePaymentWebhook({
      topic: "payment.authorized",
      payloadRef: "webhook-payload-001",
      transactionId: txnId,
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "handle_webhook");
  });

  test("payment status sync works", async () => {
    const { engine } = await buildEngine();
    engine.connectPaymentGateway();
    const created = engine.createPaymentRequest({
      customerReference: "cust-1001",
      orderReference: "ord-sync",
      paymentAmount: 25,
    });
    const paymentId = created.paymentRecords[0]!.paymentId;
    const report = engine.syncPaymentStatus({ paymentId });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "sync_status");
  });

  test("rate limiting blocks excessive payment operations", async () => {
    const { engine } = await buildEngine({ operationsPerMinute: 2, rateLimitEnabled: true });
    engine.connectPaymentGateway();
    engine.createPaymentRequest({
      customerReference: "c1",
      orderReference: "o1",
      paymentAmount: 1,
    });
    engine.createPaymentRequest({
      customerReference: "c2",
      orderReference: "o2",
      paymentAmount: 2,
    });
    const limited = engine.createPaymentRequest({
      customerReference: "c3",
      orderReference: "o3",
      paymentAmount: 3,
    });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendPgLog({
      event: "payment_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectPaymentGateway();
    const logs = getPgLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectPaymentGateway();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
  });
});
