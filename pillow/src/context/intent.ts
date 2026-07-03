import type { ContextTask } from "./types.js";

const INTENT_PATTERNS: Array<{ task: ContextTask; patterns: RegExp[] }> = [
  {
    task: "commerce_intelligence",
    patterns: [
      /commerce intelligence/i,
      /product discovery/i,
      /winning product/i,
      /what products should/i,
      /recommend products/i,
      /supplier ranking/i,
      /compare suppliers/i,
      /market opportunity/i,
      /launch plan/i,
      /business launch/i,
      /competitor analysis/i,
      /profit margin/i,
      /dropshipping/i,
      /cj supplier/i,
    ],
  },
  {
    task: "infrastructure",
    patterns: [
      /infrastructure status/i,
      /production readiness/i,
      /railway health/i,
      /vercel health/i,
      /deployment status/i,
      /service availability/i,
      /platform health/i,
      /infrastructure report/i,
      /infrastructure commander/i,
    ],
  },
  {
    task: "cursor_bridge",
    patterns: [
      /deploy latest|deploy to production|prepare production release/i,
      /investigate performance|find architectural weakness|recommend improvements/i,
      /explain current screen|generate three dashboard/i,
      /floating sidebar|engineering chief|cursor bridge/i,
      /dispatch to cursor|autonomous engineering/i,
    ],
  },
  {
    task: "ux_design",
    patterns: [
      /make (the |it )?(homepage|home page|dashboard|page|ui|interface)/i,
      /move (the )?(dashboard|sidebar|panel)/i,
      /increase spacing/i,
      /use darker colou?rs?/i,
      /replace (the )?cards?/i,
      /make it premium/i,
      /apple[- ]style/i,
      /futuristic neon/i,
      /improve readability/i,
      /redesign/i,
      /ux design/i,
      /make .+ pink/i,
      /change (the )?colou?r/i,
      /more spacing/i,
      /premium design/i,
      /neon/i,
    ],
  },
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
    task: "repository_intelligence",
    patterns: [
      /where is .+ implement/i,
      /who owns .+ module/i,
      /which file renders/i,
      /what depends on/i,
      /what happens if .+ change/i,
      /how does .+ (flow|runtime|deploy|startup)/i,
      /which mission introduced/i,
      /repository intelligence/i,
      /codebase architecture/i,
      /system boundary/i,
    ],
  },
  {
    task: "technical_chief",
    patterns: [
      /root cause/i,
      /why did this fail/i,
      /why is this broken/i,
      /diagnose/i,
      /diagnosis/i,
      /technical chief/i,
      /engineering plan/i,
      /what is the safest fix/i,
      /what broke/i,
      /failed to fetch/i,
      /502|503|504/i,
      /certify/i,
      /certification/i,
      /review cursor/i,
      /what risk/i,
    ],
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
