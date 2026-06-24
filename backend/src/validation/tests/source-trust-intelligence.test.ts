import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { createConnectorRegistryModule } from "../../eye/connector-registry/index.js";
import { createInMemoryConnectorRegistry } from "../../eye/connector-registry/index.js";
import { aggregateProductEvidence } from "../../eye/product-evidence-aggregation/scoring/evidence-aggregation-scoring.js";
import type { GlobalProductSignal } from "../../eye/global-product-signals/models/product-signal.js";
import type { SignalSource } from "../../eye/global-product-signals/models/signal-source.js";
import {
  createInMemorySourceTrustRepository,
  createSourceTrustModule,
  scoreSourceTrust,
} from "../../eye/source-trust-intelligence/index.js";

const WORKSPACE_ID = "ws-m038";

function makeSignal(
  source: SignalSource,
  strength: number,
  confidence: number,
  productId = "prod-m038",
  timestamp?: string,
): GlobalProductSignal {
  const now = timestamp ?? new Date().toISOString();
  return {
    signalId: randomUUID(),
    workspaceId: WORKSPACE_ID,
    productId,
    source,
    timestamp: now,
    strength,
    confidence,
    evidence: [
      {
        evidenceId: randomUUID(),
        kind: "test_evidence",
        summary: `${source} evidence`,
        value: String(strength),
        capturedAt: now,
      },
    ],
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

function createTestTrustStack() {
  const connectorRegistryStore = createInMemoryConnectorRegistry();
  const connectorModule = createConnectorRegistryModule(connectorRegistryStore);
  const trustRepository = createInMemorySourceTrustRepository();
  const trustModule = createSourceTrustModule(trustRepository, connectorModule);

  return { connectorModule, trustModule, trustRepository };
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

describe("Mission 038 Source Trust Intelligence Engine", () => {
  it("evaluates a high trust source with healthy connector and consistent signals", async () => {
    const { connectorModule, trustModule } = createTestTrustStack();
    await seedActiveHealthyConnector(connectorModule, "amazon");

    const signals = [
      makeSignal("AMAZON", 88, 92, "prod-m038-amazon", "2026-06-21T10:00:00.000Z"),
      makeSignal("AMAZON", 86, 90, "prod-m038-amazon", "2026-06-21T11:00:00.000Z"),
      makeSignal("AMAZON", 87, 91, "prod-m038-amazon", "2026-06-21T12:00:00.000Z"),
    ];
    const evidenceSummary = aggregateProductEvidence("prod-m038-amazon", signals);

    const profile = await trustModule.evaluateSourceTrust(WORKSPACE_ID, {
      source: "AMAZON",
      signals,
      evidenceSummary,
    });

    assert.equal(profile.trustTier, "HIGH_TRUST");
    assert.ok(profile.trustScore >= 75);
    assert.ok(profile.historicalAccuracy >= 80);
    assert.ok(profile.signalConsistency >= 90);
    assert.ok(profile.manipulationRisk < 20);
  });

  it("evaluates a medium trust source with moderate variance", async () => {
    const { connectorModule, trustModule } = createTestTrustStack();
    await connectorModule.registerKnownConnector(WORKSPACE_ID, "reddit");
    await connectorModule.updateConnectorStatus(WORKSPACE_ID, "reddit", "ACTIVE");
    await connectorModule.updateConnectorHealth(WORKSPACE_ID, "reddit", {
      healthState: "DEGRADED",
      message: "Intermittent API latency",
      consecutiveFailures: 1,
    });

    const signals = [
      makeSignal("REDDIT", 62, 68, "prod-m038-reddit", "2026-06-21T10:00:00.000Z"),
      makeSignal("REDDIT", 71, 72, "prod-m038-reddit", "2026-06-21T11:00:00.000Z"),
      makeSignal("REDDIT", 58, 65, "prod-m038-reddit", "2026-06-21T12:00:00.000Z"),
    ];

    const profile = await trustModule.evaluateSourceTrust(WORKSPACE_ID, {
      source: "REDDIT",
      signals,
    });

    assert.equal(profile.trustTier, "MEDIUM_TRUST");
    assert.ok(profile.trustScore >= 45);
    assert.ok(profile.trustScore < 75);
  });

  it("evaluates a low trust source with high manipulation risk", async () => {
    const { trustModule } = createTestTrustStack();

    const signals = [
      makeSignal("MANUAL", 48, 42, "prod-m038-manual"),
    ];
    const evidenceSummary = aggregateProductEvidence("prod-m038-manual", signals);

    const profile = await trustModule.evaluateSourceTrust(WORKSPACE_ID, {
      source: "MANUAL",
      signals,
      evidenceSummary,
    });

    assert.equal(profile.trustTier, "LOW_TRUST");
    assert.ok(profile.trustScore < 45);
    assert.ok(profile.manipulationRisk >= 40);
  });

  it("calculates trust score from trust dimensions", () => {
    const signals = [
      makeSignal("GOOGLE_TRENDS", 80, 86, "prod-m038-trends", "2026-06-21T10:00:00.000Z"),
      makeSignal("GOOGLE_TRENDS", 82, 87, "prod-m038-trends", "2026-06-21T11:00:00.000Z"),
    ];

    const breakdown = scoreSourceTrust({
      source: "GOOGLE_TRENDS",
      connectorId: "google-trends",
      connector: null,
      signals,
    });

    assert.equal(breakdown.signals.length, 6);
    assert.ok(breakdown.reliabilityScore > 0);
    assert.ok(breakdown.trustScore > 0);
    assert.equal(
      breakdown.trustTier,
      breakdown.trustScore >= 75
        ? "HIGH_TRUST"
        : breakdown.trustScore >= 45
          ? "MEDIUM_TRUST"
          : "LOW_TRUST",
    );
  });

  it("reduces trust score when manipulation risk increases", () => {
    const stableSignals = [
      makeSignal("PINTEREST", 76, 80, "prod-m038-pin", "2026-06-21T10:00:00.000Z"),
      makeSignal("PINTEREST", 78, 82, "prod-m038-pin", "2026-06-21T11:00:00.000Z"),
    ];

    const stableScore = scoreSourceTrust({
      source: "PINTEREST",
      signals: stableSignals,
    });

    const riskySignals = [
      makeSignal("PINTEREST", 30, 40, "prod-m038-pin", "2026-06-21T10:00:00.000Z"),
      makeSignal("PINTEREST", 85, 45, "prod-m038-pin", "2026-06-21T11:00:00.000Z"),
    ];

    const riskyScore = scoreSourceTrust({
      source: "PINTEREST",
      signals: riskySignals,
    });

    assert.ok(riskyScore.manipulationRisk > stableScore.manipulationRisk);
    assert.ok(riskyScore.trustScore < stableScore.trustScore);
    assert.ok(riskyScore.noiseLevel >= stableScore.noiseLevel);
  });

  it("persists source trust profiles in the repository", async () => {
    const { connectorModule, trustModule, trustRepository } = createTestTrustStack();
    await seedActiveHealthyConnector(connectorModule, "amazon");

    const signals = [
      makeSignal("AMAZON", 84, 89, "prod-m038-persist"),
      makeSignal("AMAZON", 85, 90, "prod-m038-persist"),
    ];

    const saved = await trustModule.evaluateSourceTrust(WORKSPACE_ID, {
      source: "AMAZON",
      signals,
    });

    const loaded = await trustModule.getSourceTrustProfile(WORKSPACE_ID, "AMAZON");
    assert.ok(loaded);
    assert.equal(loaded!.id, saved.id);
    assert.equal(loaded!.trustTier, saved.trustTier);
    assert.equal(loaded!.trustScore, saved.trustScore);

    const listed = await trustRepository.list({
      workspaceId: WORKSPACE_ID,
      minTrustScore: 70,
    });
    assert.equal(listed.length, 1);
    assert.equal(listed[0]!.source, "AMAZON");
  });
});
