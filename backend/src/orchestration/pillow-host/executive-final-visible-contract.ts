/**
 * Objective contract validation on the EXACT final user-visible string.
 * Separates reasoning (LLM) from checkable output contracts (deterministic).
 * One implementation for release gate and certification — no dual validators.
 */

import {
  assessClaimCompletenessGate,
  type ClaimObligation,
} from "./executive-conclusion-ledger.js";
import {
  assessSectionContract,
  type SectionContractReport,
} from "./executive-section-contract.js";
import {
  classifyRankingObjective,
  parseCanonicalEvidenceRecords,
  rankByEvidenceStrength,
  sampleOvergeneralizedToPopulation,
} from "./executive-evidence-ranking.js";

export type FinalVisibleContractResult = {
  ok: boolean;
  failures: string[];
  section: SectionContractReport | null;
  claims: {
    expected: number;
    renderedWithVerdict: number;
    withReason: number;
    missingVerdict: number[];
    missingReason: number[];
    duplicateClaimIndexes: number[];
  } | null;
  diagnosticsVisible: number;
  evidenceRankingOk: boolean | null;
  scopeOk: boolean | null;
};

const DIAGNOSTIC_PATTERNS: RegExp[] = [
  /\*{0,2}Section contract:\*{0,2}/i,
  /\b\d+\s+of\s+\d+\s+requested\s+top-level\s+numbered\s+sections\s+are\s+visible\b/i,
  /\bclaim obligation\b/i,
  /\bcoverage failure\b/i,
  /\brecovery state\b/i,
  /\bvalidator result\b/i,
  /\binternal diagnostic\b/i,
  /\bTOP_LEVEL_SECTION_COUNT_MISMATCH\b/,
  /\bEXPLICIT_VERDICT_OMISSION\b/,
  /\bcould not materialise all\b/i,
];

/** Strip internal validator / machinery prose from final visible answer. */
export function stripInternalValidatorDiagnostics(answer: string): string {
  let out = String(answer || "").replace(/\r\n/g, "\n");
  // Whole paragraphs that are machinery diagnostics.
  out = out.replace(
    /(?:^|\n)\s*\*{0,2}Section contract:\*{0,2}[^\n]*(?:\n(?!\s*\d+[.)]\s)(?!#{1,3}\s)[^\n]*)*/gi,
    "\n",
  );
  out = out.replace(
    /(?:^|\n)\s*\d+\s+of\s+\d+\s+requested\s+top-level\s+numbered\s+sections\s+are\s+visible[^\n]*/gi,
    "\n",
  );
  out = out.replace(
    /(?:^|\n)\s*\*{0,2}Causal correction:\*{0,2}[^\n]*/gi,
    "\n",
  );
  out = out.replace(
    /(?:^|\n)[^\n]*(?:claim obligation|coverage failure|recovery state|validator result|internal diagnostic)[^\n]*/gi,
    "\n",
  );
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export function countInternalValidatorDiagnostics(answer: string): number {
  const t = String(answer || "");
  let n = 0;
  for (const re of DIAGNOSTIC_PATTERNS) {
    if (re.test(t)) n += 1;
  }
  return n;
}

function claimBlockForIndex(answer: string, index: number): string | null {
  // Only treat markdown/heading Claim N surfaces as block starts — not prose "Claim N lacks…".
  const m = new RegExp(
    `(?:^|\\n)((?:#{1,3}\\s*)Claim\\s*${index}\\b[\\s\\S]*?)(?=(?:\\n(?:#{1,3}\\s*)Claim\\s*\\d+\\b)|$)`,
    "i",
  ).exec(String(answer || ""));
  return m?.[1] ?? null;
}

function claimHasReason(block: string): boolean {
  // After Verdict line, require some non-empty explanatory prose (not just the verdict label).
  const after = block.split(/\*\*Verdict:\*\*/i)[1] ?? "";
  const cleaned = after
    .replace(/^\s*(?:\*\*)?(?:Supported|Contradicted|Unproven|Unknown|True|False)\b\*{0,2}/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length >= 12;
}

export function assessFinalVisibleClaimContract(
  answer: string,
  claims: ClaimObligation[],
): NonNullable<FinalVisibleContractResult["claims"]> {
  const base = assessClaimCompletenessGate(answer, claims);
  const missingReason: number[] = [];
  let withReason = 0;
  for (const c of claims) {
    const block = claimBlockForIndex(answer, c.index);
    if (block && /\*\*Verdict:\*\*/i.test(block) && claimHasReason(block)) {
      withReason += 1;
    } else if (block && /\*\*Verdict:\*\*/i.test(block)) {
      missingReason.push(c.index);
    }
  }
  // Count duplicate Claim N headings (markdown heading form only).
  const allClaimHeads = [
    ...String(answer || "").matchAll(/(?:^|\n)(?:#{1,3}\s*)Claim\s*(\d+)\b/gi),
  ];
  const counts = new Map<number, number>();
  for (const m of allClaimHeads) {
    const i = Number(m[1]);
    counts.set(i, (counts.get(i) || 0) + 1);
  }
  const duplicateClaimIndexes = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([i]) => i);

  return {
    expected: base.expected,
    renderedWithVerdict: base.renderedWithVerdict,
    withReason,
    missingVerdict: base.missingVerdict,
    missingReason,
    duplicateClaimIndexes,
  };
}

/**
 * Detect value-for-strength: higher measured % mentioned as stronger evidence than
 * higher-coverage / full-population peer.
 */
export function detectValueForStrengthSubstitution(
  answer: string,
  userMessage: string,
): boolean {
  if (classifyRankingObjective(userMessage) !== "EVIDENCE_STRENGTH") return false;
  const records = parseCanonicalEvidenceRecords(userMessage);
  if (records.length < 2) return false;
  const ranked = rankByEvidenceStrength(records);
  const expected = ranked.map((r) => r.subject.toLowerCase());
  const text = String(answer || "").toLowerCase();

  // First-mention order among known subjects must match strength order.
  const mentions = expected
    .map((name) => {
      const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const m = re.exec(text);
      return m ? { name, idx: m.index } : null;
    })
    .filter(Boolean) as { name: string; idx: number }[];
  mentions.sort((a, b) => a.idx - b.idx);
  if (
    mentions.length >= 2 &&
    mentions.some((n, i) => expected.indexOf(n.name) !== i && expected.includes(n.name))
  ) {
    return true;
  }

  // Weaker-coverage higher-% ranked above stronger-coverage peer by %.
  for (let i = 0; i < ranked.length; i++) {
    for (let j = i + 1; j < ranked.length; j++) {
      const stronger = ranked[i]!;
      const weaker = ranked[j]!;
      if (stronger.measuredValue == null || weaker.measuredValue == null) continue;
      if (weaker.measuredValue <= stronger.measuredValue) continue;
      const weakPos = text.indexOf(weaker.subject.toLowerCase());
      const strongPos = text.indexOf(stronger.subject.toLowerCase());
      if (weakPos >= 0 && strongPos >= 0 && weakPos < strongPos) return true;
    }
  }
  return false;
}

/**
 * Assess the exact final visible string against objective contracts.
 */
export function assessFinalVisibleContract(args: {
  answer: string;
  userMessage: string;
  expectedTopLevelSections: number | null;
  sectionTitles?: string[];
  claims: ClaimObligation[];
}): FinalVisibleContractResult {
  const answer = String(args.answer || "");
  const failures: string[] = [];
  const diagnosticsVisible = countInternalValidatorDiagnostics(answer);
  if (diagnosticsVisible > 0) failures.push("INTERNAL_DIAGNOSTIC_LEAK");

  let section: SectionContractReport | null = null;
  if (args.expectedTopLevelSections != null && args.expectedTopLevelSections >= 2) {
    section = assessSectionContract(
      answer,
      args.expectedTopLevelSections,
      args.sectionTitles ?? [],
    );
    if (!section.sequenceOk || section.visible !== args.expectedTopLevelSections) {
      failures.push("TOP_LEVEL_SECTION_COUNT_MISMATCH");
    }
    if (section.nestedPromoted > 0) failures.push("NESTED_ITEM_PROMOTED_TO_TOP_LEVEL");
  }

  let claims: FinalVisibleContractResult["claims"] = null;
  if (args.claims.length >= 1) {
    claims = assessFinalVisibleClaimContract(answer, args.claims);
    if (claims.missingVerdict.length > 0 || claims.renderedWithVerdict !== claims.expected) {
      failures.push("EXPLICIT_VERDICT_OMISSION");
    }
    if (claims.missingReason.length > 0) failures.push("CLAIM_REASON_OMISSION");
    if (claims.duplicateClaimIndexes.length > 0) failures.push("CLAIM_DUPLICATION");
  }

  let evidenceRankingOk: boolean | null = null;
  if (classifyRankingObjective(args.userMessage) === "EVIDENCE_STRENGTH") {
    const bad = detectValueForStrengthSubstitution(answer, args.userMessage);
    evidenceRankingOk = !bad;
    if (bad) failures.push("VALUE_FOR_STRENGTH_SUBSTITUTION");
  }

  let scopeOk: boolean | null = null;
  if (parseCanonicalEvidenceRecords(args.userMessage).some((r) => r.samplingMethod === "SAMPLE" || (r.coverageRatio != null && r.coverageRatio < 1))) {
    const over = sampleOvergeneralizedToPopulation(answer, args.userMessage);
    scopeOk = !over;
    if (over) failures.push("SAMPLE_TO_POPULATION_OVERGENERALIZATION");
  }

  return {
    ok: failures.length === 0,
    failures,
    section,
    claims,
    diagnosticsVisible,
    evidenceRankingOk,
    scopeOk,
  };
}

/** Hard contract failures that must block release (not soft telemetry). */
export const HARD_FINAL_VISIBLE_FAILURES = new Set([
  "INTERNAL_DIAGNOSTIC_LEAK",
  "TOP_LEVEL_SECTION_COUNT_MISMATCH",
  "NESTED_ITEM_PROMOTED_TO_TOP_LEVEL",
  "EXPLICIT_VERDICT_OMISSION",
  "CLAIM_REASON_OMISSION",
  "CLAIM_DUPLICATION",
  "VALUE_FOR_STRENGTH_SUBSTITUTION",
  "SAMPLE_TO_POPULATION_OVERGENERALIZATION",
  "CONSISTENCY_FAILURE",
  "RESOLVED_VERDICT_OVERRIDE_LEFTOVER_SUPPORTED",
]);

export function hasHardFinalVisibleFailure(failures: string[]): boolean {
  return failures.some((f) => HARD_FINAL_VISIBLE_FAILURES.has(f));
}
