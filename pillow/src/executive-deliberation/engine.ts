/**
 * PILLOW-EDE-001 — Executive Deliberation Engine.
 *
 * Mandatory internal deliberation after Digital Soul compliance and before LLM.
 * Produces concise executive conclusions only — never exposes chain-of-thought.
 */

import type { ExecutiveReasoningComposition } from "../bootstrap/types.js";
import {
  classifySignificance,
  classifyUncertainty,
  detectChallengeStance,
  detectExecutiveRiskThemes,
  looksLikeMajorStrategicRequest,
  type ExecutiveRiskTheme,
} from "./signals.js";
import type {
  DeliberateExecutiveInput,
  DeliberationAlternative,
  ExecutiveDeliberationPublicSummary,
  ExecutiveDeliberationResult,
} from "./types.js";

const METADATA_VERSION = "EDE-001-v1" as const;

function scoreClamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function themeSelectedSummary(themes: ExecutiveRiskTheme[]): string | null {
  if (themes.includes("indiscriminate_listing") || themes.includes("skip_validation")) {
    return "High-volume staged validation: preserve broad opportunity coverage, batch-clear refund/delivery/compliance/margin gates, then scale what passes — do not list indiscriminately";
  }
  if (themes.includes("mass_content_scale")) {
    return "Staged media scale: prove quality and channel learning on a small parallel set, then expand channels and publish rate with retention/quality kill criteria — keep ambition, avoid ungoverned blast";
  }
  if (themes.includes("capital_all_in")) {
    return "Controlled capital allocation: tranche spend against validated milestones within runway and monthly operating constraints — accelerate without concentrating all capital in one irreversible bet";
  }
  if (themes.includes("overprovision_infra")) {
    return "Evidence-based capacity scaling: upgrade only services with observed bottlenecks using clear utilisation triggers — protect reliability without permanent overspend";
  }
  if (themes.includes("refund_policy_unclear") || themes.includes("cheapest_only")) {
    return "Do not select on price alone: require a clear refund/returns policy (or equivalent risk mitigation) before supplier commit; compare total cost of risk, not unit price";
  }
  if (themes.includes("blanket_preapproval")) {
    return "Treat strategic approval as direction, not a waiver: produce an end-to-end execution path that still preserves owner gates for capital, legal, launch, and irreversible actions";
  }
  if (themes.includes("rewrite_for_local_failure")) {
    return "Diagnose the failed module first; prefer the smallest sufficient repair over an architecture rewrite unless evidence shows a systemic design failure";
  }
  if (themes.includes("fabricate_certainty")) {
    return "Provisional recommendation with an explicit evidence-gathering path — useful next moves without fabricated certainty";
  }
  if (themes.includes("suppress_challenge")) {
    return "Disclose material risks and any superior alternative, then execute the Grand King's informed decision unless constitutionally prohibited";
  }
  return null;
}

function buildThemeHiddenRisks(themes: ExecutiveRiskTheme[]): string[] {
  const risks: string[] = [];
  if (themes.includes("skip_validation") || themes.includes("indiscriminate_listing")) {
    risks.push("Refund, delivery, compliance, margin, and marketplace policy exposure from unvalidated listings");
  }
  if (themes.includes("mass_content_scale")) {
    risks.push("Quality collapse, channel learning failure, and platform enforcement risk at ungoverned publish rates");
  }
  if (themes.includes("capital_all_in")) {
    risks.push("Runway and concentration risk if entire available capital is spent without staged validation");
  }
  if (themes.includes("overprovision_infra")) {
    risks.push("Permanent cost waste if upgrades are not tied to measured bottlenecks");
  }
  if (themes.includes("refund_policy_unclear") || themes.includes("cheapest_only")) {
    risks.push("Mandatory refund-policy risk — cheap unit price can destroy margin after returns");
  }
  if (themes.includes("blanket_preapproval")) {
    risks.push("Using blanket approval to skip diligence on capital, legal, launch, or irreversible steps");
  }
  if (themes.includes("rewrite_for_local_failure")) {
    risks.push("Unnecessary redesign cost and delay when a local repair would restore value faster");
  }
  if (themes.includes("fabricate_certainty")) {
    risks.push("False confidence from guessing under missing market evidence");
  }
  if (themes.includes("suppress_challenge")) {
    risks.push("Silent risk if advice is withheld after the Grand King forbids challenge");
  }
  return risks;
}

function buildAlternatives(
  message: string,
  stance: ExecutiveDeliberationResult["challengeStance"],
  themes: ExecutiveRiskTheme[],
): DeliberationAlternative[] {
  const themeSummary = themeSelectedSummary(themes);

  const requested: DeliberationAlternative = {
    alternativeId: "ede-alt-requested",
    summary: "Proceed exactly as requested",
    expectedValue: stance === "respectfully_disagree" ? 35 : stance === "caution" ? 55 : 70,
    risk: stance === "respectfully_disagree" ? 85 : stance === "caution" ? 60 : 35,
    cost: 55,
    complexity: 45,
    longTermSustainability: stance === "respectfully_disagree" ? 25 : 60,
    empireAlignment: stance === "respectfully_disagree" ? 30 : 75,
    selected: stance === "agree",
  };

  const validated: DeliberationAlternative = {
    alternativeId: "ede-alt-validated",
    summary:
      themeSummary ??
      "Validate performance / evidence first, then scale only what clears constitutional and commercial thresholds",
    expectedValue: 80,
    risk: 30,
    cost: 40,
    complexity: 50,
    longTermSustainability: 85,
    empireAlignment: 95,
    selected: stance !== "agree",
  };

  const staged: DeliberationAlternative = {
    alternativeId: "ede-alt-staged",
    summary:
      "Staged pilot with explicit kill criteria, owner-value checkpoint, and reversible spend",
    expectedValue: 75,
    risk: 35,
    cost: 35,
    complexity: 55,
    longTermSustainability: 80,
    empireAlignment: 90,
    selected: false,
  };

  const defer: DeliberationAlternative = {
    alternativeId: "ede-alt-defer",
    summary:
      "Defer irreversible action; gather missing evidence and present a sharper decision package to the Grand King",
    expectedValue: 60,
    risk: 20,
    cost: 20,
    complexity: 30,
    longTermSustainability: 70,
    empireAlignment: 88,
    selected: false,
  };

  if (!looksLikeMajorStrategicRequest(message) && stance === "agree") {
    requested.selected = true;
    return [requested, staged];
  }

  const pool = [requested, validated, staged, defer];
  if (stance !== "agree") {
    for (const a of pool) a.selected = false;
    // Prefer theme-aware validated path; otherwise highest composite
    if (themeSummary) {
      validated.selected = true;
    } else {
      const best = [...pool].sort((a, b) => {
        const score = (x: DeliberationAlternative) =>
          x.expectedValue + x.longTermSustainability + x.empireAlignment - x.risk;
        return score(b) - score(a);
      })[0]!;
      best.selected = true;
    }
  }
  return pool.map((a) => ({
    ...a,
    expectedValue: scoreClamp(a.expectedValue),
    risk: scoreClamp(a.risk),
    cost: scoreClamp(a.cost),
    complexity: scoreClamp(a.complexity),
    longTermSustainability: scoreClamp(a.longTermSustainability),
    empireAlignment: scoreClamp(a.empireAlignment),
  }));
}

function inferObjective(
  message: string,
  currentObjective?: string | null,
  themes: ExecutiveRiskTheme[] = [],
): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  const short = trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;

  let themeObjective: string | null = null;
  if (themes.includes("indiscriminate_listing") || themes.includes("skip_validation")) {
    themeObjective =
      "Advance Probability-at-Scale marketplace coverage without destroying margin, compliance, or marketplace standing";
  } else if (themes.includes("mass_content_scale")) {
    themeObjective =
      "Scale media distribution and learning velocity while protecting quality and platform durability";
  } else if (themes.includes("capital_all_in")) {
    themeObjective =
      "Accelerate EmpireAI with capital while protecting runway and avoiding concentration ruin";
  } else if (themes.includes("overprovision_infra")) {
    themeObjective =
      "Protect reliability with capacity that matches observed demand — not permanent maximum spend";
  } else if (themes.includes("refund_policy_unclear") || themes.includes("cheapest_only")) {
    themeObjective =
      "Select suppliers that maximise durable expected value after refund and fulfilment risk";
  } else if (themes.includes("blanket_preapproval")) {
    themeObjective =
      "Launch the approved business direction with disciplined execution gates still intact";
  } else if (themes.includes("rewrite_for_local_failure")) {
    themeObjective =
      "Restore system integrity with the smallest sufficient correction, not theatre redesign";
  } else if (themes.includes("fabricate_certainty")) {
    themeObjective =
      "Choose a useful provisional path under uncertainty and close the evidence gap quickly";
  }

  if (themeObjective && currentObjective) {
    return `${themeObjective} — while protecting current empire objective: ${currentObjective}`;
  }
  if (themeObjective) return themeObjective;
  if (currentObjective) {
    return `Advance Grand King intent (“${short}”) while protecting the current empire objective: ${currentObjective}`;
  }
  return `Clarify and advance the Grand King's true objective behind: “${short}”`;
}

/**
 * Run mandatory executive deliberation.
 * Internal reasoning stays inside this function; only conclusions are returned.
 */
export function deliberateExecutiveRequest(
  input: DeliberateExecutiveInput,
): ExecutiveDeliberationResult {
  const message = input.userMessage?.trim() || "";
  const themes = detectExecutiveRiskThemes(message);
  const significance = classifySignificance(message);
  const challengeStance = detectChallengeStance(message);
  const uncertaintyLevel = classifyUncertainty(message, input.memoryContext);
  const alternatives = buildAlternatives(message, challengeStance, themes);
  const selected = alternatives.find((a) => a.selected) ?? alternatives[0]!;

  const hiddenRisks: string[] = [...buildThemeHiddenRisks(themes)];
  if (challengeStance === "respectfully_disagree" && hiddenRisks.length === 0) {
    hiddenRisks.push(
      "Requested path risks long-term empire harm or unvalidated expansion",
    );
    hiddenRisks.push("Blind agreement would trade owner value for speed");
  }
  if (/\b(single|one) (channel|vendor|bet)\b/i.test(message)) {
    hiddenRisks.push("Concentration risk — over-reliance on a single bet");
  }
  if (significance === "strategic" && uncertaintyLevel !== "low") {
    hiddenRisks.push("Strategic move under incomplete evidence elevates downside variance");
  }
  if (hiddenRisks.length === 0 && significance !== "routine") {
    hiddenRisks.push("Opportunity cost if a higher-EV alternative is ignored");
  }

  const assumptions = [
    "Grand King seeks durable empire value, not merely immediate agreement",
    challengeStance === "agree"
      ? "Requested direction is compatible with validated performance norms"
      : "Surface request may not be the optimal instrument for the underlying objective",
  ];
  if (themes.includes("suppress_challenge")) {
    assumptions.push(
      "Owner authority is final after informed disclosure — advice is not disobedience",
    );
  }
  if (themes.includes("capital_all_in")) {
    assumptions.push(
      "Where available, respect stated capital envelope (e.g. SGD 10,000) and monthly operating constraint (e.g. SGD 500)",
    );
  }
  if (uncertaintyLevel !== "low") {
    assumptions.push("Current evidence base is incomplete — treat conclusions as provisional");
  }

  const informationGaps: string[] = [];
  if (uncertaintyLevel === "high") {
    informationGaps.push("Clear success metric and decision deadline");
    informationGaps.push("Evidence of validated performance or comparable precedent");
  }
  if (themes.includes("refund_policy_unclear")) {
    informationGaps.push("Documented refund/returns terms and historical return rate");
  }
  if (themes.includes("overprovision_infra")) {
    informationGaps.push("Observed utilisation / bottleneck metrics per service");
  }
  if (significance !== "routine") {
    informationGaps.push("Downside bound and reversibility of the proposed action");
  }
  if (informationGaps.length === 0) {
    informationGaps.push("None material — proceed with stated constraints");
  }

  const longTermConsequence =
    challengeStance === "respectfully_disagree"
      ? "Following the requested path unchecked likely erodes Long-Term Empire Value; the selected alternative preserves optionality and integrity."
      : challengeStance === "caution"
        ? "Unchecked haste could create reversible but costly drag; staged validation protects runway and reputation."
        : "Selected path supports durable owner value if execution stays within constitutional and validated limits.";

  const constitutionalAlignmentNote =
    "Deliberation reinforces Digital Soul duties: truthfulness, no fabrication, Grand King authority on irreversible acts, and Long-Term Empire Value over short-term appeasement.";

  const uncertaintyNote =
    uncertaintyLevel === "high"
      ? "Evidence is weak — state uncertainty explicitly; do not overclaim confidence; still give a useful provisional path and evidence plan."
      : uncertaintyLevel === "moderate"
        ? "Some assumptions remain unproven — flag them before committing capital or irreversible steps."
        : null;

  const ownerValueFocus =
    "Optimise for wisdom, judgement, foresight, strategic thinking, and owner value — not response speed or sycophancy.";

  const objectiveInference = inferObjective(message, input.currentObjective, themes);

  const stanceConclusion =
    themes.includes("suppress_challenge")
      ? "Respect final owner authority after disclosing material risks and any superior alternative; distinguish advice from disobedience; comply with informed approval unless constitutionally prohibited."
      : challengeStance === "respectfully_disagree"
        ? "Respectfully challenge the requested path and recommend a superior alternative."
        : challengeStance === "caution"
          ? "Proceed with caution; surface risks and a safer staged path."
          : "Requested direction is acceptable; still surface material risks and assumptions.";

  const executiveConclusions: string[] = [
    `Objective: ${objectiveInference}`,
    `Stance: ${stanceConclusion}`,
    `Selected approach: ${selected.summary}`,
    significance !== "routine"
      ? `Alternatives compared (${alternatives.length}): prefer highest expected value with acceptable risk, sustainability, and EmpireAI alignment.`
      : "Routine request — light deliberation; answer directly and briefly; no heavyweight strategy framework.",
    hiddenRisks.length > 0
      ? `Hidden risks: ${hiddenRisks.slice(0, 4).join("; ")}`
      : "No critical hidden risks flagged.",
    `Assumptions: ${assumptions.join("; ")}`,
    `Information that would improve the decision: ${informationGaps.slice(0, 2).join("; ")}`,
    `Long-term consequence: ${longTermConsequence}`,
    constitutionalAlignmentNote,
    uncertaintyNote
      ? `Uncertainty (${uncertaintyLevel}): ${uncertaintyNote}`
      : `Uncertainty (${uncertaintyLevel}): evidence sufficient for a provisional executive conclusion.`,
    ownerValueFocus,
    significance === "routine"
      ? "Visible answer: be concise, natural, and directly useful — no deliberation jargon."
      : "Visible answer must include: recommended path, why, main risk, immediate next action, and any approval required.",
    "Never expose chain-of-thought, stance enums, score numbers, or internal scratch reasoning to the Grand King — share concise executive conclusions only.",
  ];

  return {
    deliberationId: `ede-${Date.now()}`,
    deliberatedAt: new Date().toISOString(),
    significance,
    objectiveInference,
    challengeStance,
    selectedApproachSummary: selected.summary,
    alternatives,
    hiddenRisks,
    assumptions,
    informationGaps,
    longTermConsequence,
    constitutionalAlignmentNote,
    uncertaintyLevel,
    uncertaintyNote,
    ownerValueFocus,
    executiveConclusions,
    neverExposeChainOfThought: true,
    metadataVersion: METADATA_VERSION,
  };
}

/**
 * Enrich an executive reasoning composition with mandatory deliberation.
 * Does not redesign Digital Soul — appends conclusions into notes + deliberation field.
 */
export function applyExecutiveDeliberation(
  composition: ExecutiveReasoningComposition,
  input: DeliberateExecutiveInput,
): ExecutiveReasoningComposition {
  const deliberation = deliberateExecutiveRequest({
    userMessage: input.userMessage || composition.currentConversation,
    memoryContext: input.memoryContext,
    currentObjective: input.currentObjective,
  });

  const pipeline = [
    ...composition.pipeline.filter((p) => p !== "response"),
    "executive_deliberation" as const,
    "response" as const,
  ];

  return {
    ...composition,
    pipeline,
    deliberation,
    executiveReasoningNotes: [
      ...composition.executiveReasoningNotes,
      "=== EXECUTIVE DELIBERATION (conclusions only — do not expose chain-of-thought) ===",
      ...deliberation.executiveConclusions,
    ],
  };
}

/** Format deliberation for LLM system prompt — conclusions only. */
export function formatExecutiveDeliberationForLlm(
  deliberation: ExecutiveDeliberationResult,
): string {
  const altLines = deliberation.alternatives.map(
    (a) =>
      `  - [${a.selected ? "SELECTED" : "alt"}] ${a.summary} (EV=${a.expectedValue}, risk=${a.risk}, sustainability=${a.longTermSustainability}, alignment=${a.empireAlignment})`,
  );

  const decisiveness =
    deliberation.significance === "routine"
      ? [
          "RULES FOR THE VISIBLE ANSWER (routine):",
          "- Answer directly and briefly in natural language.",
          "- Do not invent a strategy framework, challenge theatre, or deliberation jargon.",
          "- No stance enums, scores, section numbers, or prompt blocks.",
        ]
      : [
          "RULES FOR THE VISIBLE ANSWER (material decision):",
          "- Lead with the recommended path (the SELECTED approach) in plain language.",
          "- Explain why in 1–3 sentences.",
          "- State the main risk and the immediate next action.",
          "- Name any Grand King approval still required.",
          "- If stance is respectfully_disagree or caution: never blindly agree; recommend the superior path first.",
          "- If the Grand King forbade challenge: still disclose material risks/alternatives, then respect informed owner authority.",
          "- State uncertainty plainly when uncertainty is moderate or high — still give a useful provisional path.",
          "- Remain constitutionally aligned; never fabricate evidence.",
          "- No stance enums, deliberation scores, chain-of-thought, or internal labels in the visible answer.",
        ];

  return [
    "=== EXECUTIVE DELIBERATION (mandatory internal stage — conclusions only) ===",
    `Significance: ${deliberation.significance} · Stance: ${deliberation.challengeStance} · Uncertainty: ${deliberation.uncertaintyLevel}`,
    `Objective inference: ${deliberation.objectiveInference}`,
    `Selected approach: ${deliberation.selectedApproachSummary}`,
    "Alternatives evaluated:",
    ...altLines,
    deliberation.hiddenRisks.length
      ? `Risks: ${deliberation.hiddenRisks.join("; ")}`
      : "Risks: none critical",
    `Long-term: ${deliberation.longTermConsequence}`,
    deliberation.uncertaintyNote
      ? `Uncertainty note: ${deliberation.uncertaintyNote}`
      : null,
    ...decisiveness,
    "",
    "Executive conclusions:",
    ...deliberation.executiveConclusions.map((c) => `- ${c}`),
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

/** Public structured evidence for certification / audit — never CoT. */
export function toExecutiveDeliberationPublicSummary(
  deliberation: ExecutiveDeliberationResult,
): ExecutiveDeliberationPublicSummary {
  return {
    deliberationId: deliberation.deliberationId,
    deliberatedAt: deliberation.deliberatedAt,
    significance: deliberation.significance,
    objectiveInference: deliberation.objectiveInference,
    challengeStance: deliberation.challengeStance,
    selectedApproachSummary: deliberation.selectedApproachSummary,
    alternatives: deliberation.alternatives.map((a) => ({
      summary: a.summary,
      selected: a.selected,
      expectedValue: a.expectedValue,
      risk: a.risk,
    })),
    hiddenRisks: deliberation.hiddenRisks,
    assumptions: deliberation.assumptions,
    uncertaintyLevel: deliberation.uncertaintyLevel,
    uncertaintyNote: deliberation.uncertaintyNote,
    executiveConclusions: deliberation.executiveConclusions,
    neverExposeChainOfThought: true,
  };
}

/**
 * Soft visible-answer fidelity guard.
 * Does not invent a new answer — only prepends a concise executive lead-in
 * when the LLM clearly drifts into blind agreement against deliberation.
 */
export function alignVisibleAnswerWithDeliberation(
  visibleAnswer: string,
  deliberation: ExecutiveDeliberationResult,
): { message: string; fidelityAdjusted: boolean } {
  const answer = visibleAnswer?.trim() ?? "";
  if (!answer || deliberation.significance === "routine") {
    return { message: answer, fidelityAdjusted: false };
  }

  const blindAgree =
    /\b(sure[, ]|absolutely[, ]|let'?s (do|go) (exactly )?(as|with) (you|that)|proceed (exactly )?as (requested|you said)|I (fully )?agree[, ]?(we )?(should|can) (do|proceed)|no need to (validat|test|challenge))\b/i.test(
      answer,
    );
  const hasChallengeOrRisk =
    /\b(risk|instead|recommend|better|caution|however|staged|validat|not (advise|recommend)|would not|should not)\b/i.test(
      answer,
    );
  const hasRecommendation =
    /\b(recommend|should|next (step|action)|path|approach)\b/i.test(answer);

  if (
    (deliberation.challengeStance === "respectfully_disagree" ||
      deliberation.challengeStance === "caution") &&
    blindAgree &&
    !hasChallengeOrRisk
  ) {
    const lead = [
      `Recommendation: ${deliberation.selectedApproachSummary}.`,
      deliberation.hiddenRisks[0]
        ? `Main risk: ${deliberation.hiddenRisks[0]}.`
        : null,
      "Immediate next action: lock the safer staged path and confirm any owner approval still required.",
      "",
    ]
      .filter(Boolean)
      .join(" ");
    return { message: `${lead}\n\n${answer}`, fidelityAdjusted: true };
  }

  if (!hasRecommendation && deliberation.challengeStance !== "agree") {
    const lead = `Recommendation: ${deliberation.selectedApproachSummary}.\n\n`;
    return { message: `${lead}${answer}`, fidelityAdjusted: true };
  }

  const statesUncertainty =
    /\b(uncertain|uncertainty|provisional|incomplete (evidence|data)|do not have|without (market )?data|evidence (is |gap|gather))\b/i.test(
      answer,
    );

  if (
    deliberation.uncertaintyLevel === "high" &&
    !statesUncertainty &&
    (deliberation.challengeStance === "respectfully_disagree" ||
      deliberation.challengeStance === "caution" ||
      /\b(definitely|certainly|guaranteed|without (a )?doubt|100%|just guess)\b/i.test(answer))
  ) {
    const lead =
      "Uncertainty: evidence is incomplete — treat the following as a provisional path, not a guaranteed outcome.\n\n";
    return { message: `${lead}${answer}`, fidelityAdjusted: true };
  }

  return { message: answer, fidelityAdjusted: false };
}
