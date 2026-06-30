import {
  getStrategicMemorySummary,
  listStrategicMemories,
} from "../../../foundation/strategic-memory-engine/services/strategic-memory-engine-service.js";
import { STRATEGIC_MEMORY_CATEGORIES } from "../../../foundation/strategic-memory-engine/models/strategic-memory.js";
import type { AiStrategicMemory } from "../models/ai-strategic-memory.js";

const CATEGORY_LABELS: Record<(typeof STRATEGIC_MEMORY_CATEGORIES)[number], { label: string; lessonFocus: string }> = {
  successes: { label: "Winning Patterns", lessonFocus: "Repeatable success patterns across marketplaces" },
  failures: { label: "Failure Lessons", lessonFocus: "Avoid repeated mistakes in product and supplier selection" },
  architecture: { label: "Architecture Lessons", lessonFocus: "System design and module integration patterns" },
  businessLessons: { label: "Business Lessons", lessonFocus: "Country and marketplace business model insights" },
  capitalLessons: { label: "Capital Lessons", lessonFocus: "Budget allocation and ROI optimization" },
  supplierLessons: { label: "Supplier Lessons", lessonFocus: "Supplier reliability, lead time, and quality" },
  marketingLessons: { label: "Marketing Lessons", lessonFocus: "Campaign and creative performance patterns" },
};

/** REAL-043 — AI strategic memory wrapper (no duplication of strategic-memory-engine). */
export function buildAiStrategicMemory(
  workspaceId: string,
  companyId: string,
): AiStrategicMemory {
  const summary = getStrategicMemorySummary(workspaceId);
  const memories = listStrategicMemories(workspaceId, { status: "ACTIVE" });

  const categories = STRATEGIC_MEMORY_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category].label,
    activeCount: summary.byCategory[category] ?? 0,
    lessonFocus: CATEGORY_LABELS[category].lessonFocus,
  }));

  const recentMemories = memories
    .sort((a, b) => b.importance - a.importance || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8)
    .map((m) => ({
      memoryId: m.memoryId,
      category: m.category,
      title: m.title,
      importance: m.importance,
    }));

  return {
    moduleId: "ai-strategic-memory",
    missionId: "REAL-043",
    workspaceId,
    companyId,
    summary: {
      totalMemories: summary.totalMemories,
      byCategory: summary.byCategory as Record<string, number>,
      computedAt: summary.computedAt,
    },
    categories,
    recentMemories,
    reusedModules: ["strategic-memory-engine"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
