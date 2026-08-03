import type { DecisionEngineConfiguration } from "./configuration.js";
import type { CandidateOption, DecisionEngineInput } from "./types.js";

type OptionBlueprint = {
  title: string;
  description: string;
  approach: string;
  tags: string[];
  match: (objective: string, hints: string[]) => boolean;
};

const BLUEPRINTS: OptionBlueprint[] = [
  {
    title: "Accelerate full commitment",
    description: "Commit resources immediately to maximize speed and capture value early",
    approach: "aggressive_commit",
    tags: ["speed", "high_value", "high_resource", "high_risk"],
    match: (o, h) =>
      /expand|launch|scale|grow|enter|capture|accelerate/i.test(o) ||
      h.some((x) => /speed|aggressive|fast/i.test(x)),
  },
  {
    title: "Phased controlled rollout",
    description: "Stage delivery to reduce risk while preserving strategic progress",
    approach: "phased_rollout",
    tags: ["balanced", "moderate_cost", "moderate_risk", "governance"],
    match: () => true,
  },
  {
    title: "Pilot then decide",
    description: "Run a bounded pilot to gather evidence before larger commitment",
    approach: "pilot_first",
    tags: ["learning", "low_cost", "low_risk", "evidence"],
    match: (o, h) =>
      /uncertain|unknown|validate|test|pilot|experiment/i.test(o) ||
      h.some((x) => /pilot|evidence|uncertainty/i.test(x)) ||
      true,
  },
  {
    title: "Defer and monitor",
    description: "Postpone execution while monitoring triggers and preserving optionality",
    approach: "defer_monitor",
    tags: ["optionality", "low_cost", "time_sensitive", "conservative"],
    match: (o, h) =>
      /defer|delay|wait|pause|monitor/i.test(o) ||
      h.some((x) => /defer|wait|optionality/i.test(x)),
  },
  {
    title: "Cost-optimized redesign",
    description: "Re-scope the approach to minimize cost and complexity while meeting core intent",
    approach: "cost_optimize",
    tags: ["efficiency", "low_cost", "simpler", "margin"],
    match: (o, h) =>
      /cost|efficien|budget|margin|simplify|reduce/i.test(o) ||
      h.some((x) => /cost|budget|efficiency/i.test(x)),
  },
  {
    title: "Partner or outsource path",
    description: "Use external capability to reduce internal resource load and time-to-outcome",
    approach: "partner_outsource",
    tags: ["dependency", "speed", "external", "moderate_risk"],
    match: (o, h) =>
      /partner|outsourc|vendor|supplier|alliance/i.test(o) ||
      h.some((x) => /partner|vendor|external/i.test(x)),
  },
];

let optionSequence = 0;

export class OptionGenerator {
  generate(input: DecisionEngineInput, configuration: DecisionEngineConfiguration): CandidateOption[] {
    const objective = input.executiveObjective.trim();
    const hints = [
      ...(input.contextHints ?? []),
      ...(input.constraintHints ?? []),
      ...(input.riskHints ?? []),
    ];

    const fromHints = (input.optionHints ?? []).map((hint, index) => {
      optionSequence += 1;
      return {
        optionId: `de-opt-${Date.now()}-${optionSequence}`,
        title: hint.title.trim() || `Custom option ${index + 1}`,
        description: (hint.description ?? hint.title).trim(),
        approach: (hint.approach ?? "custom_hint").trim() || "custom_hint",
        tags: ["custom", "hint_provided"],
      } satisfies CandidateOption;
    });

    const matched = BLUEPRINTS.filter((bp) => bp.match(objective, hints)).map((bp) => {
      optionSequence += 1;
      return {
        optionId: `de-opt-${Date.now()}-${optionSequence}`,
        title: bp.title,
        description: `${bp.description} for: ${truncate(objective, 80)}`,
        approach: bp.approach,
        tags: [...bp.tags],
      } satisfies CandidateOption;
    });

    const combined = [...fromHints, ...matched];
    const unique: CandidateOption[] = [];
    const seen = new Set<string>();
    for (const option of combined) {
      const key = option.approach.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(option);
      if (unique.length >= configuration.maxCandidateOptions) break;
    }

    while (unique.length < configuration.minCandidateOptions) {
      optionSequence += 1;
      unique.push({
        optionId: `de-opt-${Date.now()}-${optionSequence}`,
        title: `Structured alternative ${unique.length + 1}`,
        description: `Additional evaluated alternative for: ${truncate(objective, 80)}`,
        approach: `structured_alt_${unique.length + 1}`,
        tags: ["balanced", "generated"],
      });
    }

    return unique;
  }
}

export function resetOptionSequenceForTesting() {
  optionSequence = 0;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
