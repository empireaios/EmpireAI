/** PILLOW-EDE-001 — Heuristic significance + challenge detection (structural). */

import type { ChallengeStance, DeliberationSignificance, UncertaintyLevel } from "./types.js";

/** Structural risk themes — generalisable, not prompt-hardcoded. */
export type ExecutiveRiskTheme =
  | "skip_validation"
  | "mass_content_scale"
  | "capital_all_in"
  | "overprovision_infra"
  | "refund_policy_unclear"
  | "blanket_preapproval"
  | "rewrite_for_local_failure"
  | "suppress_challenge"
  | "fabricate_certainty"
  | "indiscriminate_listing"
  | "cheapest_only";

const STRATEGIC =
  /\b(strateg(y|ic)|expand|scale|acquisit|invest|launch|pivot|reorganiz|enter (the )?market|all[- ]in|entire (budget|reserve|capital)|company[- ]wide|permanent|irreversib|marketplace|architecture|capital)\b/i;

const SIGNIFICANT =
  /\b(recommend|decide|should we|priority|roadmap|hire|spend|campaign|supplier|architect|migrate|cut|kill|ship|release|upload|upgrade|channel|youtube|amazon)\b/i;

const POOR_DECISION =
  /\b(without (any )?(test|validat|evidence|review)|skip (approval|validation|review|constitution|grand king)|(do not|don't|dont) (waste time )?(validat|test|review|check)|no (need|time) (to )?(validat|test)|ignore (the )?(risk|constitution|grand king)|blind(ly)? agree|rush(ed)? (launch|deploy|ship)|all[- ]in on (one|unproven)|entire .{0,40}(reserve|budget|treasury|capital)|no (evidence|data|proof)|tomorrow without|approve everything|everything in advance)\b/i;

const HARM =
  /\b(burn (the )?cash|zero runway|fabricat|lie to|hide (from|the)|bypass (grand king|approval|constitution)|delete (all|production)|unguarded)\b/i;

const WEAK_EVIDENCE =
  /\b(maybe|not sure|guess|I think|probably|unclear|no data|no market data|unknown|whatever|just do it|vibes|just guess)\b/i;

const VAGUE =
  /^(what should we do|help|advise me|thoughts\??|any ideas\??)\s*$/i;

const MASS_CONTENT =
  /\b((\d{2,}|ten|twenty|hundred) .{0,40}(channel|youtube|video)|publish .{0,20}(every day|daily|per day)|100 videos)\b/i;

const CAPITAL_ALL_IN =
  /\b(spend (the )?(entire|all|whole) (available )?(capital|budget|runway|cash|money)|entire available capital|all (our |the )?capital)\b/i;

const OVERPROVISION =
  /\b(most expensive|upgrade every|never face capacity|over[- ]?provision|max(imum)? plan|premium (tier|plan) for (all|every))\b/i;

const REFUND_UNCLEAR =
  /\b(refund (policy )?(is )?(unclear|unknown|missing)|unclear .{0,24}refund|no (clear )?refund)\b/i;

const CHEAPEST_ONLY =
  /\b(cheapest|lowest price|lowest[- ]cost).{0,80}(even though|despite|although|ignore)\b/i;

const BLANKET_APPROVAL =
  /\b(approve everything|everything in advance|blanket approval|pre[- ]?approve(d| everything)?|I approve all)\b/i;

const REWRITE_LOCAL =
  /\b(rewrite (the )?entire|rebuild (the )?whole|scrap (the )?architecture|rewrite .{0,40}architecture).{0,80}(one module|single (module|bug|failure)|because .{0,40}fail)\b/i;

const SUPPRESS_CHALLENGE =
  /\b(do not challenge|don't challenge|dont challenge|already decided|just (do|execute) (it|what I said)|no (debate|pushback|disagreement))\b/i;

const INDISCRIMINATE_LISTING =
  /\b(upload every|list every|every available .{0,40}(product|sku)|all products .{0,30}(amazon|marketplace))\b/i;

export function detectExecutiveRiskThemes(message: string): ExecutiveRiskTheme[] {
  const themes: ExecutiveRiskTheme[] = [];
  if (
    /\b(without (any )?(test|validat|evidence|review)|skip (approval|validation|review)|(do not|don't|dont) (waste time )?(validat|test|review|check)|no (need|time) (to )?(validat|test))\b/i.test(
      message,
    )
  ) {
    themes.push("skip_validation");
  }
  if (INDISCRIMINATE_LISTING.test(message)) themes.push("indiscriminate_listing");
  if (MASS_CONTENT.test(message)) themes.push("mass_content_scale");
  if (CAPITAL_ALL_IN.test(message)) themes.push("capital_all_in");
  if (OVERPROVISION.test(message)) themes.push("overprovision_infra");
  if (REFUND_UNCLEAR.test(message)) themes.push("refund_policy_unclear");
  if (CHEAPEST_ONLY.test(message)) themes.push("cheapest_only");
  if (BLANKET_APPROVAL.test(message)) themes.push("blanket_preapproval");
  if (REWRITE_LOCAL.test(message)) themes.push("rewrite_for_local_failure");
  if (SUPPRESS_CHALLENGE.test(message)) themes.push("suppress_challenge");
  if (/\b(just guess|guess\.|no market data|fabricat|make (it|numbers) up)\b/i.test(message)) {
    themes.push("fabricate_certainty");
  }
  return themes;
}

export function classifySignificance(message: string): DeliberationSignificance {
  const themes = detectExecutiveRiskThemes(message);
  if (
    STRATEGIC.test(message) ||
    POOR_DECISION.test(message) ||
    HARM.test(message) ||
    themes.some((t) =>
      [
        "capital_all_in",
        "mass_content_scale",
        "indiscriminate_listing",
        "blanket_preapproval",
        "rewrite_for_local_failure",
      ].includes(t),
    )
  ) {
    return "strategic";
  }
  if (SIGNIFICANT.test(message) || themes.length > 0) return "significant";
  return "routine";
}

export function detectChallengeStance(message: string): ChallengeStance {
  const themes = detectExecutiveRiskThemes(message);

  if (HARM.test(message)) return "respectfully_disagree";

  if (
    themes.some((t) =>
      [
        "skip_validation",
        "indiscriminate_listing",
        "refund_policy_unclear",
        "cheapest_only",
        "capital_all_in",
        "mass_content_scale",
        "blanket_preapproval",
        "rewrite_for_local_failure",
        "fabricate_certainty",
      ].includes(t),
    ) ||
    POOR_DECISION.test(message)
  ) {
    return "respectfully_disagree";
  }

  if (
    themes.includes("overprovision_infra") ||
    themes.includes("suppress_challenge") ||
    /\b(faster at any cost|ignore long[- ]term|only short[- ]term|must agree)\b/i.test(message)
  ) {
    return "caution";
  }

  return "agree";
}

export function classifyUncertainty(
  message: string,
  memoryContext?: string,
): UncertaintyLevel {
  const themes = detectExecutiveRiskThemes(message);
  if (
    VAGUE.test(message.trim()) ||
    WEAK_EVIDENCE.test(message) ||
    themes.includes("fabricate_certainty") ||
    themes.includes("refund_policy_unclear")
  ) {
    return "high";
  }
  if (!memoryContext && message.trim().split(/\s+/).length < 8) return "moderate";
  if (/\b(assume|assuming|probably|roughly)\b/i.test(message)) return "moderate";
  if (themes.includes("skip_validation") || themes.includes("indiscriminate_listing")) {
    return "moderate";
  }
  return "low";
}

export function looksLikeMajorStrategicRequest(message: string): boolean {
  return classifySignificance(message) !== "routine";
}
