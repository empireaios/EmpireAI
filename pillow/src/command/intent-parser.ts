import type { CommandCategory, CommandIntent } from "./types.js";

interface IntentPattern {
  intent: CommandIntent;
  category: CommandCategory;
  patterns: RegExp[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: "pause_autonomous",
    category: "automation",
    patterns: [/pause autonomous/i, /pause autonomous work/i, /stop idle/i],
  },
  {
    intent: "resume_autonomous",
    category: "automation",
    patterns: [/resume autonomous/i, /resume autonomous work/i],
  },
  {
    intent: "begin_pillow",
    category: "general",
    patterns: [/begin pillow/i, /start pillow/i, /bootstrap pillow/i],
  },
  {
    intent: "generate_cursor_mission",
    category: "engineering",
    patterns: [/generate cursor mission/i, /cursor mission/i, /draft mission/i],
  },
  {
    intent: "build_next_mission",
    category: "mission_planning",
    patterns: [/build the next mission/i, /build next mission/i, /next mission/i],
  },
  {
    intent: "whats_next",
    category: "mission_planning",
    patterns: [/what'?s next/i, /what is next/i, /what should we do/i],
  },
  {
    intent: "continue",
    category: "engineering",
    patterns: [/^continue\.?$/i, /^continue$/i, /keep going/i, /proceed/i],
  },
  {
    intent: "recover_cursor",
    category: "recovery",
    patterns: [/recover cursor/i, /cursor recovery/i, /stall recovery/i],
  },
  {
    intent: "review_repository",
    category: "repository",
    patterns: [/review the repository/i, /review repository/i, /repository review/i],
  },
  {
    intent: "review_progress",
    category: "governance",
    patterns: [/review today'?s progress/i, /today'?s progress/i, /review progress/i],
  },
  {
    intent: "review_architecture",
    category: "architecture",
    patterns: [/review architecture/i, /architecture review/i, /pillow architecture/i],
  },
  {
    intent: "review_empire_health",
    category: "governance",
    patterns: [
      /review empire health/i,
      /empire health/i,
      /repository health/i,
      /how is the empire/i,
    ],
  },
  {
    intent: "review_commercial_readiness",
    category: "commercial",
    patterns: [/commercial readiness/i, /review commercial/i, /proof-001/i, /ms-a/i],
  },
  {
    intent: "prepare_version_1",
    category: "governance",
    patterns: [/prepare version 1/i, /prepare v1/i, /go-live/i, /go live/i],
  },
];

export function parseCommandIntent(command: string): {
  intent: CommandIntent;
  category: CommandCategory;
} {
  const text = command.trim();
  if (!text) {
    return { intent: "unknown", category: "general" };
  }

  for (const { intent, category, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(text))) {
      return { intent, category };
    }
  }

  return { intent: "unknown", category: "general" };
}
