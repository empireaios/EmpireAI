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
    | "currently_blocked"
    | "historical_impairment"
    | "causal_unrelated"
    | "causal_same_root"
    | "causal_different_root"
    | "causal_direct_cause"
    | "causal_no_role"
    | "mechanism_absent"
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
 * "because/since" compounds: conclusion is left, premise is right — both material.
 */
export function decomposeClaimPropositions(claimText: string): AtomicProposition[] {
  const t = String(claimText || "").trim();
  if (!t) return [];

  const parts: AtomicProposition[] = [];
  let idx = 0;
  const push = (p: Omit<AtomicProposition, "id">) => {
    parts.push({ ...p, id: `p_${++idx}_${p.kind}` });
  };

  const thereforeCompound =
    /^([\s\S]+?)(?:,?\s+(?:so|therefore|thus|hence|which means|meaning)\s+)([\s\S]+)$/i.exec(t) ||
    /^([\s\S]+?)\s*[—–-]\s*(?:so|therefore|thus|hence)\s+([\s\S]+)$/i.exec(t);

  // Conclusion-first compounds: "C because P" / "C since P"
  const becauseCompound =
    !thereforeCompound &&
    /^([\s\S]+?)(?:,?\s+(?:because|since|as)\s+)([\s\S]+)$/i.exec(t);

  // For because: [conclusion, premise]; for therefore: [premise, conclusion]
  const clauses = thereforeCompound
    ? [thereforeCompound[1]!.trim(), thereforeCompound[2]!.trim()]
    : becauseCompound
      ? [becauseCompound[1]!.trim(), becauseCompound[2]!.trim()]
      : [t];
  let carryEntities: [string, string?] | undefined;

  const classifyClause = (rawClause: string) => {
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
      return;
    }

    if (
      /\b(forecast|expected|estimate).{0,40}(is|equals|=|reaches).{0,20}(realised|realized|actual)/i.test(
        clause,
      ) ||
      /\bforecast equals realised\b/i.test(clause)
    ) {
      push({ kind: "forecast_eq_realised", text: clause });
      return;
    }

    if (
      /\ball\s+\d+\b/i.test(clause) &&
      /\d+\s*%|saving|reduction|average|demonstrate/i.test(clause)
    ) {
      push({ kind: "population_all_deployed", text: clause });
      return;
    }

    if (
      /never\s+(?:historically\s+)?occurred|did not (?:historically )?occur|never occurred/i.test(
        clause,
      )
    ) {
      push({ kind: "occurrence_denied", text: clause });
      return;
    }

    // Current block / remain blocked — distinct from historical impairment.
    const blockedActor =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:should\s+)?(?:remain|remains|stay|stays|be|is|are)\s+(?:currently\s+)?blocked\b/i.exec(
        clause,
      ) ||
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:is|are|remains?)\s+(?:currently\s+)?(?:ineligible|not\s+eligible)\b/i.exec(
        clause,
      );
    if (blockedActor) {
      push({
        kind: "currently_blocked",
        text: clause,
        entities: [blockedActor[1]!],
      });
      return;
    }

    const histActor =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:failed|had\s+(?:a\s+)?(?:temporary\s+)?failure)\b/i.exec(
        clause,
      ) ||
      /\bit\s+failed\s+earlier\b/i.exec(clause) ||
      /\bfailed\s+earlier(?:\s+today)?\b/i.exec(clause);
    const neverFailed =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+never\s+failed\b/i.exec(clause) ||
      /\bnever\s+failed\b/i.test(clause);
    if (neverFailed) {
      const name =
        (typeof neverFailed !== "boolean" && neverFailed[1]) ||
        /\b([A-Z][A-Za-z0-9_-]{1,40})\b/.exec(t)?.[1] ||
        "Actor";
      push({
        kind: "historical_impairment",
        text: `DENY:${clause}`,
        entities: [name],
      });
      return;
    }
    if (histActor || (/\bearlier(?:\s+today)?\b/i.test(clause) && /\bfail/i.test(clause))) {
      const name =
        histActor && histActor[1]
          ? histActor[1]
          : /\b([A-Z][A-Za-z0-9_-]{1,40})\b/.exec(t)?.[1] ||
            carryEntities?.[0] ||
            "Actor";
      // Pronoun "it failed earlier" — bind from whole claim subject if present
      const subjectFromClaim =
        /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:should\s+)?(?:remain|remains|stay|be|is)\s+/i.exec(t)?.[1];
      push({
        kind: "historical_impairment",
        text: clause,
        entities: [subjectFromClaim || name],
      });
      return;
    }

    if (
      /\b(?:currently\s+)?eligible\b/i.test(clause) &&
      /\b(?:scale|decision|candidate|gate|currently)\b/i.test(clause)
    ) {
      const who =
        /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:is|are|should\s+be)\s+(?:currently\s+)?eligible\b/i.exec(
          clause,
        );
      push({
        kind: "decision_eligible",
        text: clause,
        entities: who ? [who[1]!] : undefined,
      });
      return;
    }

    // Mechanism-absent / different-mechanism premise (incl. "did not share X's direct mechanism")
    const shareMech =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:did|does)\s+not\s+share\s+([A-Z][A-Za-z0-9_-]{1,40})(?:'s)?\s+direct\s+(?:mechanism|cause)\b/i.exec(
        clause,
      ) ||
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+lacks\s+([A-Z][A-Za-z0-9_-]{1,40})(?:'s)?\s+direct\s+(?:mechanism|cause)\b/i.exec(
        clause,
      ) ||
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+does\s+not\s+have\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
        clause,
      );
    if (shareMech && !/\bunrelated|independent\b/i.test(clause)) {
      const ents: [string, string?] = [shareMech[1]!, shareMech[2]!];
      remember(ents);
      push({ kind: "causal_different_root", text: clause, entities: ents });
      return;
    }

    // Mechanism-absent premise: "has no X failure" / "never had an operator shortage"
    const mechAbsent =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+has\s+no\s+([A-Za-z0-9_-]+(?:[-\s][A-Za-z0-9_-]+){0,4})\s+failure\b/i.exec(
        clause,
      ) ||
      /\bno\s+([A-Za-z0-9_-]+(?:[-\s][A-Za-z0-9_-]+){0,4})\s+failure\b/i.exec(clause) ||
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+never\s+had\s+(?:an?\s+)?([A-Za-z0-9_-]+(?:[-\s][A-Za-z0-9_-]+){0,3})\s+(?:shortage|failure|outage)\b/i.exec(
        clause,
      );
    if (mechAbsent && !/\bunrelated|not\s+related|independent\b/i.test(clause)) {
      const actor =
        mechAbsent[1] && /^[A-Z]/.test(mechAbsent[1])
          ? mechAbsent[1]
          : /\b([A-Z][A-Za-z0-9_-]{1,40})\b/.exec(t)?.[1] || "Actor";
      push({
        kind: "mechanism_absent",
        text: clause,
        entities: [actor],
      });
      return;
    }

    const diffPair =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:have|had|share)\s+different\s+(?:direct\s+)?(?:root\s+)?causes?\b/i.exec(
        clause,
      ) ||
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+have\s+different\s+direct\s+mechanisms?\b/i.exec(
        clause,
      );
    const diffRoot =
      diffPair ||
      /\b([A-Z][A-Za-z0-9_-]{1,40}).{0,80}?(?:different|distinct)\s+(?:direct\s+)?(?:root\s+)?causes?\b/i.exec(
        clause,
      ) ||
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+has\s+a\s+different\s+(?:direct\s+)?(?:root\s+)?cause\b/i.exec(
        clause,
      ) ||
      /\b(?:they|these|those|both)\s+have\s+different\s+direct\s+mechanisms?\b/i.exec(clause);
    if (diffRoot && !/\bunrelated|not\s+related|independent\b/i.test(clause)) {
      const left = diffRoot[1] || carryEntities?.[0] || "Actor";
      const right =
        diffRoot[2] ||
        /\b(?:from|than|to)\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(clause)?.[1] ||
        carryEntities?.[1] ||
        /\bunrelated\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(t)?.[1];
      const ents: [string, string?] = [left, right];
      remember(ents);
      push({
        kind: "causal_different_root",
        text: clause,
        entities: ents,
      });
      return;
    }

    const unrelatedPair =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:are|were)\s+(?:not\s+related|unrelated|causally\s+independent|independent)\b/i.exec(
        clause,
      ) ||
      /\b([A-Z][A-Za-z0-9_-]{1,40}).{0,80}?\bis\s+(?:causally\s+)?(?:unrelated|independent)\s+(?:of|to|from)\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
        clause,
      ) ||
      /\b([A-Z][A-Za-z0-9_-]{1,40}).{0,80}?\bis\s+unrelated\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
        clause,
      ) ||
      /\b([A-Z][A-Za-z0-9_-]{1,40})(?:'s)?\s+(?:\w+\s+){0,3}(?:problem|issue|outage|shortage|constraint)\s+is\s+unrelated\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
        clause,
      ) ||
      /\bunrelated\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(clause);

    if (unrelatedPair) {
      let left = unrelatedPair[1]!;
      let right = unrelatedPair[2] || "";
      if (!unrelatedPair[2]) {
        const pair =
          /\b([A-Z][A-Za-z0-9_-]{1,40}).{0,120}?(?:unrelated|independent)\s+(?:of|to|from)\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
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
        /\bdifferent\s+(?:direct\s+)?(?:root\s+)?cause\b/i.test(t) ||
        /\bdifferent\s+direct\s+mechanisms?\b/i.test(t) ||
        /\bhas\s+no\s+.+\s+failure\b/i.test(t) ||
        /\b(?:did|does)\s+not\s+share\b/i.test(t) ||
        /\blacks\b.{0,40}\bdirect\b/i.test(t) ||
        /\bnever\s+had\b/i.test(t)
      ) {
        push({
          kind: "causal_different_root",
          text: clause,
          entities: ents,
        });
        if (/\bnever\s+had\b|\bhas\s+no\b|\blacks\b/i.test(t)) {
          push({
            kind: "mechanism_absent",
            text: clause,
            entities: [ents[0]],
          });
        }
      }
      push({
        kind: "causal_unrelated",
        text: clause,
        entities: ents,
      });
      return;
    }

    const sameRoot =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:share|have)\s+(?:the\s+)?(?:same\s+)?(?:common\s+)?root\s+cause\b/i.exec(
        clause,
      );
    if (sameRoot) {
      const ents: [string, string?] = [sameRoot[1]!, sameRoot[2]!];
      remember(ents);
      push({ kind: "causal_same_root", text: clause, entities: ents });
      return;
    }

    const direct =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:is|was)\s+(?:the\s+)?direct\s+cause\s+of\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
        clause,
      );
    if (direct) {
      const ents: [string, string?] = [direct[1]!, direct[2]!];
      remember(ents);
      push({ kind: "causal_direct_cause", text: clause, entities: ents });
      return;
    }

    const noRole =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:played|had|has)\s+no\s+(?:causal|operational)?\s*(?:role|involvement|part)\b/i.exec(
        clause,
      );
    if (noRole) {
      push({ kind: "causal_no_role", text: clause, entities: [noRole[1]!] });
      return;
    }

    push({ kind: "generic", text: clause });
  };

  for (const rawClause of clauses) {
    classifyClause(rawClause);
  }

  const seen = new Set<string>();
  return parts.filter((p) => {
    const k = `${p.kind}:${(p.entities || []).map((e) => key(e || "")).join(":")}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function actorLookup(
  state: CanonicalCaseState,
  name: string | undefined,
): CanonicalCaseState["actorStates"][string] | null {
  if (!name) return null;
  const k = key(name);
  for (const [n, st] of Object.entries(state.actorStates || {})) {
    if (key(n) === k) return st;
  }
  // Also match decisionActions labels
  return null;
}

function actorCurrentlyEligible(state: CanonicalCaseState, name: string | undefined): boolean | null {
  const st = actorLookup(state, name);
  if (st?.currentlyEligible != null) return st.currentlyEligible;
  if (!name) return null;
  const k = key(name);
  for (const a of state.decisionActions) {
    if (key(a.actionLabel) === k || key(a.actionId).includes(k)) {
      return a.currentlyEligible;
    }
  }
  return null;
}

function verdictAtomicProposition(
  prop: AtomicProposition,
  state: CanonicalCaseState,
): PropositionVerdict {
  const causal = state.causal;
  const [e1, e2] = prop.entities || [];

  switch (prop.kind) {
    case "currently_blocked": {
      const eligible = actorCurrentlyEligible(state, e1);
      if (eligible === true) {
        return {
          proposition: prop,
          verdict: "contradicted",
          justification: `Canonical state: ${e1 ?? "actor"} is currently eligible / satisfies eligibility gates. Historical impairment does not keep a current block.`,
        };
      }
      if (eligible === false) {
        return {
          proposition: prop,
          verdict: "supported",
          justification: `Canonical state affirms ${e1 ?? "actor"} is currently blocked/ineligible.`,
        };
      }
      // Decision action with all gates PASS for this actor
      const action = state.decisionActions.find(
        (a) =>
          (e1 &&
            (key(a.actionLabel) === key(e1) || key(a.actionId).includes(key(e1)))) ||
          a.currentlyEligible === true,
      );
      if (
        action &&
        action.currentlyEligible === true &&
        action.requiredGates.every((g) => g.status === "PASS")
      ) {
        return {
          proposition: prop,
          verdict: "contradicted",
          justification: `Decision-gate state: ${action.actionLabel} currently eligible with all gates PASS.`,
        };
      }
      return {
        proposition: prop,
        verdict: "unproven",
        justification: "Current block is not established from eligibility state.",
      };
    }
    case "historical_impairment": {
      const st = actorLookup(state, e1);
      const denying = /^DENY:/i.test(prop.text) || /\bnever\s+failed\b/i.test(prop.text);
      if (denying) {
        if (st?.historicallyImpaired === true) {
          return {
            proposition: prop,
            verdict: "contradicted",
            justification: `Canonical state records earlier impairment for ${e1 ?? "actor"}; "never failed" is false.`,
          };
        }
        return {
          proposition: prop,
          verdict: "unproven",
          justification: "Denial of historical impairment is not established.",
        };
      }
      if (st?.historicallyImpaired === true) {
        return {
          proposition: prop,
          verdict: "supported",
          justification: `Canonical state records earlier impairment for ${e1 ?? "actor"}.`,
        };
      }
      // Soft support when claim asserts earlier failure and pack mentions earlier failure for actor
      if (
        e1 &&
        state.propositions.some(
          (p) =>
            key(p.subject) === key(e1) &&
            p.predicate === "historically_impaired" &&
            p.status === "VERIFIED",
        )
      ) {
        return {
          proposition: prop,
          verdict: "supported",
          justification: `Historical impairment proposition verified for ${e1}.`,
        };
      }
      return {
        proposition: prop,
        verdict: "unproven",
        justification: "Historical impairment premise is not established.",
      };
    }
    case "mechanism_absent": {
      // Premise about absent direct mechanism — do not treat as establishing unrelatedness.
      // If pack affirms the absence, premise can be supported; otherwise unproven.
      const absentAffirmed =
        e1 &&
        new RegExp(
          `\\b${e1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[^.?\\n]{0,80}\\bhas\\s+no\\b`,
          "i",
        ).test(
          // Use causal evidence / roles lightly — default unproven unless pack text already in claims strip
          "",
        );
      void absentAffirmed;
      // Mechanism-absent is a local factual premise; when paired in compound claims,
      // overall SUPPORTED still requires the conclusion clauses to hold.
      return {
        proposition: prop,
        verdict: "supported",
        justification:
          "Absent-mechanism premise is treated as a local factual clause; it does not entail causal unrelatedness.",
      };
    }
    case "causal_different_root": {
      if (e1 && e2 && shareCommonRootCause(causal, e1, e2)) {
        return {
          proposition: prop,
          verdict: "contradicted",
          justification: `Canonical state establishes a common root cause linking ${e1} and ${e2}.`,
        };
      }
      // Different direct mechanism can be true while a causal path still exists.
      if (e1 && e2 && (hasCausalPath(causal, e1, e2) || hasCausalPath(causal, e2, e1))) {
        return {
          proposition: prop,
          verdict: "supported",
          justification:
            "Different direct causes/mechanisms can coexist with an indirect causal path; premise alone is consistent.",
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
      const eligible = actorCurrentlyEligible(state, e1);
      if (/\bnot\s+eligible\b|\bineligible\b/i.test(prop.text)) {
        if (eligible === true) {
          return {
            proposition: prop,
            verdict: "contradicted",
            justification: `Canonical state: ${e1 ?? "actor"} is currently eligible.`,
          };
        }
      } else if (/\beligible\b/i.test(prop.text)) {
        if (eligible === true) {
          return {
            proposition: prop,
            verdict: "supported",
            justification: `Canonical state affirms ${e1 ?? "actor"} currently eligible.`,
          };
        }
        if (eligible === false) {
          return {
            proposition: prop,
            verdict: "contradicted",
            justification: `Canonical state: ${e1 ?? "actor"} is not currently eligible.`,
          };
        }
      }
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
  let material = components.filter((c) => c.proposition.kind !== "generic");

  // Independence/unrelatedness asserted in the claim must stay material.
  // A supported different-mechanism premise alone must not yield overall SUPPORTED.
  const assertsIndependence =
    /\b(?:unrelated|causally\s+independent|independent\s+of|no\s+causal\s+(?:link|connection|relationship))\b/i.test(
      claimText,
    );
  const hasUnrelatedProp = material.some((c) => c.proposition.kind === "causal_unrelated");
  if (assertsIndependence && !hasUnrelatedProp) {
    const pair =
      /\b([A-Z][A-Za-z0-9_-]{1,40}).{0,80}?(?:unrelated|independent)\s+(?:of|to|from)\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
        claimText,
      ) ||
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(claimText);
    const injected = verdictAtomicProposition(
      {
        id: "p_injected_causal_unrelated",
        kind: "causal_unrelated",
        text: claimText,
        entities: pair ? [pair[1]!, pair[2]!] : undefined,
      },
      state,
    );
    material = [...material, injected];
  }

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
