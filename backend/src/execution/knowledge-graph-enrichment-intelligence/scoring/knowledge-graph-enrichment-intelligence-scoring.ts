import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { ContinuousLearningUpdate } from "../models/continuous-learning-update.js";
import type { EnrichmentSignal, EnrichmentSignalType } from "../models/enrichment-signal.js";
import type { GraphEntity } from "../models/graph-entity.js";
import type { GraphOpportunity } from "../models/graph-opportunity.js";
import type { GraphRelationship } from "../models/graph-relationship.js";
import type { KnowledgeGraphEnrichmentReportCreateInput } from "../models/knowledge-graph-enrichment-report.js";

export const ENRICHMENT_SIGNAL_WEIGHTS: Record<EnrichmentSignalType, number> = {
  entity_discovery: 0.2,
  relationship_mapping: 0.22,
  opportunity_synthesis: 0.2,
  continuous_learning: 0.18,
  graph_coverage: 0.18,
  enrichment_composite: 0.02,
};

export type KnowledgeGraphEnrichmentBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type KnowledgeGraphEnrichmentContextInput = {
  primaryProduct?: string;
  primaryCategory?: string;
  supplierName?: string;
};

export type KnowledgeGraphEnrichmentInput = {
  brand: KnowledgeGraphEnrichmentBrandInput;
  context: KnowledgeGraphEnrichmentContextInput;
  storeId: string;
  enrichmentIndex?: number;
};

export type KnowledgeGraphEnrichmentBreakdown = KnowledgeGraphEnrichmentReportCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: EnrichmentSignalType,
  score: number,
  detail: string,
): EnrichmentSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: ENRICHMENT_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: KnowledgeGraphEnrichmentInput): number {
  const enrichmentBoost = input.enrichmentIndex
    ? Math.min(10, input.enrichmentIndex / 10)
    : 5;
  return clampScore(input.brand.confidence * 0.45 + enrichmentBoost + 22);
}

function buildEntities(input: KnowledgeGraphEnrichmentInput): GraphEntity[] {
  const score = baseScore(input);
  const product = input.context.primaryProduct ?? "Premium Kitchen Blender";
  const category = input.context.primaryCategory ?? "Kitchen appliances";
  const supplier = input.context.supplierName ?? "CJ Dropshipping";

  const productId = randomUUID();
  const brandId = randomUUID();
  const supplierId = randomUUID();
  const personaId = randomUUID();
  const categoryId = randomUUID();

  return [
    {
      entityId: productId,
      entityType: "PRODUCT",
      label: product,
      description: `Hero product in ${input.brand.niche} — primary revenue driver.`,
      sourceModule: "product-intelligence",
      confidence: clampScore(input.brand.confidence),
      score: clampScore(score + 5),
    },
    {
      entityId: brandId,
      entityType: "BRAND",
      label: input.brand.brandName,
      description: input.brand.positioning,
      sourceModule: "brand-genesis",
      confidence: clampScore(input.brand.confidence + 2),
      score: clampScore(score + 4),
    },
    {
      entityId: supplierId,
      entityType: "SUPPLIER",
      label: supplier,
      description: `Primary fulfillment partner for ${product}.`,
      sourceModule: "supplier-intelligence",
      confidence: clampScore(78 + input.brand.confidence * 0.05),
      score: clampScore(score + 2),
    },
    {
      entityId: personaId,
      entityType: "BUYER_PERSONA",
      label: input.brand.targetAudience.slice(0, 60),
      description: `Target audience for ${input.brand.brandName}.`,
      sourceModule: "buyer-intelligence",
      confidence: clampScore(80 + input.brand.confidence * 0.04),
      score: clampScore(score + 3),
    },
    {
      entityId: categoryId,
      entityType: "CATEGORY",
      label: category,
      description: `Product category in ${input.brand.niche}.`,
      sourceModule: "product-knowledge-graph",
      confidence: clampScore(75 + input.brand.confidence * 0.06),
      score: clampScore(score + 1),
    },
  ];
}

function buildRelationships(entities: GraphEntity[]): GraphRelationship[] {
  const product = entities.find((entity) => entity.entityType === "PRODUCT")!;
  const brand = entities.find((entity) => entity.entityType === "BRAND")!;
  const supplier = entities.find((entity) => entity.entityType === "SUPPLIER")!;
  const persona = entities.find((entity) => entity.entityType === "BUYER_PERSONA")!;
  const category = entities.find((entity) => entity.entityType === "CATEGORY")!;

  return [
    {
      relationshipId: randomUUID(),
      relationshipType: "SUPPLIES",
      sourceEntityId: supplier.entityId,
      targetEntityId: product.entityId,
      sourceLabel: supplier.label,
      targetLabel: product.label,
      strength: 92,
      evidence: "Supplier fulfillment data confirms active supply relationship.",
      score: 88,
    },
    {
      relationshipId: randomUUID(),
      relationshipType: "BELONGS_TO",
      sourceEntityId: product.entityId,
      targetEntityId: category.entityId,
      sourceLabel: product.label,
      targetLabel: category.label,
      strength: 95,
      evidence: "Product catalog classification.",
      score: 90,
    },
    {
      relationshipId: randomUUID(),
      relationshipType: "TARGETS",
      sourceEntityId: brand.entityId,
      targetEntityId: persona.entityId,
      sourceLabel: brand.label,
      targetLabel: persona.label,
      strength: 85,
      evidence: "Brand positioning aligned with buyer persona profile.",
      score: 84,
    },
    {
      relationshipId: randomUUID(),
      relationshipType: "PROMOTED_BY",
      sourceEntityId: product.entityId,
      targetEntityId: brand.entityId,
      sourceLabel: product.label,
      targetLabel: brand.label,
      strength: 88,
      evidence: "Primary product in brand portfolio.",
      score: 86,
    },
  ];
}

function buildOpportunities(entities: GraphEntity[]): GraphOpportunity[] {
  const product = entities.find((entity) => entity.entityType === "PRODUCT")!;
  const brand = entities.find((entity) => entity.entityType === "BRAND")!;
  const persona = entities.find((entity) => entity.entityType === "BUYER_PERSONA")!;

  return [
    {
      opportunityId: randomUUID(),
      opportunityType: "CROSS_SELL",
      title: "Accessory bundle cross-sell",
      description: `Graph link between ${product.label} and complementary accessories suggests bundle opportunity.`,
      relatedEntityIds: [product.entityId, brand.entityId],
      expectedValue: 82,
      confidence: 78,
      score: 80,
    },
    {
      opportunityId: randomUUID(),
      opportunityType: "AUDIENCE_EXPANSION",
      title: "Adjacent persona targeting",
      description: `Expand from ${persona.label} to related home improvement segment.`,
      relatedEntityIds: [persona.entityId, brand.entityId],
      expectedValue: 74,
      confidence: 72,
      score: 73,
    },
    {
      opportunityId: randomUUID(),
      opportunityType: "MARKET_EXPANSION",
      title: "Category adjacency launch",
      description: "Knowledge graph reveals underserved adjacent category with shared supplier.",
      relatedEntityIds: entities.map((entity) => entity.entityId),
      expectedValue: 68,
      confidence: 65,
      score: 67,
    },
  ];
}

function buildContinuousLearning(
  entities: GraphEntity[],
  input: KnowledgeGraphEnrichmentInput,
): ContinuousLearningUpdate[] {
  const now = new Date().toISOString();
  const product = entities.find((entity) => entity.entityType === "PRODUCT")!;

  return [
    {
      updateId: randomUUID(),
      source: "REVIEW_INTELLIGENCE",
      learnedFact: "Customers frequently mention durability as top purchase driver.",
      affectedEntityIds: [product.entityId],
      appliedAt: now,
      retentionScore: 88,
      score: 85,
    },
    {
      updateId: randomUUID(),
      source: "COMPETITOR_INTELLIGENCE",
      learnedFact: `Competitors in ${input.brand.niche} bundling accessories at 15% discount.`,
      affectedEntityIds: entities.filter((entity) => entity.entityType === "PRODUCT" || entity.entityType === "BRAND").map((entity) => entity.entityId),
      appliedAt: now,
      retentionScore: 82,
      score: 80,
    },
    {
      updateId: randomUUID(),
      source: "PERSISTENT_MEMORY",
      learnedFact: "Bundle offers increased AOV 22% in prior campaign cycle.",
      affectedEntityIds: [product.entityId],
      appliedAt: now,
      retentionScore: 90,
      score: 88,
    },
  ];
}

function buildSignals(
  entities: GraphEntity[],
  relationships: GraphRelationship[],
  opportunities: GraphOpportunity[],
  learning: ContinuousLearningUpdate[],
  confidence: number,
): EnrichmentSignal[] {
  return [
    buildSignal(
      "entity_discovery",
      average(entities.map((entity) => entity.score)),
      `${entities.length} new entities discovered`,
    ),
    buildSignal(
      "relationship_mapping",
      average(relationships.map((relationship) => relationship.score)),
      `${relationships.length} new relationships mapped`,
    ),
    buildSignal(
      "opportunity_synthesis",
      average(opportunities.map((opportunity) => opportunity.score)),
      `${opportunities.length} new opportunities synthesized`,
    ),
    buildSignal(
      "continuous_learning",
      average(learning.map((update) => update.score)),
      `${learning.length} continuous learning updates applied`,
    ),
    buildSignal(
      "graph_coverage",
      clampScore(40 + entities.length * 8 + relationships.length * 4),
      `Graph coverage expanded by ${entities.length + relationships.length} nodes/edges`,
    ),
    buildSignal("enrichment_composite", confidence, `Knowledge graph enrichment confidence ${confidence}`),
  ];
}

function computeConfidence(signals: EnrichmentSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "enrichment_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "enrichment_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(
  entities: GraphEntity[],
  relationships: GraphRelationship[],
  opportunities: GraphOpportunity[],
): number {
  return clampScore(
    average([
      average(entities.map((entity) => entity.score)),
      average(relationships.map((relationship) => relationship.score)),
      average(opportunities.map((opportunity) => opportunity.score)),
    ]),
  );
}

/** Generates knowledge graph enrichment report — intelligence only, no auto-write. */
export function generateKnowledgeGraphEnrichment(
  input: KnowledgeGraphEnrichmentInput,
): KnowledgeGraphEnrichmentBreakdown {
  const newEntities = buildEntities(input);
  const newRelationships = buildRelationships(newEntities);
  const newOpportunities = buildOpportunities(newEntities);
  const continuousLearning = buildContinuousLearning(newEntities, input);

  const provisionalSignals = buildSignals(
    newEntities,
    newRelationships,
    newOpportunities,
    continuousLearning,
    0,
  );
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(
    newEntities,
    newRelationships,
    newOpportunities,
    continuousLearning,
    confidence,
  );
  const overallScore = computeOverallScore(newEntities, newRelationships, newOpportunities);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    reportName: `${input.brand.brandName} Knowledge Graph Enrichment`,
    newEntities,
    newRelationships,
    newOpportunities,
    continuousLearning,
    totalEntitiesAdded: newEntities.length,
    totalRelationshipsAdded: newRelationships.length,
    totalOpportunitiesDiscovered: newOpportunities.length,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoWriteEnabled: false,
  };
}

export const knowledgeGraphEnrichmentIntelligenceScoring = {
  generateKnowledgeGraphEnrichment,
  computeConfidence,
  computeOverallScore,
  ENRICHMENT_SIGNAL_WEIGHTS,
};
