import type { ContextTask } from "../context/types.js";
import type { BrainLLMProviderName } from "./brain-adapter.js";

/** Internal operating modes — user sees unified chat (PILLOW-016). */
export type PillowOperatingMode =
  | "general_intelligence"
  | "empire_operations"
  | "engineering_operations";

export interface PillowTokenBudget {
  maxContextTokens: number;
  maxCompletionTokens: number;
  temperature: number;
}

const MODE_BUDGETS: Record<PillowOperatingMode, PillowTokenBudget> = {
  general_intelligence: {
    maxContextTokens: 8_000,
    maxCompletionTokens: 2_000,
    temperature: 0.4,
  },
  empire_operations: {
    maxContextTokens: 16_000,
    maxCompletionTokens: 2_000,
    temperature: 0.3,
  },
  engineering_operations: {
    maxContextTokens: 24_000,
    maxCompletionTokens: 4_000,
    temperature: 0.2,
  },
};

const ENGINEERING_TASKS = new Set<ContextTask>([
  "continue_ux",
  "generate_cursor_mission",
  "review_executive_audit",
  "architecture",
  "recovery",
]);

const EMPIRE_TASKS = new Set<ContextTask>([
  "empire_progress",
  "journey_question",
]);

export function resolveOperatingMode(task: ContextTask): PillowOperatingMode {
  if (ENGINEERING_TASKS.has(task)) return "engineering_operations";
  if (EMPIRE_TASKS.has(task)) return "empire_operations";
  return "general_intelligence";
}

export function budgetForMode(mode: PillowOperatingMode): PillowTokenBudget {
  return MODE_BUDGETS[mode];
}

export function resolvePreferredProvider(
  available: BrainLLMProviderName[],
  requested?: BrainLLMProviderName,
): BrainLLMProviderName | undefined {
  if (requested && available.includes(requested)) return requested;
  return available[0];
}
