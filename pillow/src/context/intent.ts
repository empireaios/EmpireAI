import type { ContextTask } from "./types.js";

const INTENT_PATTERNS: Array<{ task: ContextTask; patterns: RegExp[] }> = [
  {
    task: "continue_ux",
    patterns: [/continue ux/i, /ux mission/i, /next ux/i, /ux-\d{3}/i],
  },
  {
    task: "generate_cursor_mission",
    patterns: [
      /generate cursor mission/i,
      /cursor mission/i,
      /draft mission/i,
      /pillow-\d{3}/i,
    ],
  },
  {
    task: "review_executive_audit",
    patterns: [
      /review executive audit/i,
      /executive audit/i,
      /audit review/i,
      /closeout/i,
    ],
  },
  {
    task: "empire_progress",
    patterns: [
      /how is empire progressing/i,
      /empire progress/i,
      /where are we/i,
      /current position/i,
      /journey position/i,
    ],
  },
  {
    task: "journey_question",
    patterns: [/journey/i, /where is the empire/i],
  },
  {
    task: "architecture",
    patterns: [/architecture/i, /pillow architecture/i, /subsystem/i],
  },
  {
    task: "recovery",
    patterns: [/recovery/i, /empire recovery/i, /workstation/i],
  },
];

/** Detect context task from user message (PILLOW-004). */
export function detectContextTask(userMessage?: string): ContextTask {
  if (!userMessage?.trim()) return "general";

  const text = userMessage.trim();

  for (const { task, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(text))) {
      return task;
    }
  }

  return "general";
}

export function resolveContextTask(
  userMessage?: string,
  explicitTask?: ContextTask,
): ContextTask {
  return explicitTask ?? detectContextTask(userMessage);
}
