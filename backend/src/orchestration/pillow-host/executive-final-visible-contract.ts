/**
 * Objective contract validation on the EXACT final user-visible string.
 * Separates reasoning (LLM) from checkable output contracts (deterministic).
 * One implementation for release gate and certification — no dual validators.
 */

import {
  assessClaimCompletenessGate,
  parseClaimObligationsFromAnswer,
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
import { extractQuotedClaimsOnly } from "./executive-canonical-state.js";

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
  /** Transport-boundary provenance (objective counts only). */
  provenance: TransportContractProvenance;
};

export type TransportContractProvenance = {
  expectedClaims: number;
  expectedVerdicts: number;
  finalTransportClaimCount: number;
  finalTransportVerdictCount: number;
  validatorRan: boolean;
  validatorResult: "PASS" | "FAIL";
  validatorFailureReasons: string[];
  releaseAuthorized: boolean;
};

/**
 * Resolve claim obligations for the FINAL string.
 * Prefer contract obligations; fall back to visible Claim N surfaces and user quotes.
 * Prevents claims=[] blind spot when the answer itself presents Claim 1..N.
 */
export function resolveTransportClaimObligations(args: {
  userMessage: string;
  answer: string;
  contractClaims?: ClaimObligation[];
}): ClaimObligation[] {
  const fromContract = args.contractClaims ?? [];
  if (fromContract.length >= 1) return fromContract;

  const fromAnswer = parseClaimObligationsFromAnswer(args.answer).filter((c) => {
    const t = String(c.sourceText || "").trim();
    // Reject section titles misread as claims ("Claim audit").
    if (/^audit\b/i.test(t)) return false;
    if (t.length < 8) return false;
    return true;
  });
  if (fromAnswer.length >= 1) return fromAnswer;

  const quotes = extractQuotedClaimsOnly(args.userMessage);
  if (quotes.length >= 1) {
    return quotes.map((q, i) => ({
      id: `claim_${i + 1}`,
      index: i + 1,
      sourceText: q,
      subject: q.slice(0, 120),
    }));
  }
  return [];
}

/** Count Claim N heading surfaces and explicit **Verdict:** lines in claim blocks. */
export function countFinalTransportClaimVerdicts(answer: string): {
  claimCount: number;
  verdictCount: number;
} {
  const text = String(answer || "");
  // Only true claim audit surfaces — not "4. Claim audit" section titles.
  const heads = [
    ...text.matchAll(/(?:^|\n)(?:#{1,3}\s*)Claim\s*(\d+)\b(?!\s+audit\b)/gi),
    ...text.matchAll(/(?:^|\n)Claim\s*(\d+)\s*[:.—-]/gi),
  ].map((m) => Number(m[1]));
  const uniq = [...new Set(heads)].sort((a, b) => a - b);
  let contiguous = 0;
  for (let i = 1; i <= 30; i++) {
    if (uniq.includes(i)) contiguous = i;
    else break;
  }
  const expected = contiguous > 0 ? contiguous : uniq.length;
  let verdictCount = 0;
  for (let i = 1; i <= expected; i++) {
    const block = claimBlockForIndex(text, i);
    if (block && /\*\*Verdict:\*\*/i.test(block)) verdictCount += 1;
  }
  if (expected < 1) {
    const numbered = [
      ...text.matchAll(
        /(?:^|\n)\s*(\d{1,2})\.\s*["“][^"”\n]{8,500}["”][\s\S]{0,240}?\*\*Verdict:\*\*/gi,
      ),
    ];
    const orphans = [
      ...text.matchAll(/(?:^|\n)\s*(\d{1,2})\.\s*["“][^"”\n]{8,500}["”]/gi),
    ];
    if (orphans.length >= 1) {
      return {
        claimCount: orphans.length,
        verdictCount: numbered.length,
      };
    }
  }
  return { claimCount: expected, verdictCount };
}


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
  // Heading Claim N with or without markdown ### — not prose "Claim N lacks…".
  const m = new RegExp(
    `(?:^|\\n)((?:#{1,3}\\s*)?Claim\\s*${index}\\b[\\s\\S]*?)(?=(?:\\n(?:#{1,3}\\s*)?Claim\\s*\\d+\\b)|$)`,
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
  // Count duplicate Claim N headings (with or without ###).
  const allClaimHeads = [
    ...String(answer || "").matchAll(/(?:^|\n)(?:#{1,3}\s*)?Claim\s*(\d+)\b/gi),
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
 * Always resolves claim obligations from contract OR final-surface OR user quotes
 * so claims=[] cannot blind the verdict gate (Valence-class break).
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

  const resolvedClaims = resolveTransportClaimObligations({
    userMessage: args.userMessage,
    answer,
    contractClaims: args.claims,
  });

  let claims: FinalVisibleContractResult["claims"] = null;
  if (resolvedClaims.length >= 1) {
    claims = assessFinalVisibleClaimContract(answer, resolvedClaims);
    if (claims.missingVerdict.length > 0 || claims.renderedWithVerdict !== claims.expected) {
      failures.push("EXPLICIT_VERDICT_OMISSION");
    }
    if (claims.missingReason.length > 0) failures.push("CLAIM_REASON_OMISSION");
    if (claims.duplicateClaimIndexes.length > 0) failures.push("CLAIM_DUPLICATION");
  }

  // Surface-count hard check: visible claim texts without matching verdicts.
  const surface = countFinalTransportClaimVerdicts(answer);
  if (
    surface.claimCount >= 1 &&
    surface.verdictCount !== surface.claimCount &&
    !failures.includes("EXPLICIT_VERDICT_OMISSION")
  ) {
    failures.push("EXPLICIT_VERDICT_OMISSION");
  }

  let evidenceRankingOk: boolean | null = null;
  if (classifyRankingObjective(args.userMessage) === "EVIDENCE_STRENGTH") {
    const records = parseCanonicalEvidenceRecords(args.userMessage);
    const ranked = rankByEvidenceStrength(records);
    const expected = ranked.map((r) => r.subject.toLowerCase());
    const text = String(answer || "").toLowerCase();
    const subjectsPresent = expected.filter((name) =>
      new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text),
    ).length;
    const bad =
      detectValueForStrengthSubstitution(answer, args.userMessage) ||
      (records.length >= 2 && subjectsPresent < Math.min(2, expected.length));
    evidenceRankingOk = !bad;
    if (bad) failures.push("VALUE_FOR_STRENGTH_SUBSTITUTION");
  }

  let scopeOk: boolean | null = null;
  if (
    parseCanonicalEvidenceRecords(args.userMessage).some(
      (r) => r.samplingMethod === "SAMPLE" || (r.coverageRatio != null && r.coverageRatio < 1),
    )
  ) {
    const over = sampleOvergeneralizedToPopulation(answer, args.userMessage);
    scopeOk = !over;
    if (over) failures.push("SAMPLE_TO_POPULATION_OVERGENERALIZATION");
  }

  const expectedClaims = Math.max(resolvedClaims.length, surface.claimCount);
  const expectedVerdicts = expectedClaims;
  const finalTransportVerdictCount =
    claims?.renderedWithVerdict ?? surface.verdictCount;
  const releaseAuthorized = !failures.some((f) =>
    [
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
      "TRANSPORT_CONTRACT_FAIL",
    ].includes(f),
  );

  const provenance: TransportContractProvenance = {
    expectedClaims,
    expectedVerdicts,
    finalTransportClaimCount: Math.max(surface.claimCount, resolvedClaims.length),
    finalTransportVerdictCount,
    validatorRan: true,
    validatorResult: releaseAuthorized ? "PASS" : "FAIL",
    validatorFailureReasons: failures,
    releaseAuthorized,
  };

  return {
    ok: failures.length === 0,
    failures,
    section,
    claims,
    diagnosticsVisible,
    evidenceRankingOk,
    scopeOk,
    provenance,
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
  "TRANSPORT_CONTRACT_FAIL",
]);

export function hasHardFinalVisibleFailure(failures: string[]): boolean {
  return failures.some((f) => HARD_FINAL_VISIBLE_FAILURES.has(f));
}

/** Clean scoped failure — no fabricated content, no internal diagnostic codes. */
export function cleanScopedContractFailureMessage(userMessage: string): string {
  void userMessage;
  return [
    "I cannot release this answer in its current form.",
    "Required objective output contracts are not satisfied,",
    "so the incomplete response remains open rather than being released as complete.",
  ].join(" ");
}

/**
 * Authoritative transport-boundary gate. Must run AFTER all semantic writers.
 * RELEASE_AUTHORIZED = FALSE when FINAL_TRANSPORT_VERDICT_COUNT != EXPECTED_VERDICTS.
 */
export function authorizeTransportRelease(args: {
  answer: string;
  userMessage: string;
  expectedTopLevelSections: number | null;
  sectionTitles?: string[];
  claims: ClaimObligation[];
}): {
  authorized: boolean;
  message: string;
  assessment: FinalVisibleContractResult;
  postValidationMutation: boolean;
} {
  const assessment = assessFinalVisibleContract(args);
  const hard = hasHardFinalVisibleFailure(assessment.failures);
  if (!hard && assessment.provenance.releaseAuthorized) {
    return {
      authorized: true,
      message: String(args.answer || ""),
      assessment,
      postValidationMutation: false,
    };
  }
  return {
    authorized: false,
    message: cleanScopedContractFailureMessage(args.userMessage),
    assessment: {
      ...assessment,
      failures: [...assessment.failures, "TRANSPORT_CONTRACT_FAIL"],
      provenance: {
        ...assessment.provenance,
        releaseAuthorized: false,
        validatorResult: "FAIL",
        validatorFailureReasons: [...assessment.failures, "TRANSPORT_CONTRACT_FAIL"],
      },
    },
    postValidationMutation: false,
  };
}

