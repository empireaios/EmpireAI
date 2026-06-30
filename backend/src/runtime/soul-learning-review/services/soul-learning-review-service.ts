import { buildAiStrategicMemory } from "../../ai-strategic-memory/services/ai-strategic-memory-service.js";
import type { SoulLearningReview } from "../models/soul-learning-review.js";

type LearningItem = SoulLearningReview["items"][number];

/** REAL-087 — Soul learning review (ai-strategic-memory wrapper, neverExecute). */
export function buildSoulLearningReview(
  workspaceId: string,
  companyId: string,
): SoulLearningReview {
  const memory = buildAiStrategicMemory(workspaceId, companyId);
  const items: LearningItem[] = [];

  for (const category of memory.categories) {
    const qualityScore = Math.min(95, 40 + category.activeCount * 8);
    items.push({
      itemId: `learning-${category.category}`,
      label: `${category.label} · Quality review`,
      score: qualityScore,
      status: category.activeCount > 0 ? "READY" : "PENDING",
      recommendation: category.activeCount > 0
        ? `Apply ${category.lessonFocus} to next executive recommendation`
        : `Record ${category.category} lessons from pipeline outcomes`,
      evidence: `${category.activeCount} active memories · focus: ${category.lessonFocus}`,
      why: category.activeCount > 0
        ? `Past ${category.category} lessons improve Soul reasoning quality toward SUCCESS-001 — neverExecute: true`
        : `Missing ${category.category} memory slows SUCCESS-001 learning loop — capture wins and failures`,
    });
  }

  for (const mem of memory.recentMemories) {
    const isSuccess = mem.category === "successes";
    items.push({
      itemId: `memory-${mem.memoryId.slice(0, 8)}`,
      label: `${isSuccess ? "Success" : "Lesson"} · ${mem.title}`,
      score: mem.importance,
      status: isSuccess ? "READY" : "PENDING",
      recommendation: isSuccess
        ? "Repeat this pattern on next product launch"
        : "Avoid repeating this failure in supplier or marketplace selection",
      evidence: `Category ${mem.category} · importance ${mem.importance}/100`,
      why: isSuccess
        ? `Winning pattern "${mem.title}" increases SUCCESS-001 probability when replicated — Soul recommends only`
        : `Failure lesson "${mem.title}" prevents capital waste on SUCCESS-001 critical path — Soul recommends only`,
    });
  }

  items.push({
    itemId: "learning-recommendation-quality",
    label: "Recommendation quality score",
    score: Math.round(
      memory.recentMemories.reduce((s, m) => s + m.importance, 0) / Math.max(memory.recentMemories.length, 1),
    ),
    status: memory.summary.totalMemories >= 5 ? "READY" : "PENDING",
    recommendation: memory.summary.totalMemories >= 5
      ? "Soul reasoning calibrated — continue recording post-launch outcomes"
      : "Seed strategic memories from GKR pipeline and playbook post-mortems",
    evidence: `${memory.summary.totalMemories} total memories across ${memory.categories.length} categories`,
    why: "Higher recommendation quality reduces bad King decisions — accelerates USD 100K net profit (SUCCESS-001) with neverExecute: true",
  });

  const summary = `REAL-087 · Soul learning review · ${memory.summary.totalMemories} memories · neverExecute: true · Soul recommends only — Grand King decides`;

  return {
    moduleId: "soul-learning-review",
    missionId: "REAL-087",
    workspaceId,
    companyId,
    summary,
    items,
    reusedModules: ["ai-strategic-memory", "strategic-memory-engine"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
