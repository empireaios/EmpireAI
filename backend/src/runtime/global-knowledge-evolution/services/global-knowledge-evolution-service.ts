import { buildEmpireKnowledgeDashboard } from "../../empire-knowledge/services/empire-knowledge-dashboard-service.js";
import type { GlobalKnowledgeEvolution } from "../models/global-knowledge-evolution.js";
import { KNOWLEDGE_LEARNING_SOURCES } from "../models/global-knowledge-evolution.js";

const SOURCE_LABELS: Record<(typeof KNOWLEDGE_LEARNING_SOURCES)[number], string> = {
  products: "Products",
  countries: "Countries",
  customers: "Customers",
  suppliers: "Suppliers",
  marketplaces: "Marketplaces",
  executives: "Executives",
  soul: "Soul",
  grand_king: "Grand King",
};

/** REAL-042 — Global knowledge evolution (wraps empire-knowledge dashboard). */
export function buildGlobalKnowledgeEvolution(
  workspaceId: string,
  companyId: string,
): GlobalKnowledgeEvolution {
  const empireKnowledge = buildEmpireKnowledgeDashboard(workspaceId, companyId);
  const byType = empireKnowledge.knowledgeObjects.byType;
  const bySource = empireKnowledge.learningRecords.bySource;

  const sourceMapping: Record<(typeof KNOWLEDGE_LEARNING_SOURCES)[number], { objects: number; learnings: number }> = {
    products: { objects: byType.product ?? 0, learnings: bySource.product ?? 0 },
    countries: { objects: byType.country ?? 0, learnings: bySource.country ?? 0 },
    customers: { objects: byType.customer ?? 0, learnings: bySource.customer ?? 0 },
    suppliers: { objects: byType.supplier ?? 0, learnings: bySource.supplier ?? 0 },
    marketplaces: { objects: byType.marketplace ?? 0, learnings: bySource.marketplace ?? 0 },
    executives: { objects: byType.executive ?? 0, learnings: bySource.executive ?? 0 },
    soul: { objects: byType.soul ?? 0, learnings: bySource.soul ?? 0 },
    grand_king: { objects: byType.grand_king ?? 0, learnings: bySource.grand_king ?? 0 },
  };

  const learningSources = KNOWLEDGE_LEARNING_SOURCES.map((sourceId) => {
    const mapped = sourceMapping[sourceId];
    return {
      sourceId,
      label: SOURCE_LABELS[sourceId],
      objectCount: mapped.objects,
      learningCount: mapped.learnings,
      confidence: empireKnowledge.confidenceGrowth.averageConfidence,
    };
  });

  return {
    moduleId: "global-knowledge-evolution",
    missionId: "REAL-042",
    workspaceId,
    companyId,
    empireKnowledge: empireKnowledge as unknown as Record<string, unknown>,
    learningSources,
    evolutionSummary: {
      totalObjects: empireKnowledge.knowledgeObjects.total,
      totalLearnings: empireKnowledge.learningRecords.total,
      avgConfidence: empireKnowledge.confidenceGrowth.averageConfidence,
      trend: empireKnowledge.confidenceGrowth.trend,
    },
    reusedModules: ["empire-knowledge"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
