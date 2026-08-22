/**
 * Answer-local conclusion ledger + claim consistency.
 * Later claim audits must consume earlier verified conclusions — not reverse them.
 * Does not encode sealed examination content.
 */

import {
  buildCanonicalCaseState,
  type CanonicalCaseState,
} from "./executive-canonical-state.js";
import { assessClaimAgainstCanonical } from "./executive-claim-proposition.js";

export type LedgerVerdict = "supported" | "contradicted" | "unproven" | "unknown";

export type LedgerEntry = {
  id: string;
  kind: "entity_identity" | "forecast_vs_realised" | "event_occurrence" | "generic";
  subject: string;
  value: string;
  status: "verified" | "unproven" | "unknown";
  supportSnippet: string;
};

export type ClaimObligation = {
  id: string; // claim_1 .. claim_N
  index: number;
  sourceText: string;
  subject: string;
};

const ENTITY_EQ =
  /\b([A-Z]{1,4}-?\d{1,4}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s*(?:is|=|equals?|maps?\s+to)\s+([A-Z][A-Za-z0-9\s-]{2,60}?)(?:\.|,|;|\n|$)/g;
const ENTITY_NE =
  /\b([A-Z]{1,4}-?\d{1,4}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s*(?:(?:is|are)\s+not|≠|!=|distinct from|different from)\s+([A-Z][A-Za-z0-9\s-]{2,60}?)(?:\.|,|;|\n|$)/gi;
const ENTITY_DISTINCT =
  /\b([A-Z]{1,4}-?\d{1,4})\b[\s\S]{0,100}?\b(?:distinct|different|not the same|separate entit)\b[\s\S]{0,100}?\b([A-Z][A-Za-z0-9\s-]{2,40}?)\b/gi;
const ENTITY_DISTINCT_AND =
  /\b([A-Z]{1,4}-?\d{1,4})\b\s+and\s+([A-Z][A-Za-z0-9\s-]{2,40}?)\s+are\s+(?:distinct|different|not the same)/gi;
const FORECAST_NE_REALISED =
  /\b(forecast|estimate|expected)\b[\s\S]{0,80}\b(?:not|≠|!=|distinct|different|vs\.?|versus)\b[\s\S]{0,40}\b(realised|realized|actual)\b/i;
const OCCURRED =
  /\b(historically?\s+occurred|physically\s+completed|recorded\s+(?:as\s+)?complete|did\s+occur)\b/i;
const NEVER_OCCURRED =
  /\b(never\s+(?:historically\s+)?occurred|did\s+not\s+(?:historically\s+)?occur|should\s+not\s+be\s+counted\s+as\s+historically)\b/i;

function normKey(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

export function parseClaimObligationsFromContractTasks(
  tasks: Array<{ id: string; text: string; sourceSpan?: string }>,
): ClaimObligation[] {
  const out: ClaimObligation[] = [];
  for (const t of tasks) {
    if (!t.id.startsWith("claim_")) continue;
    const index = Number(t.id.replace("claim_", "")) || out.length + 1;
    const m = /Claim\s+\d+:\s*"([^"]+)"/i.exec(t.text) || /"([^"]{8,})"/i.exec(t.text);
    const sourceText = (m?.[1] || t.sourceSpan || t.text).trim();
    out.push({
      id: t.id,
      index,
      sourceText,
      subject: sourceText.slice(0, 120),
    });
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Extract compact conclusions from an already-written answer body. */
export function buildConclusionLedger(answer: string): LedgerEntry[] {
  // Prefer non-claim body so a wrong claim verdict cannot poison the ledger.
  const text = stripAllClaimBlocks(String(answer || ""));
  const entries: LedgerEntry[] = [];
  const seen = new Set<string>();

  const push = (e: LedgerEntry) => {
    const key = `${e.kind}:${e.id}`;
    if (seen.has(key) && e.kind === "entity_identity" && !e.value.startsWith("NOT ")) return;
    if (seen.has(`${e.kind}:${e.id}:${normKey(e.value)}`)) return;
    seen.add(key);
    seen.add(`${e.kind}:${e.id}:${normKey(e.value)}`);
    entries.push(e);
  };

  let m: RegExpExecArray | null;
  const eq = new RegExp(ENTITY_EQ.source, "g");
  while ((m = eq.exec(text)) !== null) {
    const left = m[1]!.trim();
    const right = m[2]!.trim();
    if (left.length < 2 || right.length < 2) continue;
    push({
      id: `entity.${normKey(left)}`,
      kind: "entity_identity",
      subject: left,
      value: right,
      status: /unproven|unsupported|not (?:the )?same|co-occurr/i.test(text.slice(Math.max(0, m.index - 40), m.index + 80))
        ? "unproven"
        : "verified",
      supportSnippet: m[0]!.slice(0, 160),
    });
  }

  const ne = new RegExp(ENTITY_NE.source, "gi");
  while ((m = ne.exec(text)) !== null) {
    const left = m[1]!.trim();
    const right = m[2]!.trim();
    push({
      id: `entity.${normKey(left)}.not.${normKey(right)}`,
      kind: "entity_identity",
      subject: left,
      value: `NOT ${right}`,
      status: "verified",
      supportSnippet: m[0]!.slice(0, 160),
    });
  }

  const dist = new RegExp(ENTITY_DISTINCT.source, "gi");
  while ((m = dist.exec(text)) !== null) {
    const left = m[1]!.trim();
    const right = m[2]!.trim();
    if (normKey(left) === normKey(right)) continue;
    push({
      id: `entity.${normKey(left)}.not.${normKey(right)}`,
      kind: "entity_identity",
      subject: left,
      value: `NOT ${right}`,
      status: "verified",
      supportSnippet: m[0]!.slice(0, 160),
    });
  }

  const distAnd = new RegExp(ENTITY_DISTINCT_AND.source, "gi");
  while ((m = distAnd.exec(text)) !== null) {
    const left = m[1]!.trim();
    const right = m[2]!.trim();
    if (normKey(left) === normKey(right)) continue;
    push({
      id: `entity.${normKey(left)}.not.${normKey(right)}`,
      kind: "entity_identity",
      subject: left,
      value: `NOT ${right}`,
      status: "verified",
      supportSnippet: m[0]!.slice(0, 160),
    });
  }

  if (FORECAST_NE_REALISED.test(text)) {
    push({
      id: "finance.forecast_ne_realised",
      kind: "forecast_vs_realised",
      subject: "forecast",
      value: "not_realised",
      status: "verified",
      supportSnippet: "forecast ≠ realised",
    });
  }

  if (OCCURRED.test(text) && !NEVER_OCCURRED.test(text)) {
    push({
      id: "event.occurrence",
      kind: "event_occurrence",
      subject: "historical_event",
      value: "occurred",
      status: "verified",
      supportSnippet: "historically occurred",
    });
  }

  return entries;
}

export function claimLocallyRendered(claim: ClaimObligation, answer: string): boolean {
  const text = String(answer || "");
  const idx = claim.index;
  const marker = new RegExp(
    `(?:^|\\n)\\s*(?:#{1,3}\\s*)?Claim\\s*${idx}\\b|(?:^|\\n)\\s*${idx}\\s*[.):\\-]\\s*(?:["“]|Verdict|Supported|Contradict|Unproven|Unknown)`,
    "i",
  ).test(text);
  if (marker) return true;
  const quote = claim.sourceText.slice(0, Math.min(48, claim.sourceText.length));
  if (quote.length >= 12) {
    const qi = text.toLowerCase().indexOf(quote.toLowerCase());
    if (qi >= 0) {
      const window = text.slice(Math.max(0, qi - 80), qi + quote.length + 160);
      if (
        /\b(verdict|supported|contradict|unproven|unsupported|unknown|not established)\b/i.test(
          window,
        ) &&
        new RegExp(`Claim\\s*${idx}\\b`, "i").test(window)
      ) {
        return true;
      }
    }
  }
  return false;
}

export function assessClaimEnumeration(
  answer: string,
  claims: ClaimObligation[],
): { expected: number; rendered: number; missing: number[]; duplicate: number[] } {
  const text = String(answer || "");
  const renderedIdx: number[] = [];
  for (const c of claims) {
    if (claimLocallyRendered(c, text)) renderedIdx.push(c.index);
  }
  const missing = claims.filter((c) => !renderedIdx.includes(c.index)).map((c) => c.index);
  const counts = new Map<number, number>();
  for (const i of renderedIdx) counts.set(i, (counts.get(i) || 0) + 1);
  const duplicate = [...counts.entries()].filter(([, n]) => n > 1).map(([i]) => i);
  return {
    expected: claims.length,
    rendered: renderedIdx.length,
    missing,
    duplicate,
  };
}

function renderedVerdictLabel(block: string): LedgerVerdict | null {
  if (/\*\*Verdict:\*\*\s*(?:\*\*)?(?:Supported|True|SUPP)\b/i.test(block)) return "supported";
  if (/\*\*Verdict:\*\*\s*(?:\*\*)?(?:Contradicted|False|CONT)\b/i.test(block)) return "contradicted";
  if (/\*\*Verdict:\*\*\s*(?:\*\*)?Unknown\b/i.test(block)) return "unknown";
  if (/\*\*Verdict:\*\*\s*(?:\*\*)?(?:Unproven|Not established)/i.test(block)) return "unproven";
  // Non-canonical verdict surfaces (scoped templates, etc.) count as absent.
  if (/\*\*Verdict:\*\*/i.test(block)) return null;
  return null;
}

function verdictForClaimAgainstLedger(
  claim: ClaimObligation,
  ledger: LedgerEntry[],
  canonical?: CanonicalCaseState | null,
): { verdict: LedgerVerdict; justification: string } | null {
  // Prefer canonical compound assessment — every material clause must agree for SUPPORTED.
  // Downstream must not invent an alternative truth when canonical resolves a proposition.
  if (canonical) {
    const v = assessClaimAgainstCanonical(claim.sourceText, canonical);
    if (v.overall !== "unproven" || v.components.length > 0) {
      // Even unproven from compound assess is authoritative when material props were mapped.
      if (v.components.some((c) => c.proposition.kind !== "generic") || v.overall !== "unproven") {
        return { verdict: v.overall, justification: v.justification };
      }
    }
  }

  const t = claim.sourceText;

  // Identity equality claim: "HT-88 is Harbour Crown Hotel"
  const idClaim = /\b([A-Z]{1,4}-?\d{1,4})\s+is\s+([A-Z][A-Za-z0-9\s-]{2,60})/i.exec(t);
  if (idClaim) {
    const code = idClaim[1]!;
    const named = idClaim[2]!.trim();
    const pos = ledger.find(
      (e) => e.kind === "entity_identity" && e.id === `entity.${normKey(code)}` && !e.value.startsWith("NOT "),
    );
    const neg = ledger.find(
      (e) =>
        e.kind === "entity_identity" &&
        e.id === `entity.${normKey(code)}.not.${normKey(named)}`,
    );
    if (neg || (pos && normKey(pos.value) !== normKey(named) && pos.status === "verified")) {
      return {
        verdict: "contradicted",
        justification: pos
          ? `Earlier verified conclusion: ${code} = ${pos.value}; this claim asserts ${code} = ${named}.`
          : `Earlier verified conclusion: ${code} is distinct from ${named}.`,
      };
    }
    if (pos && normKey(pos.value) === normKey(named) && pos.status === "verified") {
      return {
        verdict: "supported",
        justification: `Consistent with earlier verified conclusion: ${code} = ${pos.value}.`,
      };
    }
  }

  // Forecast-as-realised claim
  if (/\b(forecast|expected|estimate).{0,40}(is|equals|=|reaches).{0,20}(realised|realized|actual)/i.test(t) ||
      /\brealised revenue reaches\b/i.test(t) && /\bforecast\b/i.test(t)) {
    const fin = ledger.find((e) => e.id === "finance.forecast_ne_realised");
    if (fin) {
      return {
        verdict: "contradicted",
        justification: "Earlier analysis established forecast ≠ realised; this claim treats them as equivalent.",
      };
    }
  }

  // Occurrence denial after occurrence established
  if (
    NEVER_OCCURRED.test(t) ||
    /did not (?:historically )?occur/i.test(t) ||
    /never historically occurred/i.test(t)
  ) {
    const occ = ledger.find((e) => e.id === "event.occurrence");
    if (occ) {
      return {
        verdict: "contradicted",
        justification:
          "Earlier analysis established historical occurrence; a later refund alone does not erase that occurrence.",
      };
    }
  }

  return null;
}

export function synthesizeClaimVerdictBlock(
  claim: ClaimObligation,
  ledger: LedgerEntry[],
  domainHint?: string,
  canonical?: CanonicalCaseState | null,
): string {
  const fromLedger = verdictForClaimAgainstLedger(claim, ledger, canonical);
  const verdict = fromLedger?.verdict ?? "unproven";
  const justification =
    fromLedger?.justification ??
    (domainHint
      ? `Not established from the supplied ${domainHint} scenario evidence alone.`
      : "Not established from the supplied scenario evidence alone.");
  const label =
    verdict === "supported"
      ? "Supported"
      : verdict === "contradicted"
        ? "Contradicted"
        : verdict === "unknown"
          ? "Unknown"
          : "Unproven / not established";
  return [
    `### Claim ${claim.index}`,
    `**Verdict:** ${label}`,
    "",
    `"${claim.sourceText}"`,
    "",
    justification,
  ].join("\n");
}

function extractClaimBlock(answer: string, index: number): string | null {
  const claimBlock = new RegExp(
    `(?:^|\\n)((?:#{1,3}\\s*)?Claim\\s*${index}\\b[\\s\\S]*?)(?=(?:\\n(?:#{1,3}\\s*)?Claim\\s*\\d+\\b)|$)`,
    "i",
  );
  const m = claimBlock.exec(answer);
  if (m?.[1]) return m[1].trim();

  // Alternate Grand King surface: "1. **Claim:** ..." / "2. Claim: ..."
  const alt = new RegExp(
    `(?:^|\\n)(\\s*${index}\\.\\s*\\*?\\*?Claim:?\\*?\\*?[\\s\\S]*?)(?=(?:\\n\\s*\\d{1,2}\\.\\s*\\*?\\*?Claim:?\\*?\\*?)|(?:\\n#{1,3}\\s)|$)`,
    "i",
  );
  const a = alt.exec(answer);
  if (a?.[1]) return a[1].trim();

  // Numbered bold proposition: "1. **quoted or bare claim text**" + Verdict
  const boldProp = new RegExp(
    `(?:^|\\n)(\\s*${index}\\.\\s*\\*\\*[^*\\n]{8,500}\\*\\*[\\s\\S]*?)(?=(?:\\n\\s*\\d{1,2}\\.\\s*\\*\\*)|(?:\\n#{1,3}\\s)|$)`,
    "i",
  );
  const b = boldProp.exec(answer);
  return b?.[1]?.trim() ?? null;
}

/** Recover claim obligations from already-rendered Claim N blocks (when contract missed them). */
export function parseClaimObligationsFromAnswer(answer: string): ClaimObligation[] {
  const text = String(answer || "");
  const indexes = [
    ...new Set(
      [
        ...text.matchAll(/(?:^|\n)(?:#{1,3}\s*)?Claim\s*(\d+)\b/gi),
        ...text.matchAll(/(?:^|\n)\s*(\d{1,2})\.\s*\*{0,2}Claim:?\*{0,2}/gi),
      ].map((m) => Number(m[1])),
    ),
  ].sort((a, b) => a - b);
  const out: ClaimObligation[] = [];
  for (const index of indexes) {
    const block = extractClaimBlock(text, index);
    if (!block) continue;
    const quoted =
      /[“"']([^”"']{8,500})[”"']/.exec(block)?.[1]?.trim() ||
      block
        .replace(/^[\s\S]*?\*\*Verdict:\*\*[^\n]*\n+/i, "")
        .replace(/\*\*Verdict:\*\*[^\n]*/i, "")
        .replace(/^\s*\d+\.\s*\*{0,2}Claim:?\*{0,2}\s*/i, "")
        .trim()
        .split(/\n\n/)[0]
        ?.replace(/^["']|["']$/g, "")
        .trim();
    if (!quoted || quoted.length < 8) continue;
    out.push({
      id: `claim_${index}`,
      index,
      sourceText: quoted,
      subject: quoted.slice(0, 120),
    });
  }
  return out;
}

function stripAllClaimBlocks(answer: string): string {
  return String(answer || "")
    .replace(/(?:^|\n)(?:#{1,3}\s*)?Claim\s*\d+\b[\s\S]*?(?=(?:\n(?:#{1,3}\s*)?Claim\s*\d+\b)|$)/gi, "\n")
    .replace(
      /(?:^|\n)\s*\d{1,2}\.\s*\*{0,2}Claim:?\*{0,2}[\s\S]*?(?=(?:\n\s*\d{1,2}\.\s*\*{0,2}Claim:?\*{0,2})|(?:\n#{1,3}\s)|$)/gi,
      "\n",
    )
    // Numbered bold proposition + verdict surfaces (LLM often omits the word "Claim")
    .replace(
      /(?:^|\n)\s*\d{1,2}\.\s*\*\*[^*\n]{8,500}\*\*\s*(?:\n\s*[-–—]\s*)?\n+\s*\*\*Verdict:\*\*[\s\S]*?(?=(?:\n\s*\d{1,2}\.\s*\*\*)|(?:\n#{1,3}\s)|$)/gi,
      "\n",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Ensure Claim 1..N appear in original order. Verdicts prefer canonical case state.
 * Later claim audits that reverse earlier verified conclusions are rewritten.
 */
export function enforceClaimEnumeration(
  answer: string,
  claims: ClaimObligation[],
  options: { domainHint?: string; userMessage?: string; canonical?: CanonicalCaseState | null } = {},
): { message: string; repaired: boolean; report: ReturnType<typeof assessClaimEnumeration> } {
  if (claims.length < 1) {
    return {
      message: String(answer || "").trim(),
      repaired: false,
      report: { expected: 0, rendered: 0, missing: [], duplicate: [] },
    };
  }
  const original = String(answer || "").trim();
  const ledger = buildConclusionLedger(original);
  const canonical =
    options.canonical ??
    (options.userMessage ? buildCanonicalCaseState(options.userMessage) : null);
  let repaired = false;

  const orderedBlocks: string[] = [];
  for (const c of claims) {
    let block = extractClaimBlock(original, c.index);
    const fromLedger = verdictForClaimAgainstLedger(c, ledger, canonical);
    // Canonical/ledger mapping is authoritative: always render claim slices from it.
    // Downstream may not keep an LLM surface that silently reverses established propositions.
    const mustRegen = !block || fromLedger != null;
    if (mustRegen) {
      block = synthesizeClaimVerdictBlock(c, ledger, options.domainHint, canonical);
      repaired = true;
    } else if (block && !/^#{1,3}\s*Claim\s*\d+/im.test(block)) {
      block = `### Claim ${c.index}\n\n${block}`;
      repaired = true;
    }
    orderedBlocks.push(block!.trim());
  }

  const body = stripAllClaimBlocks(original);
  const message = `${body}\n\n${orderedBlocks.join("\n\n")}`.replace(/\n{3,}/g, "\n\n").trim();
  if (message !== original) repaired = true;
  return { message, repaired, report: assessClaimEnumeration(message, claims) };
}

export function detectMaterialInternalContradictions(
  answer: string,
  options: { userMessage?: string; canonical?: CanonicalCaseState | null } = {},
): string[] {
  const text = String(answer || "");
  const ledger = buildConclusionLedger(text);
  const issues: string[] = [];
  const canonical =
    options.canonical ??
    (options.userMessage ? buildCanonicalCaseState(options.userMessage) : null);

  // Per-claim blocks only — never let Claim N's Supported bleed into Claim M's match.
  const claimIndexes = [
    ...new Set(
      [...text.matchAll(/(?:^|\n)(?:#{1,3}\s*)?Claim\s*(\d+)\b/gi)].map((m) => Number(m[1])),
    ),
  ];
  for (const idx of claimIndexes) {
    const block = extractClaimBlock(text, idx);
    if (!block) continue;
    const rendered = renderedVerdictLabel(block);
    const quoted =
      /"([^"]{8,400})"/.exec(block)?.[1] ||
      /(?:Claim\s+\d+[^\n]*\n+\*\*Verdict:\*\*[^\n]*\n+\n)"?([^"\n]{8,400})/.exec(block)?.[1];

    if (canonical && quoted && rendered) {
      const assessed = assessClaimAgainstCanonical(quoted, canonical);
      if (assessed.overall !== rendered && assessed.overall !== "unproven") {
        issues.push(
          `claim_${idx}_verdict_${rendered}_but_canonical_${assessed.overall}`,
        );
      }
      if (
        rendered === "supported" &&
        assessed.truePremiseFalseConclusion
      ) {
        issues.push(`claim_${idx}_compound_true_premise_false_conclusion_marked_supported`);
      }
    }

    if (!rendered || rendered !== "supported") continue;
    const idClaim = /\b([A-Z]{1,4}-?\d{1,4})\s+is\s+([A-Z][A-Za-z0-9\s-]{2,60})/i.exec(block);
    if (idClaim) {
      const code = idClaim[1]!;
      const named = idClaim[2]!.trim();
      const pos = ledger.find(
        (e) =>
          e.kind === "entity_identity" &&
          e.id === `entity.${normKey(code)}` &&
          !e.value.startsWith("NOT "),
      );
      if (pos && normKey(pos.value) !== normKey(named) && pos.status === "verified") {
        issues.push(`claim_${idx}_supports_${code}=${named}_but_ledger_${code}=${pos.value}`);
      }
    }
    if (
      /\b(forecast|expected|estimate).{0,40}(is|equals|=|reaches).{0,20}(realised|realized|actual)|forecast equals realised/i.test(
        block,
      ) &&
      ledger.some((e) => e.id === "finance.forecast_ne_realised")
    ) {
      issues.push(`claim_${idx}_supports_forecast_eq_realised_but_ledger_ne`);
    }
    if (
      rendered === "supported" &&
      /\bunrelated|not\s+related|causally\s+independent\b/i.test(block) &&
      canonical?.causal.links.some((l) => l.kind === "INDIRECT_CAUSAL_DEPENDENCY")
    ) {
      issues.push(`claim_${idx}_supports_unrelated_but_canonical_path_exists`);
    }
  }

  if (OCCURRED.test(text) && NEVER_OCCURRED.test(text)) {
    // Quoting a denial claim while affirming occurrence is not a contradiction —
    // only flag when both appear outside claim blocks, excluding preservation notes.
    const body = stripAllClaimBlocks(text)
      .replace(/does not by itself[^.]*\./gi, "")
      .replace(/not by itself (?:mean|prove|erase)[^.]*\./gi, "");
    if (OCCURRED.test(body) && NEVER_OCCURRED.test(body)) {
      issues.push("occurrence_both_affirmed_and_denied");
    }
  }

  return issues;
}
