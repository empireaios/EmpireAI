import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { GlobalProductSignal } from "../../eye/global-product-signals/models/product-signal.js";
import {
  aggregateProductEvidence,
  createInMemoryEvidenceAggregationRepository,
  createProductEvidenceAggregationModule,
} from "../../eye/product-evidence-aggregation/index.js";

const WORKSPACE_ID = "ws-m032";
const PRODUCT_ID = "prod-m032-blender";
const TIMESTAMP = "2026-06-23T12:00:00.000Z";

function buildSignal(
  overrides: Partial<GlobalProductSignal> & Pick<GlobalProductSignal, "source" | "strength" | "confidence">,
): GlobalProductSignal {
  return {
    signalId: overrides.signalId ?? `sig-${overrides.source.toLowerCase()}`,
    workspaceId: WORKSPACE_ID,
    productId: PRODUCT_ID,
    source: overrides.source,
    timestamp: overrides.timestamp ?? TIMESTAMP,
    strength: overrides.strength,
    confidence: overrides.confidence,
    evidence: overrides.evidence ?? [
      {
        evidenceId: `ev-${overrides.source}`,
        kind: "sample",
        summary: `${overrides.source} evidence`,
        value: "1",
        capturedAt: TIMESTAMP,
      },
    ],
    metadata: overrides.metadata ?? {},
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  };
}

describe("Mission 032 Product Evidence Aggregation Engine", () => {
  it("aggregates multiple source signals into one evidence summary", () => {
    const summary = aggregateProductEvidence(PRODUCT_ID, [
      buildSignal({ source: "AMAZON", strength: 85, confidence: 82 }),
      buildSignal({ source: "GOOGLE_TRENDS", strength: 78, confidence: 80 }),
      buildSignal({ source: "TIKTOK", strength: 72, confidence: 74 }),
      buildSignal({ source: "REDDIT", strength: 68, confidence: 70 }),
    ]);

    assert.equal(summary.totalSignals, 4);
    assert.ok(summary.sourceDiversity > 0);
    assert.ok(summary.averageStrength >= 70);
    assert.ok(summary.averageConfidence >= 70);
    assert.ok(summary.evidenceScore >= 60);
    assert.equal(summary.strongestSource, "AMAZON");
  });

  it("handles single-source evidence with risk flags", () => {
    const summary = aggregateProductEvidence(PRODUCT_ID, [
      buildSignal({ source: "SUPPLIER", strength: 76, confidence: 79 }),
    ]);

    assert.equal(summary.totalSignals, 1);
    assert.ok(summary.riskFlags.includes("single_source_evidence"));
    assert.equal(summary.strongestSource, "SUPPLIER");
    assert.equal(summary.weakestSource, "SUPPLIER");
    assert.equal(summary.trendDirection, "stable");
  });

  it("calculates source diversity from unique sources", () => {
    const diverse = aggregateProductEvidence(PRODUCT_ID, [
      buildSignal({ source: "AMAZON", strength: 80, confidence: 80 }),
      buildSignal({ source: "PINTEREST", strength: 70, confidence: 72 }),
      buildSignal({ source: "REDDIT", strength: 65, confidence: 68 }),
    ]);
    const narrow = aggregateProductEvidence(PRODUCT_ID, [
      buildSignal({ source: "AMAZON", strength: 80, confidence: 80 }),
      buildSignal({ source: "AMAZON", strength: 75, confidence: 78, signalId: "sig-amazon-2" }),
    ]);

    assert.ok(diverse.sourceDiversity > narrow.sourceDiversity);
    assert.equal(diverse.sourceBreakdown.length, 3);
    assert.equal(narrow.sourceBreakdown.length, 1);
  });

  it("calculates evidence score from aggregation signals", () => {
    const strong = aggregateProductEvidence(PRODUCT_ID, [
      buildSignal({ source: "AMAZON", strength: 90, confidence: 88 }),
      buildSignal({ source: "GOOGLE_TRENDS", strength: 86, confidence: 85 }),
      buildSignal({ source: "SUPPLIER", strength: 84, confidence: 83 }),
    ]);
    const weak = aggregateProductEvidence(PRODUCT_ID, [
      buildSignal({ source: "MANUAL", strength: 40, confidence: 45 }),
    ]);

    assert.ok(strong.evidenceScore > weak.evidenceScore);
    assert.ok(strong.signals.length === 6);
  });

  it("identifies strongest and weakest sources by average strength", () => {
    const summary = aggregateProductEvidence(PRODUCT_ID, [
      buildSignal({ source: "AMAZON", strength: 92, confidence: 90 }),
      buildSignal({ source: "TIKTOK", strength: 60, confidence: 62 }),
      buildSignal({ source: "REDDIT", strength: 55, confidence: 58 }),
    ]);

    assert.equal(summary.strongestSource, "AMAZON");
    assert.equal(summary.weakestSource, "REDDIT");
  });

  it("persists aggregated summaries via module", async () => {
    const repository = createInMemoryEvidenceAggregationRepository();
    const module = createProductEvidenceAggregationModule(repository);
    const signals = [
      buildSignal({ source: "AMAZON", strength: 84, confidence: 82 }),
      buildSignal({ source: "GOOGLE_TRENDS", strength: 79, confidence: 80 }),
    ];

    const created = await module.aggregateAndPersist(WORKSPACE_ID, PRODUCT_ID, signals);
    const stored = await repository.getByProductId(WORKSPACE_ID, PRODUCT_ID);
    const listed = await module.listSummaries(WORKSPACE_ID, { productId: PRODUCT_ID });

    assert.ok(stored);
    assert.equal(created.id, stored!.id);
    assert.equal(stored!.productId, PRODUCT_ID);
    assert.equal(stored!.totalSignals, 2);
    assert.equal(listed.length, 1);
  });
});
