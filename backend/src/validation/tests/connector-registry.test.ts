import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createConnectorRegistryModule,
  createInMemoryConnectorRegistry,
  KNOWN_CONNECTOR_TEMPLATES,
  validateStatusTransition,
} from "../../eye/connector-registry/index.js";

const WORKSPACE_ID = "ws-m035";

describe("Mission 035 Eye Connector Registry", () => {
  it("registers a connector with normalized id and default health", async () => {
    const module = createConnectorRegistryModule();
    const connector = await module.registerConnector(WORKSPACE_ID, {
      connectorId: "Amazon",
      connectorName: "Amazon",
      connectorType: "MARKETPLACE",
      capabilities: [
        {
          kind: "PRODUCT_OBSERVATION",
          label: "Product rankings",
          enabled: true,
        },
      ],
    });

    assert.equal(connector.connectorId, "amazon");
    assert.equal(connector.connectorName, "Amazon");
    assert.equal(connector.connectorType, "MARKETPLACE");
    assert.equal(connector.status, "REGISTERED");
    assert.equal(connector.health.healthState, "UNKNOWN");
    assert.equal(connector.lastSync, null);
    assert.equal(connector.capabilities.length, 1);
    assert.ok(connector.capabilities[0]!.capabilityId);
  });

  it("looks up a registered connector by id", async () => {
    const registry = createInMemoryConnectorRegistry();
    const module = createConnectorRegistryModule(registry);

    await module.registerKnownConnector(WORKSPACE_ID, "google-trends");
    const found = await module.getConnector(WORKSPACE_ID, "google-trends");

    assert.ok(found);
    assert.equal(found.connectorName, "Google Trends");
    assert.equal(found.connectorType, "SEARCH_TRENDS");
    assert.equal(found.capabilities.length, 2);
  });

  it("registers capabilities on an existing connector", async () => {
    const module = createConnectorRegistryModule();
    const connector = await module.registerKnownConnector(WORKSPACE_ID, "tiktok");
    const initialCount = connector.capabilities.length;

    const updated = await module.addConnectorCapability(WORKSPACE_ID, "tiktok", {
      kind: "WEBHOOK_INGEST",
      label: "Creator webhook ingest",
      enabled: true,
      description: "Push-based creator updates",
    });

    assert.equal(updated.capabilities.length, initialCount + 1);
    assert.ok(
      updated.capabilities.some(
        (capability) => capability.kind === "WEBHOOK_INGEST" && capability.enabled,
      ),
    );
  });

  it("updates connector health snapshots", async () => {
    const module = createConnectorRegistryModule();
    await module.registerKnownConnector(WORKSPACE_ID, "reddit");

    const updated = await module.updateConnectorHealth(WORKSPACE_ID, "reddit", {
      healthState: "DEGRADED",
      message: "Rate limit pressure detected",
      consecutiveFailures: 2,
      latencyMs: 420,
      lastFailureAt: new Date().toISOString(),
    });

    assert.equal(updated.health.healthState, "DEGRADED");
    assert.equal(updated.health.consecutiveFailures, 2);
    assert.equal(updated.health.latencyMs, 420);
    assert.match(updated.health.message, /Rate limit/);
  });

  it("applies allowed status transitions and rejects invalid ones", async () => {
    const module = createConnectorRegistryModule();
    await module.registerKnownConnector(WORKSPACE_ID, "pinterest");

    const active = await module.updateConnectorStatus(WORKSPACE_ID, "pinterest", "ACTIVE");
    assert.equal(active.status, "ACTIVE");

    const degraded = await module.updateConnectorStatus(WORKSPACE_ID, "pinterest", "DEGRADED");
    assert.equal(degraded.status, "DEGRADED");

    assert.throws(
      () => validateStatusTransition("DEGRADED", "REGISTERED"),
      /Invalid connector status transition/,
    );
  });

  it("persists connector state across repository operations", async () => {
    const registry = createInMemoryConnectorRegistry();
    const module = createConnectorRegistryModule(registry);

    for (const template of KNOWN_CONNECTOR_TEMPLATES) {
      await module.registerConnector(WORKSPACE_ID, template);
    }

    const syncedAt = new Date().toISOString();
    await module.recordConnectorSync(WORKSPACE_ID, "shopify", syncedAt);
    await module.updateConnectorStatus(WORKSPACE_ID, "shopify", "ACTIVE");
    await module.updateConnectorHealth(WORKSPACE_ID, "shopify", {
      healthState: "HEALTHY",
      message: "Store catalog sync healthy",
      consecutiveFailures: 0,
      lastSuccessAt: syncedAt,
    });

    const listed = await module.listConnectors(WORKSPACE_ID);
    assert.equal(listed.length, KNOWN_CONNECTOR_TEMPLATES.length);

    const shopify = await module.getConnector(WORKSPACE_ID, "shopify");
    assert.ok(shopify);
    assert.equal(shopify.lastSync, syncedAt);
    assert.equal(shopify.status, "ACTIVE");
    assert.equal(shopify.health.healthState, "HEALTHY");

    const social = await module.listConnectors(WORKSPACE_ID, { connectorType: "SOCIAL" });
    assert.equal(social.length, 3);
    assert.ok(social.every((connector) => connector.connectorType === "SOCIAL"));
  });
});
