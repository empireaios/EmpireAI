import { buildAiStrategicMemory } from "../../ai-strategic-memory/services/ai-strategic-memory-service.js";
import { buildEmpirePlaybookEngine } from "../../empire-playbook-engine/services/empire-playbook-engine-service.js";
import type { EmpirePatternLibrary } from "../models/empire-pattern-library.js";

type PatternItem = EmpirePatternLibrary["items"][number];

const PATTERN_DEFS: Array<{
  itemId: string;
  label: string;
  memoryCategory: string;
  playbookId?: string;
  recommendation: string;
}> = [
  { itemId: "pattern-winning-launch", label: "Winning launch pattern", memoryCategory: "successes", playbookId: "Product Launch", recommendation: "GKR pipeline → executive debate → King approval → go live" },
  { itemId: "pattern-failed-launch", label: "Failed launch pattern", memoryCategory: "failures", playbookId: "Failure", recommendation: "Post-mortem → strategic memory record → pipeline archive" },
  { itemId: "pattern-supplier-lesson", label: "Supplier selection lesson", memoryCategory: "supplierLessons", playbookId: "Supplier Selection", recommendation: "Score suppliers → sample order → fulfillment attach → SLA sign-off" },
  { itemId: "pattern-marketplace-lesson", label: "Marketplace launch lesson", memoryCategory: "businessLessons", playbookId: "Marketplace Launch", recommendation: "OAR credential → catalog sync → listing publish → monitor" },
  { itemId: "pattern-country-lesson", label: "Country expansion lesson", memoryCategory: "businessLessons", playbookId: "Country Launch", recommendation: "US-first proof → regulatory check → localization → launch review" },
  { itemId: "pattern-pricing-lesson", label: "Pricing & margin lesson", memoryCategory: "capitalLessons", recommendation: "CONSTITUTION-023 — net profit before revenue vanity on every SKU" },
  { itemId: "pattern-scaling-winner", label: "Scaling winner pattern", memoryCategory: "successes", playbookId: "Scaling", recommendation: "Profit validation → ad scale → inventory buffer → executive review" },
  { itemId: "pattern-recovery", label: "Recovery pattern", memoryCategory: "failures", playbookId: "Recovery", recommendation: "Root cause → supplier swap → listing fix → customer outreach" },
];

function patternWhy(label: string, memoryCount: number): string {
  return memoryCount > 0
    ? `${label} documented — repeat on SUCCESS-001 critical path to avoid reinventing decisions`
    : `${label} not yet recorded — capture from GKR pipeline to accelerate USD 100K net profit`;
}

/** REAL-088 — Empire pattern library (playbook engine + strategic memory). */
export function buildEmpirePatternLibrary(
  workspaceId: string,
  companyId: string,
): EmpirePatternLibrary {
  const playbooks = buildEmpirePlaybookEngine(workspaceId, companyId);
  const memory = buildAiStrategicMemory(workspaceId, companyId);
  const items: PatternItem[] = [];

  for (const def of PATTERN_DEFS) {
    const memCount = memory.summary.byCategory[def.memoryCategory] ?? 0;
    const playbook = def.playbookId
      ? playbooks.playbooks.find((p) => p.playbookId === def.playbookId)
      : undefined;
    const score = Math.min(95, 45 + memCount * 10 + (playbook ? 15 : 0));

    items.push({
      itemId: def.itemId,
      label: def.label,
      score,
      status: memCount > 0 || playbook ? "READY" : "PENDING",
      recommendation: playbook
        ? `${def.recommendation} · Owner: ${playbook.executiveOwner} · ${playbook.estimatedDuration}`
        : def.recommendation,
      evidence: playbook
        ? `Playbook "${playbook.playbookId}" · ${memCount} ${def.memoryCategory} memories · phases: ${playbook.phases.join(" → ")}`
        : `${memCount} ${def.memoryCategory} memories · playbook reference pending`,
      why: patternWhy(def.label, memCount),
    });
  }

  for (const mem of memory.recentMemories.slice(0, 4)) {
    items.push({
      itemId: `pattern-memory-${mem.memoryId.slice(0, 8)}`,
      label: `Pattern · ${mem.title}`,
      score: mem.importance,
      status: mem.category === "successes" ? "READY" : "PENDING",
      recommendation: mem.category === "successes"
        ? "Add to winning launch playbook checklist"
        : "Add to failure avoidance checklist before next King approval",
      evidence: `Strategic memory ${mem.category} · importance ${mem.importance}`,
      why: patternWhy(mem.title, 1),
    });
  }

  const documented = items.filter((i) => i.status === "READY").length;
  const summary = `REAL-088 · Empire pattern library · ${documented}/${items.length} patterns documented · ${playbooks.playbooks.length} playbooks · ${memory.summary.totalMemories} memories`;

  return {
    moduleId: "empire-pattern-library",
    missionId: "REAL-088",
    workspaceId,
    companyId,
    summary,
    items,
    reusedModules: ["empire-playbook-engine", "ai-strategic-memory", "strategic-memory-engine"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
