/**
 * Canonical case / proposition state — single derivation of material conclusions.
 * Downstream layers validate and realize; they must not reinvent identity, population,
 * forecast≠realised, or occurrence from scratch.
 *
 * Does not encode sealed examination content.
 */

import {
  buildActionEligibilityStates,
  formatActionEligibilityBrief,
  type ActionEligibility,
} from "./executive-decision-constraints.js";
import {
  buildCanonicalCausalState,
  formatCausalStateBrief,
  verdictCausalClaim,
  type CanonicalCausalState,
} from "./executive-causal-state.js";

export type PropositionStatus =
  | "VERIFIED"
  | "CONTRADICTED"
  | "UNPROVEN"
  | "UNKNOWN"
  | "FORECAST_ONLY"
  | "NOT_APPLICABLE";

export type EvidenceAuthority =
  | "verified_registry"
  | "independent_study"
  | "supplier_claim"
  | "planning_cooccurrence"
  | "ledger_transaction"
  | "owner_pack"
  | "unknown";

export type CanonicalProposition = {
  id: string;
  kind:
    | "entity_identity"
    | "entity_equality"
    | "forecast_vs_realised"
    | "population_scope"
    | "event_occurrence"
    | "financial_net"
    | "evidence_precedence"
    | "claim_verdict"
    | "causal_link"
    | "causal_role"
    | "generic";
  subject: string;
  predicate: string;
  value: string;
  status: PropositionStatus;
  evidence: string;
  temporalScope?: string;
  populationScope?: string;
  authority: EvidenceAuthority;
  supersedes?: string[];
};

export type PopulationState = {
  deployed: number | null;
  measuredInitial: number | null;
  measuredValid: number | null;
  resultLabel: string | null;
  resultAppliesTo: "measured_valid" | "measured_initial" | "deployed" | "unknown";
  unmeasuredOrInvalid: number | null;
};

export type CanonicalCaseState = {
  domainHint: string;
  entities: Record<string, { name: string; authority: EvidenceAuthority }>;
  distinctPairs: Array<[string, string]>;
  forecast: number | null;
  realised: number | null;
  population: PopulationState;
  occurrence: {
    occurred: boolean | null;
    laterReversal: boolean;
    invalidated: boolean;
  };
  financial: { gross: number | null; refund: number | null; net: number | null };
  claims: Array<{ index: number; text: string }>;
  propositions: CanonicalProposition[];
  /** Multi-gate decision eligibility per action/candidate (ELIGIBLE ≠ BEST). */
  decisionActions: ActionEligibility[];
  /** Causal graph / roles — observation ≠ causation. */
  causal: CanonicalCausalState;
  failureStageHints: string[];
};

function norm(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

function num(m: RegExpExecArray | null, i = 1): number | null {
  if (!m?.[i]) return null;
  const n = Number(String(m[i]).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Extract explicit quoted claims only — never section headings as claims. */
export function extractQuotedClaimsOnly(userMessage: string): string[] {
  const text = String(userMessage || "");
  const asks =
    /\b(?:verdicts?|evaluate|audit|classify|score|judge)\b[\s\S]{0,120}\bclaims?\b|\bclaims?\b[\s\S]{0,80}\b(?:verdicts?|separately|each|individually)\b|\bclaim[- ]by[- ]claim\b|\bclaim\s+audit\b|\bseparate\s+verdicts?\b|\bverdicts?\s+on\b|\b(?:five|5|six|6|seven|7|eight|8|\d+)\s+(?:separate\s+)?(?:quoted\s+)?claims?\b/i.test(
      text,
    );
  if (!asks) return [];

  const claims: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string, indexKey?: string) => {
    const c = raw.replace(/\s+/g, " ").trim();
    if (c.length < 8) return;
    // Reject section-instruction lines misread as claims.
    if (
      /^(?:cover|reconcile|classify|compute|decide|weigh|what|executive|answer in|do not|pack:|note:)/i.test(
        c,
      )
    ) {
      return;
    }
    // Numbered claims may repeat the same proposition (claim_1 and claim_2 identical text).
    const key = indexKey
      ? `${indexKey}:${c.toLowerCase().slice(0, 120)}`
      : c.toLowerCase().slice(0, 120);
    if (seen.has(key)) return;
    seen.add(key);
    claims.push(c);
  };

  const quoted =
    /(?:^|\n)\s*(?:Claim\s*)?(\d{1,2})\s*[.):\-]\s*[“"']([^”"']{8,500})[”"']/gi;
  let m: RegExpExecArray | null;
  while ((m = quoted.exec(text)) !== null) {
    push(m[2]!, m[1]!);
  }

  // "claim audit of:" block — only quoted lines
  if (claims.length < 2) {
    const block = text.match(
      /claim\s+audit\s+of\s*:?\s*([\s\S]{10,2000}?)(?:\n\s*(?:Then|Cover|Do not|Answer|Executive)|$)/i,
    );
    if (block?.[1]) {
      let qi = 0;
      const q = /[“"']([^”"']{8,500})[”"']/g;
      while ((m = q.exec(block[1])) !== null) {
        qi += 1;
        push(m[1]!, String(qi));
      }
    }
  }

  return claims.slice(0, 12);
}

function parseEntities(text: string): {
  entities: Record<string, { name: string; authority: EvidenceAuthority }>;
  distinctPairs: Array<[string, string]>;
} {
  const entities: Record<string, { name: string; authority: EvidenceAuthority }> = {};
  const distinctPairs: Array<[string, string]> = [];

  const eq =
    /\b([A-Z]{1,4}-?\d{1,4})\s*(?:=|is|equals?|maps?\s+to)\s+([A-Z][A-Za-z0-9\s-]{2,60}?)(?:\.|,|;|\n|$)/g;
  let m: RegExpExecArray | null;
  while ((m = eq.exec(text)) !== null) {
    const code = m[1]!.trim();
    const name = m[2]!.trim();
    const window = text.slice(Math.max(0, m.index - 40), m.index + 80);
    const authority: EvidenceAuthority = /registry|verified asset|asset registry/i.test(window)
      ? "verified_registry"
      : /planning|co-occur|same (?:file|note|list)/i.test(window)
        ? "planning_cooccurrence"
        : "owner_pack";
    // Registry outranks planning if both appear.
    if (!entities[code] || authority === "verified_registry") {
      entities[code] = { name, authority };
    }
  }

  // Named = code (Harbour Crown = HC-11)
  const namedEq =
    /\b([A-Z][A-Za-z0-9\s-]{2,40}?)\s*(?:=|is)\s+([A-Z]{1,4}-?\d{1,4})\b/g;
  while ((m = namedEq.exec(text)) !== null) {
    const name = m[1]!.trim();
    const code = m[2]!.trim();
    if (!entities[code]) entities[code] = { name, authority: "owner_pack" };
  }

  const distAnd =
    /\b([A-Z]{1,4}-?\d{1,4})\b\s+and\s+([A-Z][A-Za-z0-9\s-]{2,40}?)\s+are\s+(?:distinct|different)/gi;
  while ((m = distAnd.exec(text)) !== null) {
    distinctPairs.push([m[1]!.trim(), m[2]!.trim()]);
  }

  return { entities, distinctPairs };
}

function parsePopulation(text: string): PopulationState {
  const deployed = num(
    /\b(\d{1,5})\s+(?:deployed|sites?\s+deployed|deployed\s+sites?)\b/i.exec(text) ||
      /\bdeployed\s*[:=]?\s*(\d{1,5})\b/i.exec(text),
  );
  const measuredInitial = num(
    /\b(\d{1,5})\s+(?:originally\s+)?measured\b/i.exec(text) ||
      /\bmeasured(?:\s+initial)?\s*[:=]?\s*(\d{1,5})\b/i.exec(text),
  );
  const measuredValid = num(
    /\b(\d{1,5})\s+(?:currently\s+)?valid(?:ly)?\s+measured\b/i.exec(text) ||
      /\b(?:valid\s+measured|measured\s+valid)\s*[:=]?\s*(\d{1,5})\b/i.exec(text) ||
      /\bacross\s+(?:the\s+)?(\d{1,5})\s+valid\b/i.exec(text),
  );
  const pct = /(\d{1,3}(?:\.\d+)?)\s*%/.exec(text);
  const resultLabel = pct ? `${pct[1]}%` : null;

  let resultAppliesTo: PopulationState["resultAppliesTo"] = "unknown";
  if (measuredValid != null && /valid|measured\s+sites?/i.test(text)) {
    resultAppliesTo = "measured_valid";
  } else if (measuredInitial != null) {
    resultAppliesTo = "measured_initial";
  } else if (deployed != null && /all\s+\d+|across\s+all/i.test(text)) {
    resultAppliesTo = "deployed";
  }

  const unmeasuredOrInvalid =
    deployed != null && measuredValid != null ? Math.max(0, deployed - measuredValid) : null;

  return {
    deployed,
    measuredInitial,
    measuredValid,
    resultLabel,
    resultAppliesTo,
    unmeasuredOrInvalid,
  };
}

/**
 * Build canonical case state from the user message (owner pack).
 * Deterministic — does not call the LLM.
 */
export function buildCanonicalCaseState(userMessage: string): CanonicalCaseState {
  const text = String(userMessage || "");
  const { entities, distinctPairs } = parseEntities(text);
  const population = parsePopulation(text);

  const forecast = num(
    /\bforecast(?:\s+(?:revenue|occupancy|visits?))?\s*[:=]?\s*\$?\s*([\d,]+(?:\.\d+)?)/i.exec(
      text,
    ) || /\bforecast\s+\$?\s*([\d,]+)/i.exec(text),
  );
  const realised = num(
    /\brealis(?:ed|ed)(?:\s+(?:ledger|revenue|visits?))?\s*[:=]?\s*\$?\s*([\d,]+(?:\.\d+)?)/i.exec(
      text,
    ) || /\brealis(?:ed|ed)\s+\$?\s*([\d,]+)/i.exec(text),
  );

  // Occurrence: completed/delivered language without requiring "occurred" word
  const occurred =
    /\b(completed|delivered|performed|occurred|recorded (?:as )?complete|physically (?:occurred|completed)|service performed|stays completed|units completed)\b/i.test(
      text,
    )
      ? true
      : null;
  const laterReversal =
    /\b(refund|return(?:ed)?|charge\s*-?backs?|compensat|reversal|SLA (?:breach|failure))\b/i.test(
      text,
    );
  const invalidated =
    /\b(fraud(?:ulent)?|never (?:actually )?executed|erroneous (?:record|entry)|void(?:ed)?(?:\s+record|\s+entry)?|fabricat(?:ed|ion)|record (?:was )?false)\b/i.test(
      text,
    );

  const gross = num(/\bgross\s*[:=]?\s*\$?\s*([\d,]+)/i.exec(text));
  const refund = num(/\brefund(?:s|ed)?\s*[:=]?\s*\$?\s*([\d,]+)/i.exec(text));
  const net =
    gross != null && refund != null
      ? gross - refund
      : num(/\bnet\s*[:=]?\s*\$?\s*([\d,]+)/i.exec(text));

  const claimTexts = extractQuotedClaimsOnly(text);
  const claims = claimTexts.map((t, i) => ({ index: i + 1, text: t }));

  const propositions: CanonicalProposition[] = [];

  for (const [code, ent] of Object.entries(entities)) {
    propositions.push({
      id: `entity.${norm(code)}`,
      kind: "entity_identity",
      subject: code,
      predicate: "identity",
      value: ent.name,
      status: "VERIFIED",
      evidence: `${ent.authority}: ${code} = ${ent.name}`,
      authority: ent.authority,
    });
  }

  for (const [a, b] of distinctPairs) {
    propositions.push({
      id: `entity.${norm(a)}.not.${norm(b)}`,
      kind: "entity_equality",
      subject: a,
      predicate: "not_equal",
      value: b,
      status: "VERIFIED",
      evidence: `${a} distinct from ${b}`,
      authority: "owner_pack",
    });
  }

  if (forecast != null && realised != null) {
    propositions.push({
      id: "finance.forecast_ne_realised",
      kind: "forecast_vs_realised",
      subject: "forecast",
      predicate: "not_equal",
      value: `forecast=${forecast};realised=${realised}`,
      status: forecast === realised ? "VERIFIED" : "VERIFIED",
      evidence: `forecast ${forecast} vs realised ${realised}`,
      authority: "owner_pack",
    });
    if (forecast !== realised) {
      propositions[propositions.length - 1]!.predicate = "not_equal";
    }
  } else if (forecast != null) {
    propositions.push({
      id: "finance.forecast_only",
      kind: "forecast_vs_realised",
      subject: "forecast",
      predicate: "is",
      value: String(forecast),
      status: "FORECAST_ONLY",
      evidence: "forecast without realised confirmation",
      authority: "owner_pack",
    });
  }

  if (population.deployed != null && population.resultLabel) {
    const applies =
      population.resultAppliesTo === "measured_valid" && population.measuredValid != null
        ? population.measuredValid
        : population.resultAppliesTo === "deployed"
          ? population.deployed
          : null;
    propositions.push({
      id: "population.result_scope",
      kind: "population_scope",
      subject: "result",
      predicate: "applies_to",
      value: applies != null ? String(applies) : "unknown",
      status: "VERIFIED",
      evidence: `result ${population.resultLabel} applies to ${population.resultAppliesTo}`,
      populationScope:
        population.measuredValid != null
          ? `valid_measured=${population.measuredValid};deployed=${population.deployed}`
          : `deployed=${population.deployed}`,
      authority: "owner_pack",
    });
  }

  if (occurred === true && !invalidated) {
    propositions.push({
      id: "event.occurrence",
      kind: "event_occurrence",
      subject: "historical_event",
      predicate: "occurred",
      value: "true",
      status: "VERIFIED",
      evidence: laterReversal
        ? "occurrence established; later reversal is separate outcome"
        : "occurrence established in pack",
      authority: "owner_pack",
      temporalScope: laterReversal ? "EVENT_OCCURRED;LATER_OUTCOME" : "EVENT_OCCURRED",
    });
  }
  if (invalidated) {
    propositions.push({
      id: "event.occurrence",
      kind: "event_occurrence",
      subject: "historical_event",
      predicate: "occurred",
      value: "false",
      status: "CONTRADICTED",
      evidence: "pack supplies record invalidation",
      authority: "owner_pack",
    });
  }

  if (gross != null && refund != null && net != null) {
    propositions.push({
      id: "finance.net",
      kind: "financial_net",
      subject: "net",
      predicate: "equals",
      value: String(net),
      status: "VERIFIED",
      evidence: `gross ${gross} − refund ${refund} = ${net}`,
      authority: "owner_pack",
    });
  }

  // Evidence precedence: registry > planning co-occurrence
  propositions.push({
    id: "meta.evidence_precedence",
    kind: "evidence_precedence",
    subject: "identity",
    predicate: "precedence",
    value: "verified_registry>planning_cooccurrence>supplier_claim",
    status: "VERIFIED",
    evidence: "canonical precedence ladder",
    authority: "owner_pack",
  });

  const domainHint = /\bhotel|hospitality|room[- ]?nights?\b/i.test(text)
    ? "hospitality"
    : /\bbattery|industrial|manufactur|deployed sites?\b/i.test(text)
      ? "industrial"
      : /\bhealthcare|patient|clinic\b/i.test(text)
        ? "healthcare"
        : /\blogistics|shipment\b/i.test(text)
          ? "logistics"
          : "generic";

  const decisionActions = buildActionEligibilityStates(text);
  const causal = buildCanonicalCausalState(text);

  for (const l of causal.links.slice(0, 12)) {
    propositions.push({
      id: `causal.link.${norm(l.from)}.${norm(l.to)}`,
      kind: "causal_link",
      subject: l.from,
      predicate: l.kind,
      value: l.to,
      status: l.status === "VERIFIED" ? "VERIFIED" : l.status === "INFERRED" ? "UNPROVEN" : "UNKNOWN",
      evidence: l.evidence,
      authority: "owner_pack",
    });
  }
  for (const r of causal.roles.slice(0, 12)) {
    propositions.push({
      id: `causal.role.${norm(r.entity)}`,
      kind: "causal_role",
      subject: r.entity,
      predicate: "causal_role",
      value: r.role,
      status: r.status === "VERIFIED" ? "VERIFIED" : r.status === "UNKNOWN" ? "UNKNOWN" : "UNPROVEN",
      evidence: r.evidence,
      authority: "owner_pack",
    });
  }

  return {
    domainHint,
    entities,
    distinctPairs,
    forecast,
    realised,
    population,
    occurrence: { occurred, laterReversal, invalidated },
    financial: { gross, refund, net },
    claims,
    propositions,
    decisionActions,
    causal,
    failureStageHints: [],
  };
}

export type ClaimVerdictFromState = {
  verdict: "supported" | "contradicted" | "unproven" | "unknown";
  justification: string;
  propositionId?: string;
};

/** Map a claim text to a verdict using canonical state only. */
export function verdictClaimAgainstCanonical(
  claimText: string,
  state: CanonicalCaseState,
): ClaimVerdictFromState {
  const t = claimText.trim();

  // Identity: "CODE is Name"
  const idClaim = /\b([A-Z]{1,4}-?\d{1,4})\s+is\s+(?:definitely\s+)?([A-Z][A-Za-z0-9\s-]{2,60})/i.exec(
    t,
  );
  if (idClaim) {
    const code = idClaim[1]!;
    const named = idClaim[2]!.trim();
    const ent = state.entities[code];
    if (ent) {
      if (norm(ent.name) !== norm(named)) {
        // Claim equates code to another entity's name?
        const boundElsewhere = Object.entries(state.entities).some(
          ([c, e]) => c !== code && (norm(e.name) === norm(named) || norm(e.name).includes(norm(named))),
        );
        return {
          verdict: "contradicted",
          justification: boundElsewhere
            ? `Verified identity: ${code} = ${ent.name} (${ent.authority}). "${named}" is bound to a different registry identity.`
            : `Verified identity: ${code} = ${ent.name} (${ent.authority}). Claim asserts ${code} = ${named}.`,
          propositionId: `entity.${norm(code)}`,
        };
      }
      return {
        verdict: "supported",
        justification: `Consistent with verified identity: ${code} = ${ent.name}.`,
        propositionId: `entity.${norm(code)}`,
      };
    }
    // "BT-410 is System K" where System K maps to SK-220
    for (const [otherCode, e] of Object.entries(state.entities)) {
      if (norm(e.name) === norm(named) && otherCode !== code) {
        return {
          verdict: "contradicted",
          justification: `${named} is bound to ${otherCode}, not ${code}.`,
          propositionId: `entity.${norm(otherCode)}`,
        };
      }
    }
    // Partial: "is System K" when System K is a named assembly with different code
    if (/\bSystem\s+[A-Z]\b/i.test(named) || /assembly/i.test(named)) {
      const assembly = Object.entries(state.entities).find(([, e]) =>
        /system|assembly/i.test(e.name),
      );
      if (assembly && assembly[0] !== code) {
        return {
          verdict: "contradicted",
          justification: `Verified registry binds ${code} to ${state.entities[code]?.name ?? "another identity"}; ${named} is not that identity.`,
          propositionId: `entity.${norm(code)}`,
        };
      }
    }
  }

  // Forecast equals realised
  if (
    /\b(forecast|expected|estimate).{0,40}(is|equals|=|reaches).{0,20}(realised|realized|actual)/i.test(
      t,
    ) ||
    /\bforecast equals realised\b/i.test(t)
  ) {
    if (state.forecast != null && state.realised != null && state.forecast !== state.realised) {
      return {
        verdict: "contradicted",
        justification: `Forecast ${state.forecast} ≠ realised ${state.realised}.`,
        propositionId: "finance.forecast_ne_realised",
      };
    }
  }

  // Population generalization: all N demonstrate result / N deployed sites demonstrate
  const allSites =
    /\ball\s+(\d+)\b/i.exec(t) ||
    /\b(\d+)\s+deployed sites?\s+demonstrate/i.exec(t) ||
    /(?:across|for)\s+(?:all\s+)?(\d+)\s+(?:deployed\s+)?sites?/i.exec(t);
  if (allSites && /\d+\s*%|saving|reduction|average/i.test(t)) {
    const claimedN = Number(allSites[1]);
    const pop = state.population;
    if (
      pop.deployed != null &&
      pop.measuredValid != null &&
      pop.measuredValid < pop.deployed &&
      (pop.resultAppliesTo === "measured_valid" || claimedN === pop.deployed)
    ) {
      return {
        verdict: "contradicted",
        justification: `Result ${pop.resultLabel ?? ""} applies to ${pop.measuredValid} valid measured sites, not all ${pop.deployed} deployed.`,
        propositionId: "population.result_scope",
      };
    }
  }

  // Occurrence denial via later refund
  if (
    (/never\s+(?:historically\s+)?occurred|did not (?:historically )?occur|never occurred/i.test(t) ||
      /event never occurred/i.test(t) ||
      /completion never historically occurred/i.test(t)) &&
    (/refund|return|later|compensat/i.test(t) || state.occurrence.laterReversal)
  ) {
    if (state.occurrence.occurred && !state.occurrence.invalidated) {
      return {
        verdict: "contradicted",
        justification:
          "Historical occurrence is established; a later refund/outcome does not by itself erase occurrence.",
        propositionId: "event.occurrence",
      };
    }
  }

  // Causal claims only — do not intercept unrelated claim families.
  if (
    /\b(?:causal|directly\s+caused|direct\s+cause|root\s+cause|no\s+(?:causal\s+)?role|played\s+no|not\s+related|unrelated|indirect|causally)\b/i.test(
      t,
    )
  ) {
    const cv = verdictCausalClaim(t, state.causal);
    return {
      verdict: cv.verdict,
      justification: cv.justification,
      propositionId: `causal.${cv.class}`,
    };
  }

  // Supplier vs independent — prefer unproven for lone supplier "established"
  if (/supplier.{0,40}(?:stands|established|confirmed)/i.test(t) && !/independent/i.test(t)) {
    return {
      verdict: "unproven",
      justification: "Supplier assertions alone do not establish the claim without independent corroboration.",
    };
  }

  return {
    verdict: "unproven",
    justification: "Not established from the supplied scenario evidence alone.",
  };
}

export function formatCanonicalStateBrief(state: CanonicalCaseState): string {
  const lines = ["[Canonical case state — derive conclusions from this; do not reverse verified propositions]"];
  for (const [code, e] of Object.entries(state.entities)) {
    lines.push(`- ENTITY ${code} = ${e.name} (${e.authority})`);
  }
  for (const [a, b] of state.distinctPairs) {
    lines.push(`- DISTINCT ${a} ≠ ${b}`);
  }
  if (state.forecast != null || state.realised != null) {
    lines.push(`- FORECAST=${state.forecast ?? "?"} REALISED=${state.realised ?? "?"}`);
  }
  const p = state.population;
  if (p.deployed != null || p.measuredValid != null) {
    lines.push(
      `- POPULATION deployed=${p.deployed ?? "?"} measured_valid=${p.measuredValid ?? "?"} result=${p.resultLabel ?? "?"} applies_to=${p.resultAppliesTo}`,
    );
  }
  if (state.occurrence.occurred != null) {
    lines.push(
      `- OCCURRENCE occurred=${state.occurrence.occurred} later_reversal=${state.occurrence.laterReversal} invalidated=${state.occurrence.invalidated}`,
    );
  }
  if (state.claims.length) {
    lines.push(`- CLAIMS expected=${state.claims.length} (quoted only; section headings are not claims)`);
  }
  if (state.decisionActions.some((a) => a.requiredGates.length > 0)) {
    lines.push(formatActionEligibilityBrief(state.decisionActions));
  }
  const causalBrief = formatCausalStateBrief(state.causal);
  if (causalBrief) lines.push(causalBrief);
  return lines.join("\n");
}

/** Strip duplicate trailing claim-audit / claim-verdict sections (schema misread residue). */
export function stripDuplicateClaimAuditBlocks(answer: string): string {
  let out = String(answer || "");
  // If more than one "### Claim Verdicts" / "### Claim audit" style heading, keep first + Claim N blocks only once.
  const headings = [...out.matchAll(/^#{1,3}\s*Claim\s+(?:Verdicts?|Audit|Set)\b.*$/gim)];
  if (headings.length >= 2) {
    const second = headings[1]!.index ?? -1;
    if (second > 0) {
      // Keep body before second heading; re-append unique ### Claim N from whole text later via enforce
      out = out.slice(0, second).trim();
    }
  }
  return out;
}

export function localizeFailureStage(
  stage:
    | "INPUT_PARSE"
    | "CASE_STATE"
    | "REASONING_STATE"
    | "ANSWER_PLAN"
    | "LLM_REALIZATION"
    | "VALIDATION"
    | "PRESENTATION",
  detail: string,
): { stage: string; detail: string } {
  return { stage, detail };
}
