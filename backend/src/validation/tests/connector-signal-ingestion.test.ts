import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createConnectorRegistryModule } from "../../eye/connector-registry/index.js";
import { createInMemoryConnectorRegistry } from "../../eye/connector-registry/index.js";
import {
  createConnectorSignalIngestionModule,
  createInMemoryConnectorSignalIngestionRepository,
  mapConnectorSignalToProductSignal,
  resolveSignalSourceForConnector,
} from "../../eye/connector-signal-ingestion/index.js";
import { createGlobalProductSignalModule } from "../../eye/global-product-signals/index.js";
import { createInMemoryProductSignalRegistry } from "../../eye/global-product-signals/index.js";

const WORKSPACE_ID = "ws-m036";

function createTestIngestionStack() {
  const connectorRegistry = createInMemoryConnectorRegistry();
  const productSignalRegistry = createInMemoryProductSignalRegistry();
  const ingestionRepository = createInMemoryConnectorSignalIngestionRepository();
  const connectorModule = createConnectorRegistryModule(connectorRegistry);
  const productSignalModule = createGlobalProductSignalModule(productSignalRegistry);
  const ingestionModule = createConnectorSignalIngestionModule(
    ingestionRepository,
    connectorModule,
    productSignalModule,
  );

  return {
    connectorModule,
    productSignalModule,
    ingestionModule,
    ingestionRepository,
  };
}

async function seedActiveHealthyConnector(
  connectorModule: ReturnType<typeof createConnectorRegistryModule>,
  connectorId: string,
) {
  await connectorModule.registerKnownConnector(WORKSPACE_ID, connectorId);
  await connectorModule.updateConnectorStatus(WORKSPACE_ID, connectorId, "ACTIVE");
  await connectorModule.updateConnectorHealth(WORKSPACE_ID, connectorId, {
    healthState: "HEALTHY",
    message: "Connector operating normally",
    consecutiveFailures: 0,
    lastSuccessAt: new Date().toISOString(),
  });
}

const sampleEvidence = [
  {
    kind: "bestseller_rank",
    summary: "Amazon bestseller in kitchen appliances",
    value: "rank-18",
    sourceRef: "amazon-us",
  },
];

describe("Mission 036 Connector Signal Ingestion Engine", () => {
  it("successfully ingests a connector observation into the global product signal registry", async () => {
    const { connectorModule, productSignalModule, ingestionModule } = createTestIngestionStack();
    await seedActiveHealthyConnector(connectorModule, "amazon");

    const outcome = await ingestionModule.ingest(WORKSPACE_ID, {
      connectorId: "amazon",
      productId: "prod-m036-blender",
      strength: 84,
      evidence: sampleEvidence,
      metadata: { region: "US" },
    });

    assert.equal(outcome.result.status, "SUCCESS");
    assert.ok(outcome.result.signalId);
    assert.ok(outcome.signal);
    assert.equal(outcome.signal!.productId, "prod-m036-blender");
    assert.equal(outcome.signal!.source, "AMAZON");

    const persisted = await productSignalModule.getSignal(WORKSPACE_ID, outcome.result.signalId!);
    assert.ok(persisted);
    assert.equal(persisted!.metadata.connectorId, "amazon");
  });

  it("rejects ingestion from an unknown connector", async () => {
    const { ingestionModule } = createTestIngestionStack();

    const outcome = await ingestionModule.ingest(WORKSPACE_ID, {
      connectorId: "unknown-source",
      productId: "prod-m036-unknown",
      evidence: sampleEvidence,
    });

    assert.equal(outcome.result.status, "REJECTED");
    assert.equal(outcome.result.reason, "UNKNOWN_CONNECTOR");
    assert.equal(outcome.signal, undefined);
  });

  it("rejects ingestion from an unhealthy connector", async () => {
    const { connectorModule, ingestionModule } = createTestIngestionStack();
    await connectorModule.registerKnownConnector(WORKSPACE_ID, "reddit");
    await connectorModule.updateConnectorStatus(WORKSPACE_ID, "reddit", "ACTIVE");
    await connectorModule.updateConnectorHealth(WORKSPACE_ID, "reddit", {
      healthState: "UNHEALTHY",
      message: "Repeated API failures",
      consecutiveFailures: 5,
      lastFailureAt: new Date().toISOString(),
    });

    const outcome = await ingestionModule.ingest(WORKSPACE_ID, {
      connectorId: "reddit",
      productId: "prod-m036-reddit",
      evidence: [
        {
          kind: "discussion_volume",
          summary: "Subreddit activity spike",
          value: "220 posts/week",
        },
      ],
    });

    assert.equal(outcome.result.status, "REJECTED");
    assert.equal(outcome.result.reason, "UNHEALTHY_CONNECTOR");
  });

  it("allows unhealthy connector ingestion when explicitly overridden", async () => {
    const { connectorModule, ingestionModule } = createTestIngestionStack();
    await connectorModule.registerKnownConnector(WORKSPACE_ID, "tiktok");
    await connectorModule.updateConnectorStatus(WORKSPACE_ID, "tiktok", "ACTIVE");
    await connectorModule.updateConnectorHealth(WORKSPACE_ID, "tiktok", {
      healthState: "UNHEALTHY",
      message: "Rate limit exhaustion",
      consecutiveFailures: 3,
    });

    const outcome = await ingestionModule.ingest(
      WORKSPACE_ID,
      {
        connectorId: "tiktok",
        productId: "prod-m036-tiktok",
        evidence: [
          {
            kind: "engagement_spike",
            summary: "Viral product clip",
            value: "1.2M views",
          },
        ],
      },
      { allowUnhealthyConnector: true },
    );

    assert.equal(outcome.result.status, "SUCCESS");
    assert.equal(outcome.signal!.source, "TIKTOK");
  });

  it("maps connector observations to normalized global product signal payloads", async () => {
    const { connectorModule } = createTestIngestionStack();
    await seedActiveHealthyConnector(connectorModule, "google-trends");
    const connector = await connectorModule.getConnector(WORKSPACE_ID, "google-trends");
    assert.ok(connector);

    assert.equal(resolveSignalSourceForConnector("google-trends"), "GOOGLE_TRENDS");
    assert.equal(resolveSignalSourceForConnector("cj-dropshipping"), "SUPPLIER");

    const mapped = mapConnectorSignalToProductSignal(connector, {
      eventId: "evt-map-1",
      workspaceId: WORKSPACE_ID,
      connectorId: "google-trends",
      productId: "prod-m036-trend",
      observedAt: new Date().toISOString(),
      strength: 76,
      evidence: [
        {
          kind: "search_interest",
          summary: "Rising search interest",
          value: "82",
        },
      ],
      metadata: { query: "portable blender" },
    });

    assert.equal(mapped.source, "GOOGLE_TRENDS");
    assert.equal(mapped.productId, "prod-m036-trend");
    assert.equal(mapped.metadata?.connectorId, "google-trends");
    assert.equal(mapped.metadata?.connectorName, "Google Trends");
    assert.ok(mapped.evidence[0]!.evidenceId);
  });

  it("persists ingestion results for audit and replay", async () => {
    const { connectorModule, ingestionModule, ingestionRepository } = createTestIngestionStack();
    await seedActiveHealthyConnector(connectorModule, "pinterest");

    const outcome = await ingestionModule.ingest(WORKSPACE_ID, {
      connectorId: "pinterest",
      productId: "prod-m036-pin",
      evidence: [
        {
          kind: "pin_velocity",
          summary: "Pin save velocity increasing",
          value: "340 saves/day",
        },
      ],
    });

    const byId = await ingestionModule.getIngestionResult(WORKSPACE_ID, outcome.result.resultId);
    assert.ok(byId);
    assert.equal(byId!.status, "SUCCESS");
    assert.equal(byId!.connectorId, "pinterest");

    const byEvent = await ingestionModule.getIngestionResultByEvent(
      WORKSPACE_ID,
      outcome.result.eventId,
    );
    assert.ok(byEvent);
    assert.equal(byEvent!.resultId, outcome.result.resultId);

    const listed = await ingestionRepository.list({ workspaceId: WORKSPACE_ID, status: "SUCCESS" });
    assert.equal(listed.length, 1);
  });
});
