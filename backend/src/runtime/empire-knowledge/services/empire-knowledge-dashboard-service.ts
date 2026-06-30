import type { EmpireKnowledgeDashboard } from "../models/knowledge-dashboard.js";
import { countKnowledgeObjectsByType, listKnowledgeObjects } from "./knowledge-object-service.js";
import { getGraphStats } from "./knowledge-graph-service.js";
import {
  averageLearningConfidence,
  countLearningsByImportance,
  countLearningsBySource,
  listLearningRecords,
} from "./learning-record-service.js";
import { ensureKnowledgeSeeded } from "./knowledge-object-service.js";

function detectPatterns(workspaceId: string, tag: "success" | "failure") {
  const records = listLearningRecords(workspaceId).filter((l) => l.tags.includes(tag) || l.tags.includes("pattern"));
  const patterns = new Map<string, { count: number; evidence: string }>();

  for (const r of records) {
    const key = r.observation.slice(0, 80);
    const existing = patterns.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      patterns.set(key, { count: 1, evidence: r.evidence });
    }
  }

  return [...patterns.entries()]
    .filter(([, v]) => v.count >= 1)
    .map(([pattern, v]) => ({ pattern, count: v.count, evidence: v.evidence }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/** K-005 — Mission Control Knowledge dashboard. */
export function buildEmpireKnowledgeDashboard(workspaceId: string, companyId?: string): EmpireKnowledgeDashboard {
  ensureKnowledgeSeeded(workspaceId, companyId);

  const byType = countKnowledgeObjectsByType(workspaceId);
  const totalObjects = Object.values(byType).reduce((s, n) => s + n, 0);
  const learnings = listLearningRecords(workspaceId);
  const graphStats = getGraphStats(workspaceId);
  const objects = listKnowledgeObjects(workspaceId);

  const objectConfidence = objects.length
    ? Math.round(objects.reduce((s, o) => s + o.confidence, 0) / objects.length)
    : 0;
  const learningConfidence = averageLearningConfidence(workspaceId);
  const avgConfidence = objects.length || learnings.length
    ? Math.round((objectConfidence + learningConfidence) / (objectConfidence && learningConfidence ? 2 : 1))
    : 0;

  const topDiscoveries = learnings
    .sort((a, b) => {
      const imp = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (imp[b.importance] - imp[a.importance]) || (b.confidence - a.confidence);
    })
    .slice(0, 5)
    .map((l) => ({
      learningId: l.learningId,
      observation: l.observation,
      confidence: l.confidence,
      importance: l.importance,
    }));

  return {
    moduleId: "empire-knowledge",
    missionId: "K-001-K-005",
    knowledgeObjects: { total: totalObjects, byType },
    learningRecords: {
      total: learnings.length,
      byImportance: countLearningsByImportance(workspaceId),
      bySource: countLearningsBySource(workspaceId),
    },
    topDiscoveries,
    repeatedSuccessPatterns: detectPatterns(workspaceId, "success"),
    repeatedFailurePatterns: detectPatterns(workspaceId, "failure"),
    confidenceGrowth: {
      averageConfidence: avgConfidence,
      objectConfidence,
      learningConfidence,
      trend: learnings.length >= 3 ? "GROWING" : learnings.length > 0 ? "STABLE" : "INSUFFICIENT_DATA",
    },
    knowledgeCoverage: {
      countries: byType.country ?? 0,
      marketplaces: byType.marketplace ?? 0,
      products: byType.product ?? 0,
      suppliers: byType.supplier ?? 0,
      graphEdges: graphStats.edges,
      graphNodes: graphStats.nodes,
    },
    computedAt: new Date().toISOString(),
  };
}

export function buildEsisEmpireKnowledgePayload(workspaceId: string, companyId?: string) {
  const dash = buildEmpireKnowledgeDashboard(workspaceId, companyId);
  return {
    module: "empire-knowledge",
    knowledgeObjects: dash.knowledgeObjects.total,
    learningRecords: dash.learningRecords.total,
    graphEdges: dash.knowledgeCoverage.graphEdges,
  };
}
