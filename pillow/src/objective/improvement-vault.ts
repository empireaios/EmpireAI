import { randomUUID } from "node:crypto";

import type { ImprovementVaultCategory } from "./constitution.js";
import type {
  ImprovementVaultEntry,
  ImprovementVaultState,
  ProposedAction,
} from "./types.js";

const CATEGORY_PATTERNS: Array<{ category: ImprovementVaultCategory; patterns: string[] }> = [
  { category: "architecture_idea", patterns: ["architecture", "doctrine", "subsystem", "boundary"] },
  { category: "ux_improvement", patterns: ["ux", "aesthetic", "dashboard", "ui", "design"] },
  { category: "commercial_idea", patterns: ["commercial", "marketplace", "revenue", "pricing", "customer"] },
  { category: "future_enhancement", patterns: ["version 2", "post-v1", "future", "enhancement"] },
  { category: "research", patterns: ["research", "investigate", "explore", "study"] },
];

function inferVaultCategory(action: ProposedAction): ImprovementVaultCategory {
  const explicit = action.metadata?.vaultCategory;
  if (typeof explicit === "string") {
    return explicit as ImprovementVaultCategory;
  }

  const haystack = [action.title, action.summary, ...(action.tags ?? [])].join(" ").toLowerCase();
  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.some((pattern) => haystack.includes(pattern))) {
      return category;
    }
  }
  return "unrelated_discovery";
}

/**
 * Improvement Vault — stores non-objective ideas quietly without interrupting Grand King.
 * Constitutional authority: EMPIREAI_PILLOW_CONSTITUTION.md §5.
 */
export class ImprovementVault {
  private entries = new Map<string, ImprovementVaultEntry>();

  store(action: ProposedAction, state: ImprovementVaultState = "stored"): ImprovementVaultEntry {
    const entry: ImprovementVaultEntry = {
      entryId: randomUUID(),
      title: action.title,
      summary: action.summary,
      state,
      category: inferVaultCategory(action),
      sourceActionId: action.actionId,
      storedAt: new Date().toISOString(),
      tags: action.tags ?? [],
    };
    this.entries.set(entry.entryId, entry);
    return entry;
  }

  summaryCount(): number {
    return [...this.entries.values()].filter(
      (entry) => !["rejected", "ignored_forever"].includes(entry.state),
    ).length;
  }

  listForReview(objectiveComplete: boolean, explicitReview = false): ImprovementVaultEntry[] {
    if (!objectiveComplete && !explicitReview) return [];
    return [...this.entries.values()].filter(
      (entry) => entry.state === "stored" || entry.state === "deferred",
    );
  }

  get(entryId: string): ImprovementVaultEntry | null {
    return this.entries.get(entryId) ?? null;
  }

  setState(entryId: string, state: ImprovementVaultState): ImprovementVaultEntry | null {
    const entry = this.entries.get(entryId);
    if (!entry) return null;
    const updated = { ...entry, state };
    this.entries.set(entryId, updated);
    return updated;
  }

  promote(entryId: string): ImprovementVaultEntry | null {
    return this.setState(entryId, "promoted");
  }

  reject(entryId: string): ImprovementVaultEntry | null {
    return this.setState(entryId, "rejected");
  }

  ignoreForever(entryId: string): ImprovementVaultEntry | null {
    return this.setState(entryId, "ignored_forever");
  }

  defer(entryId: string): ImprovementVaultEntry | null {
    return this.setState(entryId, "deferred");
  }

  listAll(): ImprovementVaultEntry[] {
    return [...this.entries.values()];
  }

  clear(): void {
    this.entries.clear();
  }
}
