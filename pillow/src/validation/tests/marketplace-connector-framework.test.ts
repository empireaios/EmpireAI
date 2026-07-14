import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createMarketplaceConnectorFrameworkEngine,
  resetMarketplaceConnectorFrameworkForTesting,
  buildMarketplaceConnectorFrameworkConfiguration,
  MARKETPLACE_CONNECTOR_FRAMEWORK_SYSTEM_PATH,
  FRAMEWORK_CAPABILITIES,
} from "../../marketplace-connector-framework/index.js";
import type { MarketplaceConnectorDefinition } from "../../marketplace-connector-framework/index.js";

const TEMPLATE_CONNECTOR: MarketplaceConnectorDefinition = {
  marketplaceId: "connector-template-alpha",
  connectorVersion: "1.0.0",
  connectorType: "template",
  authenticationMethod: "api_key",
  credentialRef: "vault://connector-template-alpha",
  apiEndpointConfig: {
    baseUrl: "https://api.example-marketplace.test",
    protocol: "rest",
    timeoutMs: 30000,
    version: "v1",
  },
  webhookConfig: {
    enabled: true,
    pathPrefix: "/webhooks/template",
    signatureHeader: "x-signature",
    verifySignatures: true,
  },
  rateLimitConfig: {
    enabled: true,
    requestsPerMinute: 2,
    burstLimit: 2,
    windowMs: 60000,
  },
  retryConfig: {
    enabled: true,
    maxAttempts: 3,
    delayMs: 10,
    backoffMultiplier: 2,
  },
  supportedCapabilities: [
    "connector_registration",
    "connector_initialization",
    "connector_activation",
    "api_request_routing",
    "webhook_handling",
  ],
};

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await engine.initialize();
  return engine;
}

describe("R1-01 Marketplace Connector Framework", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
  });

  test("buildMarketplaceConnectorFrameworkConfiguration loads defaults", () => {
    const config = buildMarketplaceConnectorFrameworkConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.isolateConnectors, true);
    assert.ok(FRAMEWORK_CAPABILITIES.includes("connector_registration"));
  });

  test("marketplace connector framework initializes with doctrine doc", async () => {
    const engine = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MCF-001");
    assert.equal(state.missionId, "R1-01");
    assert.ok(
      MARKETPLACE_CONNECTOR_FRAMEWORK_SYSTEM_PATH.includes("MARKETPLACE_CONNECTOR_FRAMEWORK"),
    );
  });

  test("registerConnector produces machine-readable connector records", async () => {
    const engine = await buildEngine();
    const report = engine.registerConnector({ definition: TEMPLATE_CONNECTOR });
    if (report.validation.decision === "fail") {
      assert.fail(`validation failed: ${report.validation.errors.join("; ")}`);
    }
    assert.ok(report.frameworkRunReportId.startsWith("mcf-run-"));
    assert.equal(report.records.length, 1);
    const record = report.records[0]!;
    assert.ok(record.connectorId.startsWith("mcf-"));
    assert.equal(record.marketplaceIdentifier, "connector-template-alpha");
    assert.equal(record.currentState, "initialized");
    assert.ok(record.metadataVersion);
  });

  test("rejects specific marketplace integrations out of R1-01 scope", async () => {
    const engine = await buildEngine();
    const report = engine.registerConnector({
      definition: { ...TEMPLATE_CONNECTOR, marketplaceId: "amazon" },
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("out of scope")));
  });

  test("connector lifecycle register initialize and activate", async () => {
    const engine = await buildEngine();
    engine.registerConnector({ definition: TEMPLATE_CONNECTOR });
    const activated = engine.activateConnector("connector-template-alpha");
    assert.notEqual(activated.validation.decision, "fail");
    const record = engine.getRegisteredConnectors()[0];
    assert.equal(record?.currentState, "active");
  });

  test("connector suspend and shutdown lifecycle", async () => {
    const engine = await buildEngine();
    engine.registerConnector({ definition: TEMPLATE_CONNECTOR });
    engine.activateConnector("connector-template-alpha");
    const suspended = engine.suspendConnector("connector-template-alpha");
    assert.notEqual(suspended.validation.decision, "fail");
    assert.equal(engine.getRegisteredConnectors()[0]?.currentState, "suspended");
    const shutdown = engine.shutdownConnector("connector-template-alpha");
    assert.notEqual(shutdown.validation.decision, "fail");
    assert.equal(engine.getRegisteredConnectors()[0]?.currentState, "shutdown");
  });

  test("API routing abstraction routes requests", async () => {
    const engine = await buildEngine();
    engine.registerConnector({ definition: TEMPLATE_CONNECTOR });
    engine.activateConnector("connector-template-alpha");
    const report = await engine.routeApiRequest({
      marketplaceId: "connector-template-alpha",
      method: "GET",
      path: "/products",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_api");
  });

  test("webhook handling abstraction accepts events", async () => {
    const engine = await buildEngine();
    engine.registerConnector({ definition: TEMPLATE_CONNECTOR });
    engine.activateConnector("connector-template-alpha");
    const report = engine.handleWebhook({
      marketplaceId: "connector-template-alpha",
      topic: "order.created",
      payloadRef: "payload-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "handle_webhook");
  });

  test("rate limiting blocks excessive API requests", async () => {
    const engine = await buildEngine();
    engine.registerConnector({ definition: TEMPLATE_CONNECTOR });
    engine.activateConnector("connector-template-alpha");
    await engine.routeApiRequest({
      marketplaceId: "connector-template-alpha",
      method: "GET",
      path: "/products/1",
    });
    await engine.routeApiRequest({
      marketplaceId: "connector-template-alpha",
      method: "GET",
      path: "/products/2",
    });
    const limited = await engine.routeApiRequest({
      marketplaceId: "connector-template-alpha",
      method: "GET",
      path: "/products/3",
    });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("validateForSupervisorSync reports readiness after registration", async () => {
    const engine = await buildEngine();
    engine.registerConnector({ definition: TEMPLATE_CONNECTOR });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
  });

  test("cockpit snapshot exposes framework status", async () => {
    const engine = await buildEngine();
    engine.registerConnector({ definition: TEMPLATE_CONNECTOR });
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.registeredConnectorCount, 1);
    assert.ok(cockpit.engineStatus);
  });

  test("getLatestReport returns most recent framework operation", async () => {
    const engine = await buildEngine();
    const report = engine.registerConnector({ definition: TEMPLATE_CONNECTOR });
    const latest = engine.getLatestReport();
    assert.equal(latest?.frameworkRunReportId, report.frameworkRunReportId);
  });
});
