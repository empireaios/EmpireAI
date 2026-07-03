import type { BridgeInstruction, BridgeInstructionKind } from "./types.js";

const KIND_PATTERNS: Array<{ kind: BridgeInstructionKind; patterns: RegExp[] }> = [
  {
    kind: "ux_change",
    patterns: [
      /homepage|dashboard|pink|spacing|redesign|sidebar|navigation|colou?r|premium|neon|apple/i,
      /move .+ left|replace card|make it/i,
    ],
  },
  {
    kind: "deployment",
    patterns: [/deploy|production release|push to prod|vercel|railway|release latest/i],
  },
  {
    kind: "investigation",
    patterns: [/investigate|performance|slow|broken|fail|502|503|504|diagnose|root cause/i],
  },
  {
    kind: "cursor_review",
    patterns: [/review cursor|cursor work|validate implementation|check cursor/i],
  },
  {
    kind: "architecture",
    patterns: [/architectural weakness|architecture|weakness|system boundary|refactor/i],
  },
  {
    kind: "release",
    patterns: [/prepare production|production release|go live|version 1|certification/i],
  },
];

export function routeBridgeInstruction(instruction: string): BridgeInstruction {
  const normalized = instruction.trim();
  let kind: BridgeInstructionKind = "generic_engineering";

  for (const { kind: k, patterns } of KIND_PATTERNS) {
    if (patterns.some((p) => p.test(normalized))) {
      kind = k;
      break;
    }
  }

  const keywords = extractKeywords(normalized);

  return {
    rawInstruction: instruction,
    kind,
    summary: `Engineering instruction (${kind}): ${normalized.slice(0, 120)}`,
    keywords,
  };
}

function extractKeywords(text: string): string[] {
  const found = text.toLowerCase().match(
    /\b(deploy|homepage|dashboard|cursor|performance|release|pink|sidebar|railway|vercel|github|browser|investigate|review)\b/g,
  );
  return [...new Set(found ?? [])];
}
