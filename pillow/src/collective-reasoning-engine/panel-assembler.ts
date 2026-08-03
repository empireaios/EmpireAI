import type { CollectiveReasoningEngineInput, ReasoningParticipant } from "./types.js";

/** Identifies required expertise domains from an executive question. */
export class ExpertiseIdentifier {
  identify(
    input: CollectiveReasoningEngineInput,
    expertiseKeywords: Record<string, string[]>,
  ): string[] {
    const preferred = (input.preferredExpertise ?? [])
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const text = `${input.executiveQuestion} ${input.businessContext ?? ""}`.toLowerCase();
    const matched = new Set<string>(preferred);

    for (const [domain, keywords] of Object.entries(expertiseKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword.toLowerCase()))) {
        matched.add(domain);
      }
    }

    if (matched.size === 0) {
      matched.add("strategy");
    }

    return [...matched];
  }
}

/** Assembles a temporary reasoning panel — never permanent assignment. */
export class PanelAssembler {
  assemble(
    catalog: ReasoningParticipant[],
    requiredExpertise: string[],
    input: CollectiveReasoningEngineInput,
    limits: { minPanelSize: number; maxPanelSize: number; defaultPanelSize: number },
  ): ReasoningParticipant[] {
    const preferred = new Set((input.preferredParticipantIds ?? []).filter(Boolean));
    const domains = requiredExpertise.map((d) => d.toLowerCase());

    const scored = catalog
      .map((participant) => {
        const overlap = participant.expertise.filter((e) =>
          domains.some((d) => e.toLowerCase().includes(d) || d.includes(e.toLowerCase())),
        ).length;
        const preferredBoost = preferred.has(participant.workerId) ? 100 : 0;
        return {
          participant,
          score: overlap * 20 + participant.authorityWeight * 0.3 + preferredBoost,
          overlap,
        };
      })
      .filter((entry) => entry.overlap > 0 || preferred.has(entry.participant.workerId))
      .sort((a, b) => b.score - a.score);

    const target = Math.min(
      limits.maxPanelSize,
      Math.max(input.minPanelSize ?? limits.minPanelSize, limits.defaultPanelSize, limits.minPanelSize),
    );

    let selected = scored.slice(0, target).map((e) => e.participant);

    // Ensure both supportive and challenging stances when possible.
    if (!selected.some((p) => p.stanceBias === "challenging")) {
      const challenger = catalog.find(
        (p) => p.stanceBias === "challenging" && !selected.some((s) => s.workerId === p.workerId),
      );
      if (challenger) {
        selected = [...selected.slice(0, Math.max(1, selected.length - 1)), challenger];
      }
    }

    if (selected.length < limits.minPanelSize) {
      const fillers = catalog
        .filter((p) => !selected.some((s) => s.workerId === p.workerId))
        .slice(0, limits.minPanelSize - selected.length);
      selected = [...selected, ...fillers];
    }

    return selected.map((p) => ({ ...p, expertise: [...p.expertise] }));
  }
}
