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
  createBankingIntegrationEngine,
  resetBankingIntegrationForTesting,
  buildBankingIntegrationConfiguration,
  BANKING_INTEGRATION_SYSTEM_PATH,
  BI_CAPABILITIES,
  BANKING_INTEGRATION_ID,
} from "../../banking-integration/index.js";
import { appendBiLog, getBiLogs } from "../../banking-integration/bi-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildBankingIntegrationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const ff = createFinancialFrameworkEngine(bootstrap);
  await ff.initialize();
  const engine = createBankingIntegrationEngine(bootstrap, ff, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff };
}

describe("R3-03 Banking Integration", () => {
  beforeEach(() => {
    resetFinancialFrameworkForTesting();
    resetBankingIntegrationForTesting();
  });

  test("buildBankingIntegrationConfiguration loads defaults", () => {
    const config = buildBankingIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://banking-integration-api");
    assert.equal(config.defaultCurrency, "USD");
    assert.ok(BI_CAPABILITIES.includes("bank_account_synchronization"));
  });

  test("banking integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-BI-001");
    assert.equal(state.missionId, "R3-03");
    assert.ok(BANKING_INTEGRATION_SYSTEM_PATH.includes("BANKING_INTEGRATION"));
  });

  test("connectBankingIntegration registers with Financial Framework via R3-03", async () => {
    const { engine, ff } = await buildEngine();
    const report = engine.connectBankingIntegration();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === BANKING_INTEGRATION_ID));
  });

  test("connectBankingIntegration produces machine-readable bi-* integration records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectBankingIntegration();
    assert.ok(report.integrationRunReportId.startsWith("bi-run-"));
    assert.ok(report.integrationRecord.integrationRecordId.startsWith("bi-"));
    assert.equal(report.integrationRecord.bankingProviderId, BANKING_INTEGRATION_ID);
    assert.equal(report.integrationRecord.metadataVersion, "BI-001-v1");
    assert.ok(report.integrationRecord.supportedCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectBankingIntegration({
      credentialRef: "vault://banking-integration-api",
    });
    assert.equal(report.integrationRecord.authenticationStatus, "authenticated");
    assert.equal(report.integrationRecord.sessionStatus, "active");
    assert.equal(report.integrationRecord.credentialRefPresent, true);
    const logs = getBiLogs(50);
    assert.ok(!logs.some((l) => /bearer|api_key=|token=/i.test(l.details)));
  });

  test("syncBankAccounts produces machine-readable banking records", async () => {
    const { engine } = await buildEngine();
    engine.connectBankingIntegration();
    const report = engine.syncBankAccounts({ includeFixtureAccounts: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "sync_accounts");
    assert.equal(report.bankingRecords.length, 2);
    const account = report.bankingRecords[0]!;
    assert.ok(account.bankingRecordId.startsWith("bi-acct-"));
    assert.equal(account.synchronizationStatus, "synchronized");
    assert.equal(account.metadataVersion, "BI-001-v1");
  });

  test("syncAccountBalances updates account balances", async () => {
    const { engine } = await buildEngine();
    engine.connectBankingIntegration();
    engine.syncBankAccounts({ includeFixtureAccounts: true });
    const report = engine.syncAccountBalances({ includeFixtureBalances: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "sync_balances");
    assert.ok(report.bankingRecords.length > 0);
    assert.ok(report.bankingRecords.every((a) => a.synchronizationStatus === "synchronized"));
  });

  test("syncTransactionHistory produces machine-readable transaction records", async () => {
    const { engine } = await buildEngine();
    engine.connectBankingIntegration();
    engine.syncBankAccounts({ includeFixtureAccounts: true });
    const report = engine.syncTransactionHistory({ includeFixtureTransactions: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "sync_transactions");
    assert.ok(report.transactionRecords.length >= 2);
    const txn = report.transactionRecords[0]!;
    assert.ok(txn.transactionId.startsWith("bi-txn-"));
    assert.equal(txn.metadataVersion, "BI-001-v1");
  });

  test("banking notification handling works", async () => {
    const { engine } = await buildEngine();
    engine.connectBankingIntegration();
    engine.syncBankAccounts({ includeFixtureAccounts: true });
    const report = engine.handleBankingNotification({
      topic: "account.updated",
      payloadRef: "notification-payload-001",
      bankAccountReference: "acct-operating-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "handle_notification");
  });

  test("registerBankingProvider registers additional providers", async () => {
    const { engine } = await buildEngine();
    engine.connectBankingIntegration();
    const report = engine.registerBankingProvider({ providerIdentifier: "yodlee" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "register_provider");
  });

  test("rate limiting blocks excessive sync operations", async () => {
    const { engine } = await buildEngine({ operationsPerMinute: 2, rateLimitEnabled: true });
    engine.connectBankingIntegration();
    engine.syncBankAccounts({ includeFixtureAccounts: true });
    engine.syncBankAccounts({ includeFixtureAccounts: true });
    const limited = engine.syncBankAccounts({ includeFixtureAccounts: true });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendBiLog({
      event: "banking_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 account_number=4111",
    });
    await engine.connectBankingIntegration();
    const logs = getBiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectBankingIntegration();
    engine.syncBankAccounts({ includeFixtureAccounts: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
  });
});
