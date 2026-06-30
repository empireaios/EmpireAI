import { randomUUID } from "node:crypto";

import type { KnowledgeReasoningInput, KnowledgeReasoningResult, ReasoningEvidence } from "../models/knowledge-reasoning.js";
import { listKnowledgeEdges, findRelatedObjects } from "./knowledge-graph-service.js";
import { findKnowledgeObjectsByCategory, listKnowledgeObjects } from "./knowledge-object-service.js";
import { listLearningRecords, listLearningsByObject } from "./learning-record-service.js";
import { ensureKnowledgeSeeded } from "./knowledge-object-service.js";

function evidence(
  claim: string,
  evidenceText: string,
  confidence: number,
  relatedObjectIds: string[],
  source: string,
): ReasoningEvidence {
  return { claim, evidence: evidenceText, confidence, relatedObjectIds, source };
}

/** K-004 — Knowledge Reasoning (architecture only, evidence-backed). */
export function reasonAboutProduct(
  workspaceId: string,
  input: KnowledgeReasoningInput,
): KnowledgeReasoningResult {
  ensureKnowledgeSeeded(workspaceId, input.companyId);
  const category = input.productCategory.toLowerCase();
  const products = findKnowledgeObjectsByCategory(workspaceId, category);
  const launches = listKnowledgeObjects(workspaceId, "launch").filter(
    (l) => String(l.attributes.category ?? "").toLowerCase() === category,
  );
  const successes = listKnowledgeObjects(workspaceId, "success");
  const failures = listKnowledgeObjects(workspaceId, "failure");
  const learnings = listLearningRecords(workspaceId).filter(
    (l) => l.tags.some((t) => t.toLowerCase() === category) || l.observation.toLowerCase().includes(category),
  );
  const edges = listKnowledgeEdges(workspaceId);

  const similarLaunches: ReasoningEvidence[] = launches.map((launch) =>
    evidence(
      `Similar ${category} launch: ${launch.displayName}`,
      `Launch object ${launch.objectId} with outcome ${String(launch.attributes.outcome ?? "unknown")}`,
      launch.confidence,
      [launch.objectId],
      "knowledge_graph",
    ),
  );

  const successfulCountries: ReasoningEvidence[] = [];
  for (const success of successes) {
    const countries = findRelatedObjects(workspaceId, success.objectId, "LAUNCHED_IN");
    for (const country of countries) {
      if (success.tags.includes(category) || String(success.attributes.category ?? "") === category) {
        successfulCountries.push(
          evidence(
            `${country.displayName} succeeded for ${category}`,
            success.displayName,
            success.confidence,
            [success.objectId, country.objectId],
            "knowledge_graph",
          ),
        );
      }
    }
    const viaSuccess = edges.filter((e) => e.fromObjectId === success.objectId && e.relationship === "LAUNCHED_IN");
    for (const e of viaSuccess) {
      successfulCountries.push(
        evidence(
          `Success linked to country via graph`,
          e.evidence ?? e.relationship,
          e.weight,
          [e.fromObjectId, e.toObjectId],
          "knowledge_graph",
        ),
      );
    }
  }

  const failedSuppliers: ReasoningEvidence[] = [];
  for (const fail of failures) {
    const suppliers = findRelatedObjects(workspaceId, fail.objectId, "LEARNED_FROM");
    for (const supplier of suppliers) {
      failedSuppliers.push(
        evidence(
          `Supplier ${supplier.displayName} associated with failure`,
          fail.displayName,
          fail.confidence,
          [fail.objectId, supplier.objectId],
          "knowledge_graph",
        ),
      );
    }
  }

  const bestMarketplaces: ReasoningEvidence[] = [];
  for (const success of successes) {
    const marketplaces = findRelatedObjects(workspaceId, success.objectId, "PERFORMED_BEST_ON");
    for (const mp of marketplaces) {
      bestMarketplaces.push(
        evidence(
          `${mp.displayName} performed best`,
          success.displayName,
          Math.round((success.confidence + mp.confidence) / 2),
          [success.objectId, mp.objectId],
          "knowledge_graph",
        ),
      );
    }
  }

  const repeatingPatterns: ReasoningEvidence[] = learnings
    .filter((l) => l.tags.includes("pattern") || l.observation.toLowerCase().includes("pattern") || l.observation.toLowerCase().includes("repeat"))
    .map((l) =>
      evidence(
        l.observation,
        l.evidence,
        l.confidence,
        l.relatedObjectIds,
        l.source,
      ),
    );

  for (const product of products) {
    const productLearnings = listLearningsByObject(workspaceId, product.objectId);
    for (const l of productLearnings) {
      if (!repeatingPatterns.some((p) => p.claim === l.observation)) {
        repeatingPatterns.push(
          evidence(l.observation, l.evidence, l.confidence, l.relatedObjectIds, l.source),
        );
      }
    }
  }

  const allEvidence = [...similarLaunches, ...successfulCountries, ...failedSuppliers, ...bestMarketplaces, ...repeatingPatterns];
  const overallConfidence = allEvidence.length
    ? Math.round(allEvidence.reduce((s, e) => s + e.confidence, 0) / allEvidence.length)
    : 30;

  return {
    reasoningId: randomUUID(),
    workspaceId,
    productCategory: input.productCategory,
    productName: input.productName,
    similarLaunches,
    successfulCountries,
    failedSuppliers,
    bestMarketplaces,
    repeatingPatterns,
    overallConfidence,
    summary: allEvidence.length
      ? `Found ${similarLaunches.length} similar launches, ${successfulCountries.length} successful countries, ${failedSuppliers.length} supplier failures, ${bestMarketplaces.length} top marketplaces, ${repeatingPatterns.length} repeating patterns for ${category}`
      : `Insufficient knowledge for ${category} — seed more learning records`,
    computedAt: new Date().toISOString(),
  };
}
