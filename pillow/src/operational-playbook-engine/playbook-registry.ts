import { OPBK_METADATA_VERSION } from "./paths.js";
import type { PlaybookRecord, PlaybookStep } from "./types.js";

/** Versioned playbook registry — registration and retrieval only. */
export class PlaybookRegistry {
  private playbooks = new Map<string, PlaybookRecord>();

  seed(playbooks: PlaybookRecord[]) {
    this.playbooks.clear();
    for (const playbook of playbooks) {
      this.playbooks.set(playbook.playbookId, clone(playbook));
    }
  }

  list() {
    return [...this.playbooks.values()].map(clone);
  }

  get(playbookId: string) {
    const playbook = this.playbooks.get(playbookId);
    return playbook ? clone(playbook) : null;
  }

  register(input: Partial<PlaybookRecord>, supportedCategories: string[]): PlaybookRecord {
    const playbookId = input.playbookId?.trim() || `opbk-custom-${Date.now()}`;
    const existing = this.playbooks.get(playbookId);
    const category = String(input.category ?? existing?.category ?? "operations").toLowerCase();
    if (!supportedCategories.includes(category) && !(PLAYBOOK_FALLBACK_CATEGORIES as readonly string[]).includes(category)) {
      // Still allow registration into extensible category space; caller validates supported set.
    }
    const steps = normalizeSteps(input.executionSteps ?? existing?.executionSteps ?? []);
    const record: PlaybookRecord = {
      playbookId,
      version: input.version?.trim() || bumpVersion(existing?.version ?? "0.0.0"),
      category,
      name: input.name?.trim() || existing?.name || playbookId,
      purpose: input.purpose?.trim() || existing?.purpose || "Approved operational playbook",
      preconditions: unique(input.preconditions ?? existing?.preconditions ?? []),
      executionSteps: steps,
      requiredCapabilities: unique(input.requiredCapabilities ?? existing?.requiredCapabilities ?? deriveCapabilities(steps)),
      requiredTools: unique(input.requiredTools ?? existing?.requiredTools ?? deriveTools(steps)),
      approvalRequirements: unique(input.approvalRequirements ?? existing?.approvalRequirements ?? ["pillow_approval"]),
      successCriteria: unique(input.successCriteria ?? existing?.successCriteria ?? ["steps_prepared"]),
      failureCriteria: unique(input.failureCriteria ?? existing?.failureCriteria ?? ["prerequisites_failed"]),
      metadataVersion: OPBK_METADATA_VERSION,
      approved: input.approved ?? existing?.approved ?? true,
      active: input.active ?? existing?.active ?? true,
    };
    this.playbooks.set(playbookId, clone(record));
    return clone(record);
  }

  byCategory(category: string) {
    const target = category.toLowerCase();
    return this.list().filter((p) => String(p.category).toLowerCase() === target && p.active && p.approved);
  }
}

const PLAYBOOK_FALLBACK_CATEGORIES = [
  "business",
  "commerce",
  "media",
  "marketplace",
  "marketing",
  "finance",
  "customer_service",
  "operations",
  "recovery",
  "emergency",
] as const;

function clone(playbook: PlaybookRecord): PlaybookRecord {
  return {
    ...playbook,
    preconditions: [...playbook.preconditions],
    executionSteps: playbook.executionSteps.map((s) => ({ ...s })),
    requiredCapabilities: [...playbook.requiredCapabilities],
    requiredTools: [...playbook.requiredTools],
    approvalRequirements: [...playbook.approvalRequirements],
    successCriteria: [...playbook.successCriteria],
    failureCriteria: [...playbook.failureCriteria],
  };
}

function normalizeSteps(steps: PlaybookStep[]): PlaybookStep[] {
  if (!steps.length) {
    return [
      {
        stepId: "s1",
        order: 1,
        action: "Prepare playbook workflow",
        requiredCapability: null,
        requiredTool: null,
      },
    ];
  }
  return steps
    .map((step, index) => ({
      stepId: step.stepId?.trim() || `s${index + 1}`,
      order: Number.isFinite(step.order) ? step.order : index + 1,
      action: step.action?.trim() || `Step ${index + 1}`,
      requiredCapability: step.requiredCapability ?? null,
      requiredTool: step.requiredTool ?? null,
      notes: step.notes ?? null,
    }))
    .sort((a, b) => a.order - b.order);
}

function deriveCapabilities(steps: PlaybookStep[]) {
  return steps.map((s) => s.requiredCapability).filter((v): v is string => Boolean(v));
}

function deriveTools(steps: PlaybookStep[]) {
  return steps.map((s) => s.requiredTool).filter((v): v is string => Boolean(v));
}

function unique(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function bumpVersion(version: string) {
  const parts = version.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    return `${parts[0]}.${parts[1]}.${parts[2]! + 1}`;
  }
  return "1.0.0";
}
