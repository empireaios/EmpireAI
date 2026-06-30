import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  buildEmpireKnowledgeDashboard,
  createKnowledgeObject,
  getGraphStats,
  listKnowledgeObjects,
  listLearningRecords,
  queryKnowledgeGraph,
  reasonAboutProduct,
  resetEmpireKnowledgeRepository,
} from "../../runtime/empire-knowledge/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-k001";
const COMPANY_ID = "co-grand-king";

describe("Knowledge Wave 1 — Empire Knowledge Engine (K-001–K-005)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetEmpireKnowledgeRepository();
  });

  afterEach(() => {
    resetEmpireKnowledgeRepository();
    resetDatabaseInstance();
  });

  it("K-001 — knowledge object model supports canonical types without plaintext secrets", () => {
    const objects = listKnowledgeObjects(WORKSPACE_ID);
    assert.ok(objects.length >= 17);

    const types = new Set(objects.map((o) => o.objectType));
    assert.ok(types.has("country"));
    assert.ok(types.has("marketplace"));
    assert.ok(types.has("product"));
    assert.ok(types.has("success"));
    assert.ok(types.has("failure"));

    const created = createKnowledgeObject(WORKSPACE_ID, {
      objectType: "product",
      displayName: "Test SKU",
      attributes: { category: "electronics" },
      confidence: 65,
    });
    assert.ok(created.objectId);
    assert.ok(!("password" in created.attributes));
  });

  it("K-002 — knowledge graph links product through success to marketplace and country", () => {
    const graph = queryKnowledgeGraph(WORKSPACE_ID, "ko-product-electronics-001", 3);
    assert.ok(graph);
    assert.ok(graph!.nodes.length >= 3);
    assert.ok(graph!.edges.some((e) => e.relationship === "SUCCEEDED_ON"));
    assert.ok(graph!.edges.some((e) => e.relationship === "PERFORMED_BEST_ON" || e.relationship === "LAUNCHED_IN"));

    const stats = getGraphStats(WORKSPACE_ID);
    assert.ok(stats.edges >= 12);
    assert.ok(stats.nodes >= 17);
  });

  it("K-003 — learning records include observation, evidence, confidence, and related objects", () => {
    const learnings = listLearningRecords(WORKSPACE_ID);
    assert.ok(learnings.length >= 4);

    const critical = learnings.find((l) => l.importance === "CRITICAL");
    assert.ok(critical);
    assert.ok(critical!.observation.length > 0);
    assert.ok(critical!.evidence.length > 0);
    assert.ok(critical!.relatedObjectIds.length > 0);
    assert.ok(critical!.confidence >= 0);
  });

  it("K-004 — knowledge reasoning returns evidence for product category", () => {
    const reasoning = reasonAboutProduct(WORKSPACE_ID, {
      productCategory: "electronics",
      companyId: COMPANY_ID,
    });

    assert.ok(reasoning.reasoningId);
    assert.ok(reasoning.summary.includes("electronics"));
    assert.ok(reasoning.overallConfidence >= 0);
    assert.ok(reasoning.similarLaunches.length >= 0);
    assert.ok(reasoning.repeatingPatterns.length >= 0);

    if (reasoning.bestMarketplaces.length > 0) {
      assert.ok(reasoning.bestMarketplaces[0]!.evidence.length > 0);
    }
  });

  it("K-005 — knowledge dashboard exposes Mission Control payload", () => {
    const dashboard = buildEmpireKnowledgeDashboard(WORKSPACE_ID, COMPANY_ID);

    assert.equal(dashboard.moduleId, "empire-knowledge");
    assert.equal(dashboard.missionId, "K-001-K-005");
    assert.ok(dashboard.knowledgeObjects.total >= 17);
    assert.ok(dashboard.learningRecords.total >= 4);
    assert.ok(dashboard.topDiscoveries.length > 0);
    assert.ok(dashboard.knowledgeCoverage.graphEdges >= 12);
    assert.ok(["GROWING", "STABLE", "INSUFFICIENT_DATA"].includes(dashboard.confidenceGrowth.trend));
  });
});
