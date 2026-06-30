import { buildAiStrategicMemory } from "../../ai-strategic-memory/services/ai-strategic-memory-service.js";
import type { CommercialMemoryEngine } from "../models/commercial-memory-engine.js";

const CATEGORY_MAP: Record<string, { category: "winning" | "failed" | "lessons"; label: string; lessonFocus: string }> = {
  successes: { category: "winning", label: "Winning Patterns", lessonFocus: "Repeatable commercial wins across marketplaces" },
  failures: { category: "failed", label: "Failed Attempts", lessonFocus: "Avoid repeated product and supplier mistakes" },
  businessLessons: { category: "lessons", label: "Business Lessons", lessonFocus: "Country and marketplace business model insights" },
  capitalLessons: { category: "lessons", label: "Capital Lessons", lessonFocus: "Budget allocation and ROI optimization" },
  supplierLessons: { category: "lessons", label: "Supplier Lessons", lessonFocus: "Supplier reliability and quality patterns" },
  marketingLessons: { category: "lessons", label: "Marketing Lessons", lessonFocus: "Campaign performance patterns" },
};

/** REAL-060 — Commercial memory engine (wraps ai-strategic-memory with winning/failed/lessons categories). */
export function buildCommercialMemoryEngine(
  workspaceId: string,
  companyId: string,
): CommercialMemoryEngine {
  const strategic = buildAiStrategicMemory(workspaceId, companyId);

  const grouped = { winning: 0, failed: 0, lessons: 0 };
  for (const cat of strategic.categories) {
    const mapped = CATEGORY_MAP[cat.category];
    if (mapped) grouped[mapped.category] += cat.activeCount;
  }

  const categories = (["winning", "failed", "lessons"] as const).map((category) => ({
    category,
    label: category === "winning" ? "Winning Patterns" : category === "failed" ? "Failed Attempts" : "Commercial Lessons",
    activeCount: grouped[category],
    lessonFocus: category === "winning"
      ? "Repeat winning product and marketplace patterns"
      : category === "failed"
        ? "Document failures to prevent repeat losses"
        : "Cross-domain lessons for Grand King decisions",
  }));

  const recentMemories = strategic.recentMemories.map((m) => {
    const mapped = CATEGORY_MAP[m.category];
    return {
      memoryId: m.memoryId,
      category: mapped?.category ?? "lessons",
      title: m.title,
      importance: m.importance,
    };
  });

  return {
    moduleId: "commercial-memory-engine",
    missionId: "REAL-060",
    workspaceId,
    companyId,
    summary: {
      totalMemories: strategic.summary.totalMemories,
      byCategory: grouped,
      computedAt: strategic.summary.computedAt,
    },
    categories,
    recentMemories,
    reusedModules: ["ai-strategic-memory", "strategic-memory-engine"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
