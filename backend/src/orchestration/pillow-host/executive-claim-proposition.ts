/**
 * Claim → material proposition decomposition mapped to canonical state.
 * Compound claims: every material asserted component must be supported for SUPPORTED.
 * Does not encode sealed examination content.
 */

import {
  type CanonicalCaseState,
  verdictClaimAgainstCanonical,
  type ClaimVerdictFromState,
} from "./executive-canonical-state.js";
import {
  hasCausalPath,
  shareCommonRootCause,
  isDirectCause,
  roleFor,
} from "./executive-causal-state.js";

export type AtomicProposition = {
  id: string;
  kind:
    | "entity_equality"
    | "entity_inequality"
    | "forecast_eq_realised"
    | "population_all_deployed"
    | "occurrence_denied"
    | "decision_eligible"
    | "causal_unrelated"
    | "causal_same_root"
    | "causal_different_root"
    | "causal_direct_cause"
    | "causal_no_role"
    | "generic";
  text: string;
  entities?: [string, string?];
};

export type PropositionVerdict = {
  proposition: AtomicProposition;
  verdict: ClaimVerdictFromState["verdict"];
  justification: string;
};

export type CompoundClaimAssessment = {
  claimText: string;
  components: PropositionVerdict[];
  overall: ClaimVerdictFromState["verdict"];
  justification: string;
  /** True when a true premise was paired with a false/unsupported conclusion. */
  truePremiseFalseConclusion: boolean;
};

function key(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Decompose a claim into material atomic propositions.
 * Conclusions after so/therefore/hence are separate components.
 */
export function decomposeClaimPropositions(claimText: string): AtomicProposition[] {
  const t = String(claimText || "").trim();
  if (!t) return [];

  const parts: AtomicProposition[] = [];
  let idx = 0;
  const push = (p: Omit<AtomicProposition, "id">) => {
    parts.push({ ...p, id: `p_${++idx}_${p.kind}` });
  };

  const compound =
    /^([\s\S]+?)(?:,?\s+(?:so|therefore|thus|hence|which means|meaning)\s+)([\s\S]+)$/i.exec(t) ||
    /^([\s\S]+?)\s*[—–-]\s*(?:so|therefore|thus|hence)\s+([\s\S]+)$/i.exec(t);

  const clauses = compound ? [compound[1]!.trim(), compound[2]!.trim()] : [t];
  let carryEntities: [string, string?] | undefined;

  for (const rawClause of clauses) {
    const clause =
      carryEntities &&
      /\b(?:they|these|those|both|the\s+(?:two|entities|parties))\b/i.test(rawClause) &&
      !/\b[A-Z][A-Za-z0-9_-]{1,40}\s+(?:and|&)\s+[A-Z][A-Za-z0-9_-]{1,40}\b/.test(rawClause)
        ? rawClause
            .replace(
              /\b(?:they|these|those|both)\b/i,
              `${carryEntities[0]}${carryEntities[1] ? ` and ${carryEntities[1]}` : ""}`,
            )
            .replace(
              /\bthe\s+(?:two|entities|parties)\b/i,
              `${carryEntities[0]}${carryEntities[1] ? ` and ${carryEntities[1]}` : ""}`,
            )
        : rawClause;

    const remember = (ents?: [string, string?]) => {
      if (ents?.[0] && ents[1]) carryEntities = [ents[0], ents[1]];
    };

    const idEq = /\b([A-Z]{1,4}-?\d{1,4})\s+is\s+(?:definitely\s+)?([A-Z][A-Za-z0-9\s-]{2,60})/i.exec(
      clause,
    );
    if (idEq) {
      push({
        kind: "entity_equality",
        text: clause,
        entities: [idEq[1]!, idEq[2]!.trim()],
      });
      continue;
    }

    if (
      /\b(forecast|expected|estimate).{0,40}(is|equals|=|reaches).{0,20}(realised|realized|actual)/i.test(
        clause,
      ) ||
      /\bforecast equals realised\b/i.test(clause)
    ) {
      push({ kind: "forecast_eq_realised", text: clause });
      continue;
    }

    if (
      /\ball\s+\d+\b/i.test(clause) &&
      /\d+\s*%|saving|reduction|average|demonstrate/i.test(clause)
    ) {
      push({ kind: "population_all_deployed", text: clause });
      continue;
    }

    if (
      /never\s+(?:historically\s+)?occurred|did not (?:historically )?occur|never occurred/i.test(
        clause,
      )
    ) {
      push({ kind: "occurrence_denied", text: clause });
      continue;
    }

    if (
      /\b(?:currently\s+)?eligible\b/i.test(clause) &&
      /\b(?:scale|decision|candidate|gate)\b/i.test(clause)
    ) {
      push({ kind: "decision_eligible", text: clause });
      continue;
    }

    const diffPair =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:have|had|share)\s+different\s+(?:direct\s+)?(?:root\s+)?causes?\b/i.exec(
        clause,
      );
    const diffRoot =
      diffPair ||
      /\b([A-Z][A-Za-z0-9_-]{1,40}).{0,80}?(?:different|distinct)\s+(?:direct\s+)?(?:root\s+)?causes?\b/i.exec(
        clause,
      ) ||
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+has\s+a\s+different\s+(?:root\s+)?cause\b/i.exec(clause);
    if (diffRoot && !/\bunrelated|not\s+related|independent\b/i.test(clause)) {
      const left = diffRoot[1]!;
      const right =
        diffRoot[2] ||
        /\b(?:from|than|to)\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(clause)?.[1] ||
        /\bunrelated\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(t)?.[1];
      const ents: [string, string?] = [left, right];
      remember(ents);
      push({
        kind: "causal_different_root",
        text: clause,
        entities: ents,
      });
      continue;
    }

    const unrelatedPair =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:are|were)\s+(?:not\s+related|unrelated|causally\s+independent|independent)\b/i.exec(
        clause,
      ) ||
      /\b([A-Z][A-Za-z0-9_-]{1,40}).{0,80}?\bis\s+unrelated\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
        clause,
      ) ||
      /\bunrelated\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(clause);

    if (unrelatedPair) {
      let left = unrelatedPair[1]!;
      let right = unrelatedPair[2] || "";
      if (!unrelatedPair[2]) {
        const pair =
          /\b([A-Z][A-Za-z0-9_-]{1,40}).{0,120}?unrelated\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
            t,
          );
        if (pair) {
          left = pair[1]!;
          right = pair[2]!;
        } else if (carryEntities?.[1]) {
          left = carryEntities[0];
          right = carryEntities[1]!;
        }
      }
      const ents: [string, string?] = [left, right];
      remember(ents);
      if (
        /\bdifferent\s+(?:direct\s+)?(?:root\s+)?causes?\b/i.test(clause) ||
        /\bdifferent\s+(?:root\s+)?cause\b/i.test(t)
      ) {
        push({
          kind: "causal_different_root",
          text: clause,
          entities: ents,
        });
      }
      push({
        kind: "causal_unrelated",
        text: clause,
        entities: ents,
      });
      continue;
    }

    const sameRoot =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:share|have)\s+(?:the\s+)?(?:same\s+)?(?:common\s+)?root\s+cause\b/i.exec(
        clause,
      );
    if (sameRoot) {
      const ents: [string, string?] = [sameRoot[1]!, sameRoot[2]!];
      remember(ents);
      push({ kind: "causal_same_root", text: clause, entities: ents });
      continue;
    }

    const direct =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:is|was)\s+(?:the\s+)?direct\s+cause\s+of\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
        clause,
      );
    if (direct) {
      const ents: [string, string?] = [direct[1]!, direct[2]!];
      remember(ents);
      push({ kind: "causal_direct_cause", text: clause, entities: ents });
      continue;
    }

    const noRole =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:played|had|has)\s+no\s+(?:causal|operational)?\s*(?:role|involvement|part)\b/i.exec(
        clause,
      );
    if (noRole) {
      push({ kind: "causal_no_role", text: clause, entities: [noRole[1]!] });
      continue;
    }

    push({ kind: "generic", text: clause });
  }

  const seen = new Set<string>();
  return parts.filter((p) => {
    const k = `${p.kind}:${(p.entities || []).map((e) => key(e || "")).join(":")}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function verdictAtomicProposition(
  prop: AtomicProposition,
  state: CanonicalCaseState,
): PropositionVerdict {
  const causal = state.causal;
  const [e1, e2] = prop.entities || [];

  switch (prop.kind) {
    case "causal_different_root": {
      if (e1 && e2 && shareCommonRootCause(causal, e1, e2)) {
        return {
          proposition: prop,
          verdict: "contradicted",
          justification: `Canonical state establishes a common root cause linking ${e1} and ${e2}.`,
        };
      }
      return {
        proposition: prop,
        verdict: "supported",
        justification:
          "Different-root / different-direct-cause premise is consistent with absence of a verified common root.",
      };
    }
    case "causal_unrelated": {
      if (e1 && e2 && (hasCausalPath(causal, e1, e2) || hasCausalPath(causal, e2, e1))) {
        return {
          proposition: prop,
          verdict: "contradicted",
          justification: `DIFFERENT_DIRECT_CAUSES ≠ CAUSALLY_UNRELATED. Canonical path connects ${e1} and ${e2}.`,
        };
      }
      return {
        proposition: prop,
        verdict: "unproven",
        justification: `Causal unrelatedness of ${e1 ?? "A"} and ${e2 ?? "B"} is not established.`,
      };
    }
    case "causal_same_root": {
      if (e1 && e2) {
        if (shareCommonRootCause(causal, e1, e2)) {
          return {
            proposition: prop,
            verdict: "supported",
            justification: `Verified common root cause linking ${e1} and ${e2}.`,
          };
        }
        if (hasCausalPath(causal, e1, e2) || hasCausalPath(causal, e2, e1)) {
          return {
            proposition: prop,
            verdict: "contradicted",
            justification: `CAUSALLY_CONNECTED ≠ SAME_ROOT_CAUSE. ${e1} and ${e2} are connected but do not share a verified common root.`,
          };
        }
      }
      return {
        proposition: prop,
        verdict: "unproven",
        justification: "Common root cause is not established.",
      };
    }
    case "causal_direct_cause": {
      if (e1 && e2) {
        if (isDirectCause(causal, e1, e2)) {
          return {
            proposition: prop,
            verdict: "supported",
            justification: `Verified direct cause ${e1} → ${e2}.`,
          };
        }
        if (hasCausalPath(causal, e1, e2)) {
          return {
            proposition: prop,
            verdict: "contradicted",
            justification: `DIRECT ≠ INDIRECT. ${e1} is connected to ${e2} but not as direct cause.`,
          };
        }
      }
      return {
        proposition: prop,
        verdict: "unproven",
        justification: "Direct causation is not established.",
      };
    }
    case "causal_no_role": {
      if (e1) {
        const role = roleFor(causal, e1);
        if (role?.role === "CAUSAL_NON_PARTICIPATION") {
          return {
            proposition: prop,
            verdict: "supported",
            justification: `Affirmative non-participation for ${e1}.`,
          };
        }
        if (role?.role === "UNAFFECTED_OBSERVED") {
          return {
            proposition: prop,
            verdict: "contradicted",
            justification: `OBSERVED_UNAFFECTED ≠ PROVEN_NO_CAUSAL_ROLE for ${e1}.`,
          };
        }
      }
      return {
        proposition: prop,
        verdict: "unproven",
        justification: "Causal non-participation is not established.",
      };
    }
    case "decision_eligible": {
      const blocked = state.decisionActions.some(
        (a) =>
          a.requiredGates.some((g) => g.status !== "PASS") || a.currentlyEligible === false,
      );
      if (blocked && /\beligible\b/i.test(prop.text) && !/\bnot\s+eligible\b/i.test(prop.text)) {
        return {
          proposition: prop,
          verdict: "contradicted",
          justification:
            "Canonical decision-gate state: CURRENTLY_ELIGIBLE=NO while blockers remain.",
        };
      }
      break;
    }
    default:
      break;
  }

  const v = verdictClaimAgainstCanonical(prop.text, state);
  return { proposition: prop, verdict: v.verdict, justification: v.justification };
}

/**
 * Assess a (possibly compound) claim against canonical state.
 * SUPPORTED only if every material component is supported.
 * Any contradicted component ⇒ contradicted.
 * Supported premise + false/unproven conclusion ⇒ not SUPPORTED.
 */
export function assessClaimAgainstCanonical(
  claimText: string,
  state: CanonicalCaseState,
): CompoundClaimAssessment {
  const components = decomposeClaimPropositions(claimText).map((p) =>
    verdictAtomicProposition(p, state),
  );
  const material = components.filter((c) => c.proposition.kind !== "generic");
  const use = material.length > 0 ? material : components;

  const anyContradicted = use.some((c) => c.verdict === "contradicted");
  const anyUnknown = use.some((c) => c.verdict === "unknown");
  const allSupported = use.length > 0 && use.every((c) => c.verdict === "supported");
  const anySupported = use.some((c) => c.verdict === "supported");
  const anyUnproven = use.some((c) => c.verdict === "unproven");

  const truePremiseFalseConclusion =
    use.length >= 2 &&
    use.some((c) => c.verdict === "supported") &&
    use.some((c) => c.verdict === "contradicted" || c.verdict === "unproven");

  let overall: ClaimVerdictFromState["verdict"];
  let justification: string;

  if (anyContradicted) {
    overall = "contradicted";
    const bad = use.filter((c) => c.verdict === "contradicted");
    justification = truePremiseFalseConclusion
      ? `Compound claim mixes a supported premise with a contradicted conclusion. Overall cannot be SUPPORTED. ${bad.map((b) => b.justification).join(" ")}`
      : bad.map((b) => b.justification).join(" ");
  } else if (allSupported) {
    overall = "supported";
    justification = use.map((c) => c.justification).join(" ");
  } else if (truePremiseFalseConclusion || (anySupported && anyUnproven && use.length >= 2)) {
    overall = "contradicted";
    justification =
      "Compound claim: a supported premise does not make the whole claim SUPPORTED when another material clause is unproven or false.";
  } else if (anyUnknown && !anySupported) {
    overall = "unknown";
    justification = use.map((c) => c.justification).join(" ");
  } else {
    overall = "unproven";
    justification =
      use.map((c) => c.justification).join(" ") ||
      "Not established from the supplied scenario evidence alone.";
  }

  return {
    claimText,
    components: use,
    overall,
    justification,
    truePremiseFalseConclusion,
  };
}
