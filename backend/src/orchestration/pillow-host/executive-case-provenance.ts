/**
 * Case evidence provenance — bounded-case fact isolation.
 * Principles may transfer across cases; specimen facts may not.
 * Does not encode sealed examination content.
 */

import { hasSyntheticAnalysisMarker, detectReasoningScope } from "./executive-scoped-reasoning.js";

export type CaseMode =
  | "NEW_BOUNDED_CASE"
  | "CONTINUATION_OF_EXISTING_CASE"
  | "EXPLICIT_CROSS_CASE_COMPARISON"
  | "LIVE_EMPIREAI_REQUEST"
  | "GENERAL_REASONING_REQUEST";

export type ProvenanceFactKind = "FACT" | "PRINCIPLE";

export type CaseFingerprint = {
  caseId: string;
  entities: string[];
  timestamps: string[];
  numbers: string[];
  mechanisms: string[];
  domainTokens: string[];
};

export type CaseProvenanceTelemetry = {
  CASE_ID: string;
  CASE_MODE: CaseMode;
  CURRENT_CASE_FACT_COUNT: number;
  HISTORY_FACT_COUNT: number;
  HISTORY_PRINCIPLE_COUNT: number;
  EKLS_PRINCIPLE_COUNT: number;
  FOREIGN_CASE_FACTS_REJECTED: number;
  VISIBLE_ASSERTIONS_CHECKED: number;
  UNSUPPORTED_CURRENT_CASE_ASSERTIONS: number;
  FOREIGN_CASE_ENTITY_LEAK: number;
  FOREIGN_CASE_EVENT_LEAK: number;
  FOREIGN_CASE_DOMAIN_SUBSTITUTION: number;
};

const MECHANISM_TOKENS =
  /\b(?:power[- ]?(?:control\s+)?module|power[- ]?board|memory\s+exhaustion|memory\s+cleared|packing[- ]?capacity|cluster(?:s)?|software\s+deployment|failover|seal\s+failure|thermal\s+failure|stockout|buy[- ]?box|contribution\s+margin)\b/gi;

const TIMESTAMP_TOKENS =
  /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b|\b\d{1,2}:\d{2}\b|\b0?\d:\d{2}\b/gi;

const ENTITY_TOKEN = /\b([A-Z][A-Za-z0-9_-]{2,40})(?:\s+[A-Z][A-Za-z0-9_-]{2,40}){0,2}\b/g;

/** Never treat these as case specimen entities (firewall must not scrub prose). */
const ENTITY_STOPWORDS = new Set(
  [
    "The",
    "This",
    "That",
    "These",
    "Those",
    "Then",
    "Than",
    "When",
    "Where",
    "What",
    "Which",
    "While",
    "With",
    "From",
    "Into",
    "Onto",
    "Over",
    "Under",
    "After",
    "Before",
    "During",
    "Following",
    "Because",
    "However",
    "Therefore",
    "Thus",
    "Also",
    "Only",
    "Once",
    "Each",
    "Both",
    "Some",
    "Any",
    "All",
    "None",
    "Other",
    "Another",
    "Same",
    "New",
    "Next",
    "Prior",
    "Previous",
    "Current",
    "Answer",
    "Audit",
    "Assess",
    "Claim",
    "Claims",
    "Verdict",
    "Section",
    "Sections",
    "Snapshot",
    "Mechanism",
    "Closing",
    "Causes",
    "Cause",
    "Path",
    "Direct",
    "Indirect",
    "Comparison",
    "Lesson",
    "Lessons",
    "Risk",
    "Recommendation",
    "Supported",
    "Unsupported",
    "Contradicted",
    "Unproven",
    "Unknown",
    "True",
    "False",
    "Need",
    "What",
    "My",
    "Our",
    "Your",
    "Their",
    "Its",
    "And",
    "But",
    "For",
    "Not",
    "Yes",
    "No",
    "Do",
    "Does",
    "Did",
    "Is",
    "Are",
    "Was",
    "Were",
    "Be",
    "Been",
    "Being",
    "Have",
    "Has",
    "Had",
    "Can",
    "Could",
    "Would",
    "Should",
    "May",
    "Might",
    "Must",
    "Will",
    "Shall",
    "At",
    "By",
    "On",
    "In",
    "Of",
    "To",
    "As",
    "Or",
    "If",
    "It",
    "An",
    "A",
    "Synthetic",
    "FailureA",
    "PeerNode",
    "UpstreamFailure",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
    "Memory",
    "Clusters",
    "Cluster",
    "Module",
    "System",
    "Systems",
    "Orders",
    "Order",
    "Workload",
    "Work",
    "Traffic",
    "Capacity",
    "Shortage",
    "Exhaustion",
    "Overload",
    "Failure",
    "Incident",
    "Outage",
    "Healthy",
    "Restored",
    "Cleared",
    "Deployment",
    "Software",
    "Warehouse",
    "Printer",
    "Packing",
  ].map((w) => w.toLowerCase()),
);

function isDistinctiveCaseEntity(raw: string): boolean {
  const e = String(raw || "").trim();
  if (!e || e.length < 4) return false;
  if (ENTITY_STOPWORDS.has(e.toLowerCase())) return false;
  if (/^Synthetic/i.test(e)) return false;
  if (
    /^(?:Claim|Verdict|Section|Snapshot|Audit|Answer|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|FailureA|PeerNode|UpstreamFailure)$/i.test(
      e,
    )
  ) {
    return false;
  }
  // Prefer proper-noun / compound tokens (NorthHub, Cobalt, power-board-ish names).
  if (/^[A-Z][a-z]+(?:[A-Z][a-z]+)+$/.test(e)) return true; // CamelCase compound
  if (/^[A-Z][a-z]{3,}$/.test(e)) return true; // Title case length>=4
  if (/^[A-Z]{2,}[a-z]/.test(e)) return true;
  if (/[_-]/.test(e) && e.length >= 5) return true;
  return false;
}

const PRINCIPLE_MARKERS =
  /\b(?:different\s+direct\s+causes|indirect(?:ly)?\s+connected|path\s+exists|DIRECT\s*[≠!=]+\s*INDIRECT|CAUSALLY_CONNECTED|common\s+root|principle|lesson\s*:|general(?:ized)?\s+rule)\b/i;

function key(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function uniq(xs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const k = key(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

/** Stable short id from distinctive case tokens (not sealed exam names). */
export function deriveCaseId(userMessage: string): string {
  const fp = extractCaseFingerprint(userMessage, "current");
  const seed = [...fp.entities.slice(0, 3), ...fp.mechanisms.slice(0, 2), ...fp.numbers.slice(0, 2)]
    .map((t) => key(t))
    .filter(Boolean)
    .join("_");
  return seed ? `case_${seed.slice(0, 48)}` : `case_${key(userMessage).slice(0, 24) || "anon"}`;
}

export function extractCaseFingerprint(text: string, caseId: string): CaseFingerprint {
  const t = String(text || "");
  const entities: string[] = [];
  let m: RegExpExecArray | null;
  const entRe = new RegExp(ENTITY_TOKEN.source, "g");
  while ((m = entRe.exec(t)) !== null) {
    const full = String(m[0] || "").trim();
    const e = m[1]!;
    // Prefer multi-token spans when captured; otherwise single distinctive token.
    if (full.includes(" ") && isDistinctiveCaseEntity(full.split(/\s+/)[0]!)) {
      entities.push(full);
      continue;
    }
    if (!isDistinctiveCaseEntity(e)) continue;
    entities.push(e);
  }
  const timestamps = uniq([...(t.match(TIMESTAMP_TOKENS) || [])]);
  const numbers = uniq([...(t.match(/\b\d{2,7}\b/g) || [])]);
  const mechanisms = uniq([...(t.match(MECHANISM_TOKENS) || [])]).filter((mech) => {
    // Prefer multi-word / hyphenated mechanisms; drop bare "clusters" noise.
    const m = String(mech || "").toLowerCase();
    if (m === "cluster" || m === "clusters") return false;
    return m.length >= 5;
  });
  const domainTokens = uniq([
    ...((t.match(
      /\b(?:warehouse|cluster|printer|packing|logistics|hospitality|retail|marketplace|supplier|listing|inventory|shipping)\b/gi,
    ) || []) as string[]),
  ]);
  return {
    caseId,
    entities: uniq(entities).slice(0, 40),
    timestamps,
    numbers: numbers.slice(0, 24),
    mechanisms: mechanisms.slice(0, 24),
    domainTokens: domainTokens.slice(0, 16),
  };
}

export function classifyCaseMode(
  userMessage: string,
  priorUserMessages: readonly string[] = [],
): CaseMode {
  const t = String(userMessage || "");
  if (
    /\b(?:compare|versus|\bvs\.?\b|contrast)\b/i.test(t) &&
    /\b(?:previous|prior|earlier|last|case\s*[ab]|scenario\s*[ab]|bluehaven|that\s+case)\b/i.test(t)
  ) {
    return "EXPLICIT_CROSS_CASE_COMPARISON";
  }
  if (
    /\b(?:continue|reconsider|same\s+case|in\s+that\s+case|for\s+this\s+same\s+scenario|now\s+if\b|what\s+if\b.{0,40}\b(?:capacity|rises|instead))\b/i.test(
      t,
    ) &&
    priorUserMessages.length > 0
  ) {
    return "CONTINUATION_OF_EXISTING_CASE";
  }
  if (hasSyntheticAnalysisMarker(t) || detectReasoningScope(t) === "SYNTHETIC_ANALYSIS") {
    // New synthetic pack after any prior turn → new bounded case unless continuation cues.
    return "NEW_BOUNDED_CASE";
  }
  if (
    /\b(?:EmpireAI|our\s+(?:live|current)\s+(?:product|orders?|revenue)|Mini\s*Fan|Birth\s+gate)\b/i.test(
      t,
    ) &&
    !hasSyntheticAnalysisMarker(t)
  ) {
    return "LIVE_EMPIREAI_REQUEST";
  }
  if (priorUserMessages.length === 0) return "GENERAL_REASONING_REQUEST";
  return "GENERAL_REASONING_REQUEST";
}

function isPrincipleOnlyText(text: string): boolean {
  return PRINCIPLE_MARKERS.test(text) && !(TIMESTAMP_TOKENS.test(text) && MECHANISM_TOKENS.test(text));
}

/**
 * For NEW_BOUNDED_CASE: keep prior turns for continuity but strip specimen facts.
 * Principles and live EmpireAI operational continuity cues may remain lightly.
 */
export function filterPriorTurnsForCaseProvenance(
  priorTurns: ReadonlyArray<{ role: string; content: string }>,
  currentMessage: string,
  mode: CaseMode,
): {
  turns: Array<{ role: string; content: string }>;
  telemetry: Partial<CaseProvenanceTelemetry>;
  priorFingerprints: CaseFingerprint[];
} {
  const currentId = deriveCaseId(currentMessage);
  const currentFp = extractCaseFingerprint(currentMessage, currentId);
  const priorFingerprints: CaseFingerprint[] = [];
  let historyFacts = 0;
  let historyPrinciples = 0;
  let rejected = 0;

  if (mode !== "NEW_BOUNDED_CASE") {
    return {
      turns: priorTurns.map((t) => ({ role: t.role, content: t.content })),
      telemetry: {
        CASE_ID: currentId,
        CASE_MODE: mode,
        CURRENT_CASE_FACT_COUNT:
          currentFp.entities.length + currentFp.timestamps.length + currentFp.mechanisms.length,
        HISTORY_FACT_COUNT: 0,
        HISTORY_PRINCIPLE_COUNT: 0,
        FOREIGN_CASE_FACTS_REJECTED: 0,
      },
      priorFingerprints,
    };
  }

  const out: Array<{ role: string; content: string }> = [];
  for (let i = 0; i < priorTurns.length; i++) {
    const turn = priorTurns[i]!;
    const content = String(turn.content || "");
    const fp = extractCaseFingerprint(content, `prior_${i}`);
    priorFingerprints.push(fp);
    const foreignEntities = fp.entities.filter(
      (e) => !currentFp.entities.some((c) => key(c) === key(e)),
    );
    const foreignMech = fp.mechanisms.filter(
      (e) => !currentFp.mechanisms.some((c) => key(c) === key(e)),
    );
    const foreignTs = fp.timestamps.filter(
      (e) => !currentFp.timestamps.some((c) => key(c) === key(e)),
    );
    const foreignFacts =
      foreignEntities.length + foreignMech.length + foreignTs.length + (fp.numbers.length > 0 ? 1 : 0);
    if (foreignFacts > 0 && (hasSyntheticAnalysisMarker(content) || turn.role === "assistant")) {
      historyFacts += foreignFacts;
      rejected += foreignFacts;
      if (isPrincipleOnlyText(content)) {
        historyPrinciples += 1;
        out.push({
          role: turn.role,
          content:
            "[Prior bounded-case principle retained; specimen facts not admissible in current case.]",
        });
      } else {
        out.push({
          role: turn.role,
          content:
            turn.role === "user"
              ? "[Prior bounded case request — facts redacted for current-case isolation.]"
              : "[Prior bounded-case answer — principles only; foreign specimen facts redacted.]",
        });
      }
    } else {
      out.push({ role: turn.role, content });
    }
  }

  return {
    turns: out,
    telemetry: {
      CASE_ID: currentId,
      CASE_MODE: mode,
      CURRENT_CASE_FACT_COUNT:
        currentFp.entities.length + currentFp.timestamps.length + currentFp.mechanisms.length,
      HISTORY_FACT_COUNT: historyFacts,
      HISTORY_PRINCIPLE_COUNT: historyPrinciples,
      FOREIGN_CASE_FACTS_REJECTED: rejected,
    },
    priorFingerprints,
  };
}

export type ForeignLeakReport = {
  ok: boolean;
  FOREIGN_CASE_ENTITY_LEAK: number;
  FOREIGN_CASE_EVENT_LEAK: number;
  FOREIGN_CASE_DOMAIN_SUBSTITUTION: number;
  leaks: string[];
  cleaned: string;
};

/**
 * Strip / flag foreign specimen facts from a visible answer under NEW_BOUNDED_CASE.
 */
export function enforceCurrentCaseFactFirewall(
  answer: string,
  currentMessage: string,
  priorFingerprints: readonly CaseFingerprint[],
  mode: CaseMode,
): ForeignLeakReport {
  if (mode !== "NEW_BOUNDED_CASE" && mode !== "GENERAL_REASONING_REQUEST") {
    return {
      ok: true,
      FOREIGN_CASE_ENTITY_LEAK: 0,
      FOREIGN_CASE_EVENT_LEAK: 0,
      FOREIGN_CASE_DOMAIN_SUBSTITUTION: 0,
      leaks: [],
      cleaned: String(answer || ""),
    };
  }
  const current = extractCaseFingerprint(currentMessage, "current");
  const currentKeys = new Set([
    ...current.entities.map(key),
    ...current.mechanisms.map(key),
    ...current.timestamps.map(key),
    ...current.numbers.map(key),
  ]);
  let cleaned = String(answer || "");
  const leaks: string[] = [];
  let entityLeak = 0;
  let eventLeak = 0;
  let domainSub = 0;

  for (const fp of priorFingerprints) {
    for (const ent of fp.entities) {
      if (currentKeys.has(key(ent))) continue;
      if (!isDistinctiveCaseEntity(ent.split(/\s+/)[0]!) && !isDistinctiveCaseEntity(ent)) continue;
      // Case-sensitive-ish: require capitalised specimen token so prose "the" never matches.
      const re = new RegExp(`\\b${ent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
      if (re.test(cleaned)) {
        entityLeak += 1;
        leaks.push(`entity:${ent}`);
        cleaned = cleaned.replace(re, "");
      }
    }
    for (const ts of fp.timestamps) {
      if (currentKeys.has(key(ts))) continue;
      const re = new RegExp(ts.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      if (re.test(cleaned)) {
        eventLeak += 1;
        leaks.push(`timestamp:${ts}`);
        cleaned = cleaned.replace(re, "");
      }
    }
    for (const mech of fp.mechanisms) {
      if (currentKeys.has(key(mech))) continue;
      // Domain substitution: prior mech appears while current uses a different mech family.
      const re = new RegExp(mech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      if (re.test(cleaned) && current.mechanisms.length > 0) {
        domainSub += 1;
        leaks.push(`mechanism:${mech}`);
        cleaned = cleaned.replace(re, "");
      }
    }
  }

  return {
    ok: entityLeak + eventLeak + domainSub === 0,
    FOREIGN_CASE_ENTITY_LEAK: entityLeak,
    FOREIGN_CASE_EVENT_LEAK: eventLeak,
    FOREIGN_CASE_DOMAIN_SUBSTITUTION: domainSub,
    leaks,
    cleaned: cleaned
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  };
}

export function emptyProvenanceTelemetry(caseId = "case_anon"): CaseProvenanceTelemetry {
  return {
    CASE_ID: caseId,
    CASE_MODE: "GENERAL_REASONING_REQUEST",
    CURRENT_CASE_FACT_COUNT: 0,
    HISTORY_FACT_COUNT: 0,
    HISTORY_PRINCIPLE_COUNT: 0,
    EKLS_PRINCIPLE_COUNT: 0,
    FOREIGN_CASE_FACTS_REJECTED: 0,
    VISIBLE_ASSERTIONS_CHECKED: 0,
    UNSUPPORTED_CURRENT_CASE_ASSERTIONS: 0,
    FOREIGN_CASE_ENTITY_LEAK: 0,
    FOREIGN_CASE_EVENT_LEAK: 0,
    FOREIGN_CASE_DOMAIN_SUBSTITUTION: 0,
  };
}
