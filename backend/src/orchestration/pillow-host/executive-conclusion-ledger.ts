/**
 * Answer-local conclusion ledger + claim consistency.
 * Later claim audits must consume earlier verified conclusions — not reverse them.
 * Does not encode sealed examination content.
 */

import {
  buildCanonicalCaseState,
  verdictClaimAgainstCanonical,
  type CanonicalCaseState,
} from "./executive-canonical-state.js";

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

function verdictForClaimAgainstLedger(
  claim: ClaimObligation,
  ledger: LedgerEntry[],
  canonical?: CanonicalCaseState | null,
): { verdict: LedgerVerdict; justification: string } | null {
  // Prefer canonical case state — single derivation of material conclusions.
  if (canonical) {
    const v = verdictClaimAgainstCanonical(claim.sourceText, canonical);
    return { verdict: v.verdict, justification: v.justification };
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
  return m?.[1]?.trim() ?? null;
}

function stripAllClaimBlocks(answer: string): string {
  return String(answer || "")
    .replace(/(?:^|\n)(?:#{1,3}\s*)?Claim\s*\d+\b[\s\S]*?(?=(?:\n(?:#{1,3}\s*)?Claim\s*\d+\b)|$)/gi, "\n")
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
  if (claims.length < 2) {
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
    if (!block) {
      block = synthesizeClaimVerdictBlock(c, ledger, options.domainHint, canonical);
      repaired = true;
    } else if (
      fromLedger?.verdict === "contradicted" &&
      /\*\*Verdict:\*\*\s*(?:Supported|True|SUPP)/i.test(block)
    ) {
      block = synthesizeClaimVerdictBlock(c, ledger, options.domainHint, canonical);
      repaired = true;
    } else if (!/^#{1,3}\s*Claim\s*\d+/im.test(block)) {
      block = `### Claim ${c.index}\n\n${block}`;
      repaired = true;
    }
    orderedBlocks.push(block.trim());
  }

  const body = stripAllClaimBlocks(original);
  const message = `${body}\n\n${orderedBlocks.join("\n\n")}`.replace(/\n{3,}/g, "\n\n").trim();
  if (message !== original) repaired = true;
  return { message, repaired, report: assessClaimEnumeration(message, claims) };
}

export function detectMaterialInternalContradictions(answer: string): string[] {
  const text = String(answer || "");
  const ledger = buildConclusionLedger(text);
  const issues: string[] = [];

  // Supported claim that asserts X=Y while ledger has X=Z or X≠Y
  const claimSupports = [
    ...text.matchAll(/###\s*Claim\s*(\d+)[\s\S]{0,400}?\*\*Verdict:\*\*\s*Supported([\s\S]{0,400}?)(?=###\s*Claim|\n###\s+(?!Claim)|$)/gi),
  ];
  for (const m of claimSupports) {
    const body = m[0]!;
    const idClaim = /\b([A-Z]{1,4}-?\d{1,4})\s+is\s+([A-Z][A-Za-z0-9\s-]{2,60})/i.exec(body);
    if (!idClaim) continue;
    const code = idClaim[1]!;
    const named = idClaim[2]!.trim();
    const pos = ledger.find(
      (e) => e.kind === "entity_identity" && e.id === `entity.${normKey(code)}` && !e.value.startsWith("NOT "),
    );
    if (pos && normKey(pos.value) !== normKey(named) && pos.status === "verified") {
      issues.push(`claim_${m[1]}_supports_${code}=${named}_but_ledger_${code}=${pos.value}`);
    }
  }

  if (FORECAST_NE_REALISED.test(text) && /forecast[\s\S]{0,80}\*\*Verdict:\*\*\s*Supported/i.test(text)) {
    issues.push("forecast_ne_realised_but_forecast_claim_supported");
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
