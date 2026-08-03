import type { SkillToolRouterInput } from "./types.js";

/** Analyses executive intent into required capabilities — routing only. */
export class CapabilityAnalyzer {
  analyse(
    input: SkillToolRouterInput,
    capabilityKeywords: Record<string, string[]>,
  ): string[] {
    const preferred = (input.preferredCapabilities ?? [])
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    const text = `${input.executiveRequest} ${input.businessContext ?? ""}`.toLowerCase();
    const matched = new Set<string>(preferred);

    for (const [capability, keywords] of Object.entries(capabilityKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword.toLowerCase()))) {
        matched.add(capability);
      }
    }

    if (matched.size === 0) {
      matched.add("intent_decomposition");
    }

    return [...matched];
  }
}
