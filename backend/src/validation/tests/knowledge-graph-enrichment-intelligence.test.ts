import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  ENRICHMENT_SIGNAL_TYPES,
  GRAPH_ENTITY_TYPES,
  GRAPH_OPPORTUNITY_TYPES,
  GRAPH_RELATIONSHIP_TYPES,
  LEARNING_SOURCES,
  createInMemoryKnowledgeGraphEnrichmentIntelligenceRepository,
  createKnowledgeGraphEnrichmentIntelligenceModule,
  generateKnowledgeGraphEnrichment,
  validateKnowledgeGraphEnrichmentReport,
} from "../../execution/knowledge-graph-enrichment-intelligence/index.js";

const WORKSPACE_ID = "ws-m098";

function buildEnrichmentInput(storeId = randomUUID()) {
  return {
    brand: {
      brandId: randomUUID(),
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 87,
    },
    context: {
      primaryProduct: "Premium Kitchen Blender",
      primaryCategory: "Kitchen appliances",
      supplierName: "CJ Dropshipping",
    },
    storeId,
    enrichmentIndex: 81,
  };
}

describe("Mission 098 Knowledge Graph Enrichment Intelligence Engine", () => {
  it("generates enrichment report with safety flags", async () => {
    const module = createKnowledgeGraphEnrichmentIntelligenceModule();
    const record = await module.persistEnrichment(WORKSPACE_ID, buildEnrichmentInput());

    assert.ok(record.reportId);
    assert.match(record.reportName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoWriteEnabled, false);
    assert.ok(record.confidence >= 55);
    assert.ok(record.signals.some((signal) => signal.signalType === "enrichment_composite"));
  });

  it("discovers new graph entities", () => {
    const entities = generateKnowledgeGraphEnrichment(buildEnrichmentInput()).newEntities;

    assert.ok(entities.length >= 4);
    for (const entity of entities) {
      assert.ok(GRAPH_ENTITY_TYPES.includes(entity.entityType));
      assert.ok(entity.label.length > 0);
      assert.ok(entity.confidence >= 0 && entity.confidence <= 100);
      assert.ok(entity.sourceModule.length > 0);
    }
    assert.ok(entities.some((entity) => entity.entityType === "PRODUCT"));
    assert.ok(entities.some((entity) => entity.entityType === "BRAND"));
    assert.ok(entities.some((entity) => entity.entityType === "SUPPLIER"));
  });

  it("maps new graph relationships", () => {
    const relationships = generateKnowledgeGraphEnrichment(buildEnrichmentInput()).newRelationships;

    assert.ok(relationships.length >= 3);
    for (const relationship of relationships) {
      assert.ok(GRAPH_RELATIONSHIP_TYPES.includes(relationship.relationshipType));
      assert.ok(relationship.sourceEntityId.length > 0);
      assert.ok(relationship.targetEntityId.length > 0);
      assert.ok(relationship.strength >= 0 && relationship.strength <= 100);
      assert.ok(relationship.evidence.length > 0);
    }
    assert.ok(relationships.some((relationship) => relationship.relationshipType === "SUPPLIES"));
  });

  it("synthesizes new graph opportunities", () => {
    const opportunities = generateKnowledgeGraphEnrichment(buildEnrichmentInput()).newOpportunities;

    assert.ok(opportunities.length >= 2);
    for (const opportunity of opportunities) {
      assert.ok(GRAPH_OPPORTUNITY_TYPES.includes(opportunity.opportunityType));
      assert.ok(opportunity.relatedEntityIds.length >= 1);
      assert.ok(opportunity.expectedValue >= 0 && opportunity.expectedValue <= 100);
      assert.ok(opportunity.confidence >= 0 && opportunity.confidence <= 100);
    }
  });

  it("applies continuous learning updates", () => {
    const learning = generateKnowledgeGraphEnrichment(buildEnrichmentInput()).continuousLearning;

    assert.ok(learning.length >= 2);
    for (const update of learning) {
      assert.ok(LEARNING_SOURCES.includes(update.source));
      assert.ok(update.learnedFact.length > 0);
      assert.ok(update.affectedEntityIds.length >= 1);
      assert.ok(update.appliedAt.length > 0);
      assert.ok(update.retentionScore >= 0 && update.retentionScore <= 100);
    }
  });

  it("tracks enrichment totals", () => {
    const report = generateKnowledgeGraphEnrichment(buildEnrichmentInput());

    assert.equal(report.totalEntitiesAdded, report.newEntities.length);
    assert.equal(report.totalRelationshipsAdded, report.newRelationships.length);
    assert.equal(report.totalOpportunitiesDiscovered, report.newOpportunities.length);
    assert.ok(report.overallScore >= 0 && report.overallScore <= 100);
  });

  it("computes weighted confidence signals", () => {
    const report = generateKnowledgeGraphEnrichment(buildEnrichmentInput());

    assert.ok(report.signals.length >= 5);
    for (const signalType of ENRICHMENT_SIGNAL_TYPES) {
      assert.ok(report.signals.some((signal) => signal.signalType === signalType));
    }
    const composite = report.signals.find(
      (signal) => signal.signalType === "enrichment_composite",
    );
    assert.ok(composite);
    assert.equal(composite!.score, report.confidence);
  });

  it("validates knowledge graph enrichment report schema", () => {
    const report = generateKnowledgeGraphEnrichment(buildEnrichmentInput());
    const validated = validateKnowledgeGraphEnrichmentReport({ reportId: randomUUID(), ...report });

    assert.ok(validated.newEntities.length >= 1);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoWriteEnabled, false);
    assert.ok(validated.continuousLearning.length >= 1);
  });

  it("persists enrichment records in the repository", async () => {
    const repository = createInMemoryKnowledgeGraphEnrichmentIntelligenceRepository();
    const module = createKnowledgeGraphEnrichmentIntelligenceModule(repository);
    const input = buildEnrichmentInput();

    const saved = await module.persistEnrichment(WORKSPACE_ID, input);
    const loadedByStore = await module.getEnrichmentByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getEnrichmentRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.totalEntitiesAdded, saved.totalEntitiesAdded);
    assert.equal(loadedById!.newRelationships.length, saved.newRelationships.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
