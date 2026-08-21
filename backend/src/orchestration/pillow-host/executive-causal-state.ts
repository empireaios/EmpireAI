/**
 * Canonical causal state — observation ≠ causation; direct ≠ indirect;
 * causally connected ≠ same root cause.
 * Deterministic. Does not encode sealed examination scenarios.
 */

export type CausalEvidenceStatus = "VERIFIED" | "INFERRED" | "UNKNOWN";

export type CausalRelationKind =
  | "DIRECT_CAUSE"
  | "UPSTREAM_TRIGGER"
  | "INTERMEDIATE_ACTION"
  | "DOWNSTREAM_CONSEQUENCE"
  | "COMMON_ROOT_CAUSE"
  | "CORRELATION_ONLY"
  | "INDIRECT_CAUSAL_DEPENDENCY";

export type CausalRoleKind =
  | "DIRECT_CAUSE_ACTOR"
  | "INDIRECT_PARTICIPANT"
  | "DOWNSTREAM_CONSEQUENCE"
  | "MITIGATION_ACTOR"
  | "UNAFFECTED_OBSERVED"
  | "CAUSAL_NON_PARTICIPATION"
  | "UNKNOWN_CAUSAL_ROLE";

export type CausalLink = {
  id: string;
  from: string;
  to: string;
  kind: CausalRelationKind;
  status: CausalEvidenceStatus;
  evidence: string;
};

export type CausalEntityRole = {
  entity: string;
  role: CausalRoleKind;
  observation: string | null;
  status: CausalEvidenceStatus;
  evidence: string;
};

export type CanonicalCausalState = {
  events: string[];
  links: CausalLink[];
  roles: CausalEntityRole[];
  /** Demonstrated failure mechanism from the pack (not generic advice). */
  demonstratedRiskMechanism: string | null;
  recoveryOccurred: boolean;
  residualRiskOpen: boolean;
};

function normEntity(s: string): string {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function key(s: string): string {
  return normEntity(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);
}

const RESERVED = new Set([
  "directly",
  "direct",
  "failover",
  "mitigation",
  "handoff",
  "recovery",
  "action",
  "overload",
  "secondary",
  "failure",
  "cascade",
  "prior",
  "the",
  "a",
  "an",
  "root",
  "cause",
  "common",
  "then",
  "and",
  "entity",
  "node",
  "region",
  "module",
  "site",
  "zone",
  "primary",
  "peer",
]);

function isEntityToken(s: string): boolean {
  const k = key(s);
  if (!k || RESERVED.has(k)) return false;
  if (/^failover_to_/.test(k)) return false;
  return true;
}

function pushLink(
  links: CausalLink[],
  from: string,
  to: string,
  kind: CausalRelationKind,
  evidence: string,
  status: CausalEvidenceStatus = "VERIFIED",
): void {
  const f = normEntity(from);
  const t = normEntity(to);
  if (!f || !t || key(f) === key(t)) return;
  if (!isEntityToken(f) || !isEntityToken(t)) return;
  if (links.some((l) => key(l.from) === key(f) && key(l.to) === key(t) && l.kind === kind)) {
    return;
  }
  links.push({
    id: `link_${links.length + 1}_${key(f)}_${key(t)}`,
    from: f,
    to: t,
    kind,
    status,
    evidence,
  });
}

function upsertRole(
  roles: CausalEntityRole[],
  entity: string,
  role: CausalRoleKind,
  evidence: string,
  observation: string | null = null,
  status: CausalEvidenceStatus = "VERIFIED",
): void {
  const e = normEntity(entity);
  if (!e || !isEntityToken(e)) return;
  const existing = roles.find((r) => key(r.entity) === key(e));
  const rank: Record<CausalRoleKind, number> = {
    DIRECT_CAUSE_ACTOR: 6,
    MITIGATION_ACTOR: 5,
    INDIRECT_PARTICIPANT: 4,
    DOWNSTREAM_CONSEQUENCE: 4,
    CAUSAL_NON_PARTICIPATION: 5,
    UNAFFECTED_OBSERVED: 2,
    UNKNOWN_CAUSAL_ROLE: 1,
  };
  if (existing) {
    if (rank[role] >= rank[existing.role]) {
      existing.role = role;
      existing.evidence = evidence;
      existing.observation = observation ?? existing.observation;
      existing.status = status;
    }
    return;
  }
  roles.push({ entity: e, role, observation, status, evidence });
}

/** Build causal state from owner pack (deterministic). */
export function buildCanonicalCausalState(userMessage: string): CanonicalCausalState {
  const text = String(userMessage || "");
  const links: CausalLink[] = [];
  const roles: CausalEntityRole[] = [];
  const events: string[] = [];

  const directRes = [
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+directly\s+caused\s+([A-Z][A-Za-z0-9_-]{1,40})\b/g,
    /\b(?:the\s+)?(?:direct\s+)?(?:root\s+)?cause\s+of\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:was|is)\s+([A-Z][A-Za-z0-9_-]{1,40})\b/g,
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+caused\s+(?:the\s+)?([A-Z][A-Za-z0-9_-]{1,40})\b/g,
  ];
  for (const re of directRes) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (/cause\s+of/i.test(m[0]!)) {
        pushLink(links, m[2]!, m[1]!, "DIRECT_CAUSE", m[0]!.trim());
        upsertRole(roles, m[2]!, "DIRECT_CAUSE_ACTOR", m[0]!.trim());
        upsertRole(roles, m[1]!, "DOWNSTREAM_CONSEQUENCE", m[0]!.trim());
        events.push(normEntity(m[1]!));
      } else {
        pushLink(links, m[1]!, m[2]!, "DIRECT_CAUSE", m[0]!.trim());
        upsertRole(roles, m[1]!, "DIRECT_CAUSE_ACTOR", m[0]!.trim());
        upsertRole(roles, m[2]!, "DOWNSTREAM_CONSEQUENCE", m[0]!.trim());
        events.push(normEntity(m[2]!));
      }
    }
  }

  const triggerRes = [
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+triggered\s+(?:a\s+|the\s+)?failover\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/g,
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:led\s+to|initiated)\s+(?:a\s+|the\s+)?(?:failover|mitigation|handoff)\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/g,
    /\bfailover\s+from\s+([A-Z][A-Za-z0-9_-]{1,40})\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/g,
    /\bfailover\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/g,
  ];
  for (const re of triggerRes) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[2]) {
        pushLink(links, m[1]!, m[2]!, "UPSTREAM_TRIGGER", m[0]!.trim());
        upsertRole(roles, m[2]!, "MITIGATION_ACTOR", m[0]!.trim());
        upsertRole(roles, m[1]!, "INDIRECT_PARTICIPANT", m[0]!.trim());
        events.push(normEntity(m[2]!));
      } else if (m[1]) {
        // "failover to X" alone — link prior failure context if any
        pushLink(links, "UpstreamFailure", m[1]!, "UPSTREAM_TRIGGER", m[0]!.trim());
        upsertRole(roles, m[1]!, "MITIGATION_ACTOR", m[0]!.trim());
        events.push(normEntity(m[1]!));
      }
    }
  }

  const secondaryRes = [
    /\b(?:failover|mitigation|handoff)\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\s+then\s+caused\s+overload\s+on\s+([A-Z][A-Za-z0-9_-]{1,40})\b/g,
    /\b(?:failover|mitigation|handoff|recovery\s+action)\s+(?:then\s+)?(?:directly\s+)?(?:caused|produced)\s+(?:an?\s+)?(?:overload|secondary\s+failure|cascade)\s+(?:on|of|at)\s+([A-Z][A-Za-z0-9_-]{1,40})\b/g,
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+then\s+(?:overloaded|saturated|exhausted)\s+([A-Z][A-Za-z0-9_-]{1,40})\b/g,
    /\boverload\s+on\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:was|is)\s+(?:directly\s+)?caused\s+by\s+(?:the\s+)?failover\s+to\s+([A-Z][A-Za-z0-9_-]{1,40})\b/g,
  ];
  for (const re of secondaryRes) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const raw = m[0]!;
      if (/then\s+caused\s+overload/i.test(raw) && m[1] && m[2]) {
        pushLink(links, m[1]!, m[2]!, "DIRECT_CAUSE", raw.trim());
        upsertRole(roles, m[1]!, "MITIGATION_ACTOR", raw.trim());
        upsertRole(roles, m[2]!, "DOWNSTREAM_CONSEQUENCE", raw.trim());
        events.push(normEntity(m[2]!));
      } else if (/then\s+(?:overloaded|saturated|exhausted)/i.test(raw) && m[1] && m[2]) {
        pushLink(links, m[1]!, m[2]!, "DIRECT_CAUSE", raw.trim());
        upsertRole(roles, m[1]!, "MITIGATION_ACTOR", raw.trim());
        upsertRole(roles, m[2]!, "DOWNSTREAM_CONSEQUENCE", raw.trim());
        events.push(normEntity(m[2]!));
      } else if (/caused by/i.test(raw) && m[1] && m[2]) {
        pushLink(links, m[2]!, m[1]!, "DIRECT_CAUSE", raw.trim());
        upsertRole(roles, m[1]!, "DOWNSTREAM_CONSEQUENCE", raw.trim());
        events.push(normEntity(m[1]!));
      } else if (m[1] && !m[2]) {
        pushLink(links, "FailoverMitigation", m[1]!, "DIRECT_CAUSE", raw.trim());
        upsertRole(roles, m[1]!, "DOWNSTREAM_CONSEQUENCE", raw.trim());
        events.push(normEntity(m[1]!));
      }
    }
  }

  const chainArrow =
    /\b([A-Z][A-Za-z0-9_-]{1,30})\s*(?:→|->|then)\s*([A-Z][A-Za-z0-9_-]{1,30})\s*(?:→|->|then)\s*([A-Z][A-Za-z0-9_-]{1,30})(?:\s*(?:→|->|then)\s*([A-Z][A-Za-z0-9_-]{1,30}))?/g;
  let cm: RegExpExecArray | null;
  while ((cm = chainArrow.exec(text)) !== null) {
    const nodes = [cm[1]!, cm[2]!, cm[3]!, cm[4]].filter(Boolean) as string[];
    for (let i = 0; i < nodes.length - 1; i++) {
      pushLink(
        links,
        nodes[i]!,
        nodes[i + 1]!,
        "INDIRECT_CAUSAL_DEPENDENCY",
        cm[0]!.trim(),
        "INFERRED",
      );
      upsertRole(
        roles,
        nodes[i]!,
        i === 0 ? "DIRECT_CAUSE_ACTOR" : "INDIRECT_PARTICIPANT",
        cm[0]!.trim(),
      );
      upsertRole(roles, nodes[i + 1]!, "DOWNSTREAM_CONSEQUENCE", cm[0]!.trim());
    }
  }

  if (/\b(?:correlated|co[- ]occurred|co[- ]occurrence)\b/i.test(text) && !/\bcaused\b/i.test(text)) {
    const corr =
      /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:are\s+)?(?:correlated|co[- ]occurred)/i.exec(
        text,
      );
    if (corr) {
      pushLink(links, corr[1]!, corr[2]!, "CORRELATION_ONLY", corr[0]!, "VERIFIED");
    }
  }

  const common =
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+share\s+(?:the\s+)?(?:same\s+)?(?:common\s+)?root\s+cause\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
      text,
    ) ||
    /\bcommon\s+root\s+cause\s+(?:of\s+)?([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:is|was)\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
      text,
    );
  if (common) {
    pushLink(links, common[3]!, common[1]!, "COMMON_ROOT_CAUSE", common[0]!);
    pushLink(links, common[3]!, common[2]!, "COMMON_ROOT_CAUSE", common[0]!);
    upsertRole(roles, common[3]!, "DIRECT_CAUSE_ACTOR", common[0]!);
  }

  const healthyRes =
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:remained|stayed|was)\s+(?:healthy|unaffected|stable|online|nominal)(?:\s+throughout)?\b/gi;
  let hm: RegExpExecArray | null;
  while ((hm = healthyRes.exec(text)) !== null) {
    upsertRole(
      roles,
      hm[1]!,
      "UNAFFECTED_OBSERVED",
      hm[0]!.trim(),
      "remained healthy / no supplied evidence of failure",
    );
  }

  const noRoleRes =
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:was\s+)?(?:affirmatively\s+)?(?:not\s+(?:in\s+the\s+)?(?:causal\s+)?(?:path|chain|loop)|excluded\s+from\s+(?:the\s+)?(?:incident|path)|had\s+no\s+(?:operational|causal)\s+(?:path|involvement)|was\s+offline\s+and\s+not\s+invoked)\b/gi;
  let nm: RegExpExecArray | null;
  while ((nm = noRoleRes.exec(text)) !== null) {
    upsertRole(roles, nm[1]!, "CAUSAL_NON_PARTICIPATION", nm[0]!.trim(), null, "VERIFIED");
  }

  const derived = [...links];
  for (const a of links) {
    for (const b of links) {
      if (key(a.to) === key(b.from) && key(a.from) !== key(b.to)) {
        if (
          a.kind !== "CORRELATION_ONLY" &&
          b.kind !== "CORRELATION_ONLY" &&
          !derived.some(
            (l) =>
              key(l.from) === key(a.from) &&
              key(l.to) === key(b.to) &&
              l.kind === "INDIRECT_CAUSAL_DEPENDENCY",
          )
        ) {
          pushLink(
            derived,
            a.from,
            b.to,
            "INDIRECT_CAUSAL_DEPENDENCY",
            `inferred via ${a.from}→${a.to}→${b.to}`,
            "INFERRED",
          );
          upsertRole(roles, a.from, "INDIRECT_PARTICIPANT", `indirect path to ${b.to}`);
        }
      }
    }
  }

  let demonstratedRiskMechanism: string | null = null;
  if (
    /\bfailover\b/i.test(text) &&
    /\b(?:overload(?:ed|s|ing)?|saturat(?:e|ed|ion|es|ing)?|exhaust(?:ed|ion|s|ing)?|capacity\s+breach|resource\s+exhaust)/i.test(
      text,
    )
  ) {
    demonstratedRiskMechanism =
      "failover/mitigation can overload the receiving path — protect resources under failover";
  } else if (
    /\bmitigation\b/i.test(text) &&
    /\b(?:secondary\s+failure|cascade|overload(?:ed|s|ing)?)\b/i.test(text)
  ) {
    demonstratedRiskMechanism =
      "mitigation action can induce secondary failure — bound mitigation blast radius";
  }

  const recoveryOccurred =
    /\b(?:recovered|restored|back\s+online|service\s+restored|incident\s+(?:closed|resolved))\b/i.test(
      text,
    );
  const residualRiskOpen =
    Boolean(demonstratedRiskMechanism) &&
    !/\b(?:root\s+cause\s+(?:fully\s+)?(?:removed|eliminated)|risk\s+(?:fully\s+)?(?:cleared|removed)|mechanism\s+(?:fully\s+)?(?:fixed|eliminated))\b/i.test(
      text,
    );

  const named =
    text.match(/\b(?:Entity|Node|Region|Module|Site|Zone)\s+([A-Z][A-Za-z0-9_-]{1,40})\b/g) || [];
  for (const n of named) {
    const ent = n.replace(/^(?:Entity|Node|Region|Module|Site|Zone)\s+/i, "");
    if (!roles.some((r) => key(r.entity) === key(ent))) {
      upsertRole(roles, ent, "UNKNOWN_CAUSAL_ROLE", "named without causal evidence", null, "UNKNOWN");
    }
  }

  return {
    events: [...new Set(events.filter(Boolean))],
    links: derived,
    roles,
    demonstratedRiskMechanism,
    recoveryOccurred,
    residualRiskOpen,
  };
}

export function hasCausalPath(
  state: CanonicalCausalState,
  from: string,
  to: string,
): boolean {
  const start = key(from);
  const goal = key(to);
  if (!start || !goal) return false;
  const adj = new Map<string, string[]>();
  for (const l of state.links) {
    if (l.kind === "CORRELATION_ONLY") continue;
    const a = key(l.from);
    const b = key(l.to);
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push(b);
  }
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === goal) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const nxt of adj.get(cur) || []) stack.push(nxt);
  }
  return false;
}

export function shareCommonRootCause(
  state: CanonicalCausalState,
  a: string,
  b: string,
): boolean {
  const rootsA = state.links
    .filter((l) => l.kind === "COMMON_ROOT_CAUSE" && key(l.to) === key(a))
    .map((l) => key(l.from));
  const rootsB = state.links
    .filter((l) => l.kind === "COMMON_ROOT_CAUSE" && key(l.to) === key(b))
    .map((l) => key(l.from));
  return rootsA.some((r) => rootsB.includes(r));
}

export function isDirectCause(
  state: CanonicalCausalState,
  from: string,
  to: string,
): boolean {
  return state.links.some(
    (l) =>
      key(l.from) === key(from) &&
      key(l.to) === key(to) &&
      (l.kind === "DIRECT_CAUSE" || l.kind === "COMMON_ROOT_CAUSE"),
  );
}

export function roleFor(state: CanonicalCausalState, entity: string): CausalEntityRole | null {
  return state.roles.find((r) => key(r.entity) === key(entity)) ?? null;
}

export type CausalClaimVerdict = {
  verdict: "supported" | "contradicted" | "unproven" | "unknown";
  justification: string;
  class:
    | "observation_vs_causation"
    | "direct_vs_indirect"
    | "connection_vs_common_root"
    | "correlation_only"
    | "non_participation"
    | "generic";
};

/** Evaluate a causal claim against canonical causal state. */
export function verdictCausalClaim(
  claimText: string,
  state: CanonicalCausalState,
): CausalClaimVerdict {
  const t = claimText.trim();

  const noRole =
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:played|had|has)\s+no\s+(?:causal|operational)?\s*(?:role|involvement|part)\b/i.exec(
      t,
    ) ||
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:was|is)\s+(?:causally\s+)?(?:irrelevant|uninvolved|not\s+involved)\b/i.exec(
      t,
    );
  if (noRole) {
    const ent = noRole[1]!;
    const role = roleFor(state, ent);
    if (role?.role === "CAUSAL_NON_PARTICIPATION") {
      return {
        verdict: "supported",
        justification: `Affirmative evidence establishes causal non-participation for ${ent}.`,
        class: "non_participation",
      };
    }
    if (role?.role === "UNAFFECTED_OBSERVED") {
      return {
        verdict: "contradicted",
        justification: `OBSERVED_UNAFFECTED ≠ PROVEN_NO_CAUSAL_ROLE. ${ent} remained healthy; that does not establish causal non-participation without affirmative path/exclusion evidence.`,
        class: "observation_vs_causation",
      };
    }
    return {
      verdict: "unproven",
      justification: `Causal non-participation of ${ent} is not established from the supplied evidence.`,
      class: "non_participation",
    };
  }

  const unrelated =
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:are|were)\s+(?:not\s+related|unrelated|causally\s+independent|independent)\b/i.exec(
      t,
    ) ||
    /\b(?:no\s+(?:causal\s+)?(?:link|connection|relation)\s+between)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
      t,
    );
  if (unrelated) {
    const a = unrelated[1]!;
    const b = unrelated[2]!;
    if (hasCausalPath(state, a, b) || hasCausalPath(state, b, a)) {
      return {
        verdict: "contradicted",
        justification: `DIFFERENT_DIRECT_CAUSES ≠ CAUSALLY_UNRELATED. A causal path connects ${a} and ${b} even if direct causes differ.`,
        class: "connection_vs_common_root",
      };
    }
  }

  const directClaim =
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:is|was)\s+(?:the\s+)?direct\s+cause\s+of\s+([A-Z][A-Za-z0-9_-]{1,40})\b/i.exec(
      t,
    );
  if (directClaim) {
    const a = directClaim[1]!;
    const b = directClaim[2]!;
    if (isDirectCause(state, a, b)) {
      return {
        verdict: "supported",
        justification: `Verified direct cause: ${a} → ${b}.`,
        class: "direct_vs_indirect",
      };
    }
    if (hasCausalPath(state, a, b)) {
      return {
        verdict: "contradicted",
        justification: `DIRECT_CAUSE ≠ INDIRECT_CAUSAL_DEPENDENCY. ${a} is causally connected to ${b} but is not established as ${b}'s direct cause.`,
        class: "direct_vs_indirect",
      };
    }
    return {
      verdict: "unproven",
      justification: `Direct causation ${a} → ${b} is not established.`,
      class: "direct_vs_indirect",
    };
  }

  const sameRoot =
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:and|&)\s+([A-Z][A-Za-z0-9_-]{1,40})\s+(?:share|have)\s+(?:the\s+)?(?:same\s+)?(?:common\s+)?root\s+cause\b/i.exec(
      t,
    );
  if (sameRoot) {
    const a = sameRoot[1]!;
    const b = sameRoot[2]!;
    if (shareCommonRootCause(state, a, b)) {
      return {
        verdict: "supported",
        justification: `Verified common root cause linking ${a} and ${b}.`,
        class: "connection_vs_common_root",
      };
    }
    if (hasCausalPath(state, a, b) || hasCausalPath(state, b, a)) {
      return {
        verdict: "contradicted",
        justification: `CAUSALLY_CONNECTED ≠ SAME_ROOT_CAUSE. ${a} and ${b} are connected by a chain but do not share a verified common root cause.`,
        class: "connection_vs_common_root",
      };
    }
    return {
      verdict: "unproven",
      justification: `Common root cause for ${a} and ${b} is not established.`,
      class: "connection_vs_common_root",
    };
  }

  const healthy =
    /\b([A-Z][A-Za-z0-9_-]{1,40})\s+(?:remained|stayed|was)\s+(?:healthy|unaffected)\b/i.exec(t);
  if (healthy) {
    const role = roleFor(state, healthy[1]!);
    if (role?.role === "UNAFFECTED_OBSERVED" || role?.role === "CAUSAL_NON_PARTICIPATION") {
      return {
        verdict: "supported",
        justification: `Observation supported: ${healthy[1]} remained healthy / unaffected as stated.`,
        class: "observation_vs_causation",
      };
    }
  }

  return {
    verdict: "unproven",
    justification: "Causal claim not established from the supplied scenario evidence alone.",
    class: "generic",
  };
}

export function formatCausalStateBrief(state: CanonicalCausalState): string {
  if (!state.links.length && !state.roles.length && !state.demonstratedRiskMechanism) {
    return "";
  }
  const lines = [
    "[Canonical causal state — OBSERVED_UNAFFECTED ≠ PROVEN_NO_CAUSAL_ROLE; DIFFERENT_DIRECT_CAUSES ≠ CAUSALLY_UNRELATED; CAUSALLY_CONNECTED ≠ SAME_ROOT_CAUSE]",
  ];
  for (const l of state.links.slice(0, 16)) {
    lines.push(`- LINK ${l.from} =[${l.kind}/${l.status}]=> ${l.to}`);
  }
  for (const r of state.roles.slice(0, 12)) {
    lines.push(
      `- ROLE ${r.entity}=${r.role}${r.observation ? ` obs="${r.observation}"` : ""} (${r.status})`,
    );
  }
  if (state.demonstratedRiskMechanism) {
    lines.push(`- DEMONSTRATED_RISK_MECHANISM=${state.demonstratedRiskMechanism}`);
    lines.push(
      `- RECOVERY=${state.recoveryOccurred ? "YES" : "NO"} RESIDUAL_RISK_OPEN=${state.residualRiskOpen ? "YES" : "NO"} (RECOVERY ≠ automatic risk removal)`,
    );
  }
  return lines.join("\n");
}

/** Prioritize demonstrated mechanism over generic monitoring advice. */
export function synthesizeCausalRiskLesson(state: CanonicalCausalState): string {
  if (!state.demonstratedRiskMechanism) {
    return [
      "### Risk / lesson",
      "No specific demonstrated failure mechanism is identified from the pack beyond generic residual uncertainty.",
      "Do not invent remedies beyond supplied evidence.",
    ].join("\n");
  }
  const lines = [
    "### Risk / lesson",
    `**Demonstrated mechanism:** ${state.demonstratedRiskMechanism}`,
    "",
    "Strongest supported follow-up concerns that demonstrated mechanism — not generic “continue monitoring.”",
  ];
  if (state.recoveryOccurred && state.residualRiskOpen) {
    lines.push(
      "",
      "**RECOVERY ≠ RISK REMOVAL:** service recovery does not by itself eliminate the demonstrated causal risk.",
    );
  }
  lines.push("", "Do not invent remedies beyond the supplied evidence.");
  return lines.join("\n");
}

/**
 * Repair answer slices that collapse observation→non-participation or
 * different-direct-causes→unrelated, or that ignore demonstrated risk.
 */
export function ensureCausalClaimConsistency(
  message: string,
  userMessage: string,
  state?: CanonicalCausalState,
): { message: string; repaired: boolean } {
  const text = String(message || "").trim();
  const ask = String(userMessage || "");
  const causal = state ?? buildCanonicalCausalState(ask);
  if (!text) return { message: text, repaired: false };
  if (!causal.links.length && !causal.roles.length && !causal.demonstratedRiskMechanism) {
    return { message: text, repaired: false };
  }

  let repaired = false;
  let out = text;

  for (const r of causal.roles) {
    if (r.role !== "UNAFFECTED_OBSERVED") continue;
    const esc = r.entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `${esc}\\s+(?:(?:therefore|so|thus)[,:]?\\s+)?(?:played|had|has)\\s+no\\s+(?:causal|operational)?\\s*(?:role|involvement)|${esc}\\s+(?:was|is)\\s+(?:causally\\s+)?(?:irrelevant|uninvolved)`,
      "i",
    );
    if (re.test(out)) {
      repaired = true;
      out = `${out}\n\n**Causal correction:** ${r.entity} remained healthy (observation only). OBSERVED_UNAFFECTED ≠ PROVEN_NO_CAUSAL_ROLE — do not assert causal non-participation without affirmative exclusion evidence.`;
    }
  }

  if (
    /\b(?:not\s+related|unrelated|no\s+causal\s+(?:link|connection)|causally\s+independent)\b/i.test(
      out,
    )
  ) {
    const connectedPairs = causal.links.filter((l) => l.kind === "INDIRECT_CAUSAL_DEPENDENCY");
    if (connectedPairs.length > 0) {
      repaired = true;
      if (!/DIFFERENT_DIRECT_CAUSES|CAUSALLY_UNRELATED|causal path/i.test(out)) {
        out = `${out}\n\n**Causal correction:** DIFFERENT_DIRECT_CAUSES ≠ CAUSALLY_UNRELATED. An indirect causal path may connect events that have different direct causes.`;
      }
    }
  }

  if (
    causal.demonstratedRiskMechanism &&
    /\b(?:continue\s+monitoring|keep\s+monitoring|monitor\s+(?:and\s+)?(?:observe|watch))\b/i.test(
      out,
    ) &&
    !/failover|overload|mitigation\s+blast|demonstrated\s+mechanism/i.test(out)
  ) {
    repaired = true;
    out = `${out}\n\n${synthesizeCausalRiskLesson(causal)}`;
  }

  if (
    causal.recoveryOccurred &&
    causal.residualRiskOpen &&
    /\b(?:risk\s+(?:is\s+)?(?:fully\s+)?(?:cleared|removed|gone)|no\s+(?:remaining|residual)\s+risk)\b/i.test(
      out,
    )
  ) {
    repaired = true;
    out = `${out}\n\n**Causal correction:** RECOVERY ≠ automatic risk removal — the demonstrated mechanism may still be open.`;
  }

  return { message: out.replace(/\n{3,}/g, "\n\n").trim(), repaired };
}
