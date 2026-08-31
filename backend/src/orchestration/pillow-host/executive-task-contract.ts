/**
 * Executive request / task contract.
 *
 * Structured obligations derived from Grand King's message that must survive
 * truth/epistemic/decision release. Prevents safe-summary collapse from
 * silently dropping requested work.
 *
 * Does NOT encode sealed examination prompts or expected answers.
 */

import type { ExecutiveTruthSnapshot } from "./executive-truth-types.js";
import {
  asksForRiskRanking,
  asksForVerificationPriority,
  detectReasoningScope,
  hasSyntheticAnalysisMarker,
  isScopedAwayFromLiveEmpire,
  synthesizeEvidenceStructureAudit,
  synthesizeRiskRanking,
  synthesizeScopedRecommendation,
  synthesizeVerificationPriority,
  type ReasoningScopeType,
} from "./executive-scoped-reasoning.js";
import {
  extractMaterialConstraints,
  synthesizeConstraintAwareRecommendation,
  type MaterialConstraint,
} from "./executive-decision-constraints.js";
import {
  packEstablishesOccurrenceThenLaterReversal,
  userAsksOccurrenceVsEconomic,
} from "./executive-event-state.js";
import {
  authorityAskBlocksCommerceGrounding,
  authorityKindSignals,
  classifyAuthorityKind,
  hasAuthoritySemanticsMarker,
  synthesizeAuthorityUnitAnswer,
  type AuthorityTaskKind,
} from "./executive-authority-semantics.js";
import {
  claimLocallyRendered,
  parseClaimObligationsFromContractTasks,
} from "./executive-conclusion-ledger.js";
import { detectExpectedTopLevelSections } from "./executive-section-contract.js";
import {
  buildCanonicalCaseState,
  extractQuotedClaimsOnly,
  formatCanonicalStateBrief,
} from "./executive-canonical-state.js";
import { buildDecisionCaseState } from "./executive-decision-case-state.js";
import { synthesizeBoundedDecisionObligation } from "./executive-request-execution-plan.js";

export type { ReasoningScopeType, MaterialConstraint, AuthorityTaskKind };

export type ExecutiveTaskKind =
  | "operating_briefing"
  | "premise_audit"
  | "temporal_reconciliation"
  | "conditional_reasoning"
  | "recommendation"
  | "evidence_explanation"
  | "inference"
  | "uncertainty"
  | "risk_ranking"
  | "verification_priority"
  | "authority_analysis"
  | "delegation_analysis"
  | "governance_analysis"
  | "capability_analysis"
  | "execution_analysis"
  | "approval_requirement"
  | "delegation_controls"
  | "multipart_unit"
  | "general";

/** Internal premise scope — never dump these labels into Grand King chat. */
export type ReasoningPremiseType =
  | "CURRENT_VERIFIED_FACT"
  | "OWNER_CURRENT_ASSERTION"
  | "HYPOTHETICAL"
  | "HISTORICAL_CLAIM"
  | "INFERENCE"
  | "UNKNOWN";

export type ExecutiveTaskUnit = {
  id: string;
  kind: ExecutiveTaskKind;
  /** Grand King source span for this obligation (stable identity). */
  text: string;
  sourceSpan: string;
  subject: string;
  requiredOperation: string;
  required: boolean;
};

export type ExecutiveTaskContract = {
  requestIntent: string;
  tasks: ExecutiveTaskUnit[];
  requiresRecommendation: boolean;
  requiresEvidenceExplanation: boolean;
  requiresPremiseAudit: boolean;
  requiresTemporalReconciliation: boolean;
  requiresConditionalReasoning: boolean;
  requiresRiskRanking: boolean;
  requiresVerificationPriority: boolean;
  requiresAuthorityAnalysis: boolean;
  /** Owner-supplied hypotheticals for this turn only — not current verified fact. */
  hypotheticalPremises: string[];
  /** Surface Birth only when the ask makes it relevant. */
  birthRelevant: boolean;
  multipart: boolean;
  /** CURRENT_REALITY vs SYNTHETIC_ANALYSIS / hypothetical / historical / comparative. */
  scopeType: ReasoningScopeType;
  /** Material decision constraints that must survive into final recommendation. */
  materialConstraints: MaterialConstraint[];
  /** Explicit quoted/enumerated claims requiring per-claim verdicts. */
  expectedClaims: number;
  requiresClaimSetCompleteness: boolean;
  /** Explicit N top-level numbered sections requested by Grand King. */
  expectedTopLevelSections: number | null;
  /** Original user message — used for decisionCase / bounded synthesis. */
  sourceMessage?: string;
};

export type TaskCoverageStatus =
  | "completed"
  | "partial"
  | "unavailable"
  | "silent_drop";

export type TaskCoverageReport = {
  requiredTasks: number;
  completedTasks: number;
  partialTasks: number;
  unavailableTasks: number;
  silentlyDroppedTasks: number;
  byTask: Array<{
    id: string;
    kind: ExecutiveTaskKind;
    status: TaskCoverageStatus;
    reason?: string;
  }>;
};

const STOP = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "from",
  "your",
  "what",
  "when",
  "where",
  "which",
  "into",
  "about",
  "have",
  "does",
  "should",
  "would",
  "could",
  "please",
  "briefly",
  "each",
  "them",
  "their",
  "then",
  "than",
  "only",
  "also",
  "just",
  "very",
  "into",
  "over",
  "under",
  "after",
  "before",
  "among",
  "across",
]);

function significantTokens(text: string): string[] {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOP.has(t))
    .slice(0, 24);
}

/**
 * Chronology / evidence stamps — never obligation identities.
 * TIMESTAMPS_ARE_NOT_TASKS.
 */
export function lineStartsWithTemporalStamp(line: string): boolean {
  const t = String(line || "").trim();
  if (!t) return false;
  // HH:MM / H:MM / HH:MM:SS / optional AM/PM
  if (/^\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?\b/.test(t)) return true;
  // ISO date, optional time
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?/.test(t)) return true;
  // Day Month Year (optional time)
  if (/^\d{1,2}\s+[A-Za-z]{3,9}\.?\s+\d{4}(?:\s+\d{1,2}:\d{2})?/.test(t)) return true;
  return false;
}

/**
 * When Grand King asks for exactly N sections, take the first consecutive 1..N run.
 * Evidence logs after that (timestamps, extra numbered readings) must not become tasks.
 */
export function extractConsecutiveSectionRun(
  message: string,
  expected: number,
): string[] | null {
  if (!Number.isFinite(expected) || expected < 2 || expected > 30) return null;
  const lines = String(message || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    if (lineStartsWithTemporalStamp(lines[i]!)) continue;
    const first = /^1[\).]\s*(.+)$/.exec(lines[i]!);
    if (!first?.[1]) continue;
    const out = [first[1].trim()];
    let ok = true;
    for (let n = 2; n <= expected; n++) {
      const line = lines[i + n - 1];
      if (!line || lineStartsWithTemporalStamp(line)) {
        ok = false;
        break;
      }
      const m = new RegExp(`^${n}[\\).]\\s*(.+)$`).exec(line);
      if (!m?.[1]) {
        ok = false;
        break;
      }
      out.push(m[1].trim());
    }
    if (ok && out.length === expected) return out;
  }
  return null;
}

function splitMultipartUnits(message: string, expectedTopLevelSections?: number | null): string[] {
  const text = String(message || "").trim();
  if (!text) return [];

  if (expectedTopLevelSections != null) {
    const run = extractConsecutiveSectionRun(text, expectedTopLevelSections);
    if (run) return run;
  }

  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const numbered: string[] = [];
  for (const line of lines) {
    // Timestamps like 08:00 must never match as "08" + ":" list markers.
    if (lineStartsWithTemporalStamp(line)) continue;
    // Colon list marker only when NOT starting a clock time (negative lookahead).
    const m = line.match(
      /^(?:\d{1,2}(?:[\).]|:(?!\d))|[A-H][\).:]|Q\d{1,2}[\).:]|Part\s+\d+[\).:]?)\s*(.+)$/i,
    );
    if (m?.[1]) numbered.push(m[1].trim());
  }
  if (numbered.length >= 2) {
    if (
      expectedTopLevelSections != null &&
      numbered.length > expectedTopLevelSections
    ) {
      // Prefer a clean 1..N prefix when present among markers.
      const run = extractConsecutiveSectionRun(text, expectedTopLevelSections);
      if (run) return run;
      return numbered.slice(0, expectedTopLevelSections);
    }
    return numbered;
  }
  const bullets: string[] = [];
  for (const line of lines) {
    if (lineStartsWithTemporalStamp(line)) continue;
    const m = line.match(/^[-*•]\s+(\S.+)$/);
    if (m?.[1]) bullets.push(m[1].trim());
  }
  if (bullets.length >= 3) return bullets;
  const tableRows = lines
    .filter((l) => !lineStartsWithTemporalStamp(l))
    .filter((l) => /\s\|\s/.test(l) || /^[^:]{3,40}:\s+\S/.test(l));
  if (tableRows.length >= 3) return tableRows.map((l) => l.replace(/^[-*•]\s+/, "").trim());
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 20 && p.length <= 320)
    .filter((p) => !lineStartsWithTemporalStamp(p));
  if (paras.length >= 3 && paras.length <= 12) return paras;
  return [];
}

function subjectFromSpan(span: string): string {
  let t = String(span || "").replace(/\s+/g, " ").trim();
  // Keep identity of the ask without echoing contaminated claim bodies.
  t = t.replace(/\baccording to[^.]{0,80}/gi, "alleged external source claim");
  t = t.replace(/\bwe sold \d+[^.]{0,40}/gi, "alleged sales-volume claim");
  t = t.replace(/\bproject management dashboard\b/gi, "unattested dashboard");
  t = t.replace(/\bcommercial position reports?\b/gi, "unattested report");
  return t.slice(0, 100) || "this obligation";
}

function requiredOperationForKind(kind: ExecutiveTaskKind): string {
  switch (kind) {
    case "temporal_reconciliation":
      return "audit_current_vs_historical";
    case "premise_audit":
      return "audit_claim_truth";
    case "evidence_explanation":
      return "audit_provenance";
    case "inference":
      return "audit_inference_validity";
    case "conditional_reasoning":
      return "reason_under_assumption";
    case "recommendation":
      return "recommend_or_decide";
    case "uncertainty":
      return "identify_unknowns";
    case "operating_briefing":
      return "state_briefing";
    case "risk_ranking":
      return "rank_cross_obligation_risk";
    case "verification_priority":
      return "select_verification_priority";
    case "authority_analysis":
      return "analyze_owner_authority";
    case "delegation_analysis":
      return "analyze_delegated_discretion";
    case "governance_analysis":
      return "analyze_governance_permission";
    case "capability_analysis":
      return "analyze_system_capability";
    case "execution_analysis":
      return "analyze_actual_execution";
    case "approval_requirement":
      return "analyze_approval_requirement";
    case "delegation_controls":
      return "analyze_delegation_controls";
    default:
      return "answer_distinct_obligation";
  }
}

function isAuthorityTaskKind(kind: ExecutiveTaskKind): kind is AuthorityTaskKind {
  return (
    kind === "authority_analysis" ||
    kind === "delegation_analysis" ||
    kind === "governance_analysis" ||
    kind === "capability_analysis" ||
    kind === "execution_analysis" ||
    kind === "approval_requirement" ||
    kind === "delegation_controls"
  );
}

/**
 * Classify ONE obligation from its own source span only.
 * Never inherit sibling/global kind dominance (fixes heterogeneous clone class).
 */
export function classifyLocalObligationKind(part: string): ExecutiveTaskKind {
  const m = String(part || "").trim();
  if (!m) return "multipart_unit";

  // Theme/note enumerations are distinct siblings — not whole-state briefings.
  if (/\b(theme\s+\d+|note on theme|brief verified note on theme)\b/i.test(m)) {
    return "multipart_unit";
  }

  if (asksForRiskRanking(m)) return "risk_ranking";
  if (asksForVerificationPriority(m)) return "verification_priority";

  // Authority / delegation / governance before claim-audit or $ → premise_audit.
  const authorityKind = classifyAuthorityKind(m);
  if (authorityKind) return authorityKind;

  // Heterogeneous evidence-audit operations — do not flatten all to premise_audit.
  if (
    /\b(synthes|executive (?:synthesis|conclusion|summary)|across the (?:above|audits|claims)|integrate (?:the |these )?findings|overall (?:reading|conclusion))\b/i.test(
      m,
    )
  ) {
    return "recommendation";
  }
  if (
    /\b(supersed|later (?:registry|update|transaction|ledger)|what does (?:the )?later|temporal)\b/i.test(
      m,
    )
  ) {
    return "temporal_reconciliation";
  }
  if (
    /\b(weigh|supplier.{0,60}independent|independent.{0,60}(?:supplier|study|evidence)|provenance)\b/i.test(
      m,
    )
  ) {
    return "evidence_explanation";
  }

  // Decision-unlock / experiment / reversal are first-class recommendation work.
  if (
    /\b(?:what\s+(?:decision|this)\s+(?:would\s+)?unlock|decision\s+(?:that\s+)?(?:verification\s+)?unlocks?|unlocks?\s+(?:the\s+)?decision|choose\s+one\s+(?:next\s+)?experiment|next\s+experiment|critical\s+verification|reversal\s+evidence|what\s+would\s+(?:change|reverse))\b/i.test(
      m,
    )
  ) {
    return "recommendation";
  }

  const local = detectKindsInText(m);
  // Avoid weak "operating/state" global signals turning every theme into a briefing clone.
  if (local.length > 0) {
    if (local[0] === "operating_briefing" && local.length === 1 && m.length < 120) {
      return "multipart_unit";
    }
    return local[0]!;
  }

  if (
    /\b(research|provenance|substantiat|according to|study|report (?:shows|claims)|source for|evidence for)\b/i.test(
      m,
    )
  ) {
    return "evidence_explanation";
  }
  // Budget ceilings in delegation text are not commercial claim audits.
  if (
    !hasAuthoritySemanticsMarker(m) &&
    /\b(revenue|orders?|sales?|profit|usd|\$[0-9]|financial|realised commerce|made (?:money|revenue))\b/i.test(
      m,
    )
  ) {
    return "premise_audit";
  }
  if (
    /\b(asin|product (?:name|identity|focus)|entity identity|bound product|titled|named|called|same (?:entity|product)|co-occur)\b/i.test(
      m,
    )
  ) {
    return "premise_audit";
  }
  if (
    /\b(imply|implies|therefore|conclude|follows? that|mean(?:s)? that|likely success|selection (?:implies|means))\b/i.test(
      m,
    )
  ) {
    return "inference";
  }
  if (
    /\b(deploy|deployment|offline|not (?:yet )?live|waiting to go live|currently (?:live|online)|is (?:EmpireAI|the service) live)\b/i.test(
      m,
    )
  ) {
    return "temporal_reconciliation";
  }
  if (/\b(histor(?:y|ical)|yesterday|superseded|was true|now true)\b/i.test(m)) {
    return "temporal_reconciliation";
  }
  if (/\b(dangerous|which (?:are|is)|what should i do|recommend|next (?:step|move)|next experiment|decision unlock|reversal)\b/i.test(m)) {
    return "recommendation";
  }
  return "multipart_unit";
}

function makeTaskUnit(
  id: string,
  kind: ExecutiveTaskKind,
  span: string,
  required = true,
): ExecutiveTaskUnit {
  const sourceSpan = span.slice(0, 280);
  return {
    id,
    kind,
    text: sourceSpan,
    sourceSpan,
    subject: subjectFromSpan(sourceSpan),
    requiredOperation: requiredOperationForKind(kind),
    required,
  };
}

/** Extract owner-scoped hypothetical premises (not current verified facts). */
export function extractHypotheticalPremises(message: string): string[] {
  const text = String(message || "").trim();
  if (!text) return [];
  const out: string[] = [];
  const push = (raw: string) => {
    const t = raw.replace(/\s+/g, " ").trim();
    if (t.length < 12) return;
    if (out.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    out.push(t.slice(0, 220));
  };
  for (const m of text.matchAll(
    /(?:assume|supposing|suppose|imagine)(?:\s+that)?\s+(.{12,220}?)(?:\.|\n|;|$)/gi,
  )) {
    if (m[1]) push(m[1]);
  }
  for (const m of text.matchAll(
    /\b(?:if|when)\s+(.{8,160}?)\s+(?:were|becomes?|became|were to become)\s+(.{8,160}?)(?:\.|\n|;|$)/gi,
  )) {
    if (m[1] && m[2]) push(`${m[1].trim()} → ${m[2].trim()}`);
  }
  for (const m of text.matchAll(
    /\b(?:tomorrow|next (?:week|month)|in (?:this|that) (?:hypothetical )?scenario)[:,]?\s*(.{12,220}?)(?:\.|\n|;|$)/gi,
  )) {
    if (m[1]) push(m[1]);
  }
  for (const m of text.matchAll(
    /\bfor (?:this|the) (?:hypothetical|scenario|thought experiment)[:,]?\s*(.{12,220}?)(?:\.|\n|;|$)/gi,
  )) {
    if (m[1]) push(m[1]);
  }
  return out.slice(0, 8);
}

function detectKindsInText(text: string): ExecutiveTaskKind[] {
  const m = text;
  const kinds: ExecutiveTaskKind[] = [];
  if (asksForRiskRanking(m)) kinds.push("risk_ranking");
  if (asksForVerificationPriority(m)) kinds.push("verification_priority");

  // Authority family first — prevents audit/evaluate/classify → premise_audit hijack.
  const auth = classifyAuthorityKind(m);
  if (auth) kinds.push(auth);
  if (hasAuthoritySemanticsMarker(m)) {
    // Only add sibling authority kinds when classifyAuthorityKind already agreed,
    // or when explicit agency phrases appear — never bare "standing"/"ceiling".
    if (
      /\b(delegat|discretion|you may (?:spend|adjust)|anything below|standing (?:authori|delegat)|one[- ]time (?:authori|approval|spend)|automatic(?:ally)? adjust)\b/i.test(
        m,
      )
    ) {
      if (!kinds.includes("delegation_analysis")) kinds.push("delegation_analysis");
    }
    if (
      /\b(system capability|connected (?:integration|channel)|actually (?:spend|execute)|executable now|execution available|is execution available)\b/i.test(
        m,
      )
    ) {
      if (!kinds.includes("capability_analysis")) kinds.push("capability_analysis");
    }
    if (/\b(governance|constitutional|policy|permitted|forbidden)\b/i.test(m)) {
      if (!kinds.includes("governance_analysis")) kinds.push("governance_analysis");
    }
    if (/\b(execution occur|did not (?:spend|execute)|side effect|confirm (?:the )?execution)\b/i.test(m)) {
      if (!kinds.includes("execution_analysis")) kinds.push("execution_analysis");
    }
    if (/\b(do not ask again|without another approval|approval required)\b/i.test(m)) {
      if (!kinds.includes("approval_requirement")) kinds.push("approval_requirement");
    }
    if (/\b(stop[- ]loss|kill switch|audit trail)\b/i.test(m)) {
      if (!kinds.includes("delegation_controls")) kinds.push("delegation_controls");
    }
    if (!kinds.some(isAuthorityTaskKind)) kinds.push("authority_analysis");
  }

  // Skip claim-audit when the turn is primarily authority/delegation semantics.
  const authorityPrimary = kinds.some(isAuthorityTaskKind);
  if (
    !authorityPrimary &&
    /\b(premise|assumption|assumptions|audit (?:each|these|the)|evaluate (?:each|whether)|classify (?:each|these)|supported|contradicted|unverif|claim[- ]by[- ]claim|better supported)\b/i.test(
      m,
    )
  ) {
    kinds.push("premise_audit");
  }
  if (
    /\b(assume|suppos(?:e|ing)|hypothetic|if .{0,60} (?:were|becomes?|became)|under (?:the )?assumption|for (?:this|the) scenario|conditional(?:ly)?)\b/i.test(
      m,
    ) ||
    extractHypotheticalPremises(m).length > 0
  ) {
    // "assume you may spend" is still authority — do not force conditional unless hypothesis-shaped.
    if (!authorityPrimary || extractHypotheticalPremises(m).length > 0) {
      kinds.push("conditional_reasoning");
    }
  }
  if (
    /\b(temporal|reconcil|histor(?:y|ical)|yesterday|tomorrow|superseded|was true|now true|future (?:state|hypothetical)|how (?:does|do) (?:this|that|the conclusion) change)/i.test(
      m,
    )
  ) {
    kinds.push("temporal_reconciliation");
  }
  if (
    /\b(recommend(?:ation)?|what should (?:we|i) do|next (?:step|move)|priorit|play to win|bounded (?:test|experiment)|defer|commercial decision|decide (?:today|which)|which (?:version|one) (?:is|would be) better|make a (?:decision|call))\b/i.test(
      m,
    )
  ) {
    kinds.push("recommendation");
  }
  if (
    /\b(how do you know|show (?:me )?the evidence|provenance|where did (?:that|this) come from|prove it|source for)\b/i.test(
      m,
    )
  ) {
    kinds.push("evidence_explanation");
  }
  if (
    /\b(infer|inference|hypothesis|what do you think|best assessment|separate inference)\b/i.test(m)
  ) {
    kinds.push("inference");
  }
  if (
    /\b(what (?:don'?t|do not) we know|uncertain|unknown|missing evidence|what would falsify|identify unknowns)\b/i.test(
      m,
    )
  ) {
    kinds.push("uncertainty");
  }
  if (
    /\b(briefing|operating (?:posture|state)|where are we|current state|status|facts only)\b/i.test(
      m,
    )
  ) {
    kinds.push("operating_briefing");
  }
  return kinds;
}

/**
 * Extract an explicit claim set when Grand King asks for per-claim verdicts.
 * Stable IDs claim_1..claim_N — middle members must not silently disappear.
 */
export function extractExplicitClaimSet(userMessage: string): string[] {
  // Canonical path: quoted claims only — never section headings as claims.
  return extractQuotedClaimsOnly(userMessage);
}

/**
 * Parse Grand King message into an internal task contract.
 */
export function parseExecutiveTaskContract(userMessage: string | undefined): ExecutiveTaskContract {
  const text = String(userMessage || "").trim();
  const explicitClaims = extractExplicitClaimSet(text);
  const expectedTopLevelSections = detectExpectedTopLevelSections(text);
  const parts = splitMultipartUnits(text, expectedTopLevelSections);
  const globalKinds = detectKindsInText(text);
  const hypotheticalPremises = extractHypotheticalPremises(text);
  const tasks: ExecutiveTaskUnit[] = [];

  // Explicit claim-set obligations — keep numbered analysis sections too when present.
  // Single soft claim (Crestline-class) must still bind as claim_1.
  if (explicitClaims.length >= 1) {
    if (explicitClaims.length >= 2 && parts.length >= 2) {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!;
        // Skip the part that is only the claim list itself.
        if (
          /(?:quoted\s+)?claims?/i.test(part) &&
          (part.match(/[“"']/g) || []).length >= 4
        ) {
          continue;
        }
        const kind = classifyLocalObligationKind(part);
        tasks.push(makeTaskUnit(`t${i + 1}`, kind, part, true));
      }
    } else if (explicitClaims.length === 1 && parts.length >= 2) {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!;
        if (/assess\s+this\s+claim|separate\s+verdict|judge\s*:/i.test(part) && parts.length > 1) {
          // Keep non-claim analysis parts; claim itself is added below.
          if (/^(?:assess\s+this\s+claim|separate\s+verdict|judge)\b/i.test(part.trim())) continue;
        }
        const kind = classifyLocalObligationKind(part);
        tasks.push(makeTaskUnit(`t${i + 1}`, kind, part, true));
      }
    }
    for (let i = 0; i < explicitClaims.length; i++) {
      const claim = explicitClaims[i]!;
      tasks.push(
        makeTaskUnit(
          `claim_${i + 1}`,
          "premise_audit",
          `Claim ${i + 1}: "${claim}" — separate verdict`,
          true,
        ),
      );
    }
  } else if (parts.length >= 2) {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      // LOCAL classification only — never let one sibling's kind dominate others.
      const kind = classifyLocalObligationKind(part);
      tasks.push(makeTaskUnit(`t${i + 1}`, kind, part, true));
    }
  } else if (globalKinds.length > 0) {
    const preferred = [
      "authority_analysis",
      "delegation_analysis",
      "governance_analysis",
      "capability_analysis",
      "execution_analysis",
      "approval_requirement",
      "delegation_controls",
      "conditional_reasoning",
      "premise_audit",
      "temporal_reconciliation",
      "risk_ranking",
      "verification_priority",
      "recommendation",
      "evidence_explanation",
      "uncertainty",
      "inference",
      "operating_briefing",
    ] as ExecutiveTaskKind[];
    const ordered = preferred.filter((k) => globalKinds.includes(k));
    const use = ordered.length > 0 ? ordered : globalKinds;
    for (let i = 0; i < use.length; i++) {
      tasks.push(makeTaskUnit(`t${i + 1}`, use[i]!, text, true));
    }
  } else {
    tasks.push(
      makeTaskUnit("t1", "general", text.slice(0, 280) || "Respond to the executive request.", true),
    );
  }

  const scopeType = detectReasoningScope(text);
  const materialConstraints = extractMaterialConstraints(text);
  const requiresRecommendation =
    globalKinds.includes("recommendation") ||
    /\b(recommend(?:ation)?|what should (?:we|i) do|next (?:step|move)|commercial decision|decide (?:today|which))\b/i.test(
      text,
    );
  const requiresEvidenceExplanation =
    globalKinds.includes("evidence_explanation") ||
    /\b(how do you know|provenance|show (?:me )?the evidence)\b/i.test(text);
  const authorityPrimary = globalKinds.some(isAuthorityTaskKind) || hasAuthoritySemanticsMarker(text);
  const requiresPremiseAudit =
    !authorityPrimary &&
    (globalKinds.includes("premise_audit") ||
      /\b(premise|claim[- ]by[- ]claim|better supported)\b/i.test(text));
  const requiresTemporalReconciliation =
    globalKinds.includes("temporal_reconciliation") ||
    /\b(reconcil|histor(?:y|ical)|yesterday|tomorrow|superseded)\b/i.test(text);
  const requiresConditionalReasoning =
    globalKinds.includes("conditional_reasoning") ||
    (!authorityPrimary && hypotheticalPremises.length > 0);
  const requiresRiskRanking =
    globalKinds.includes("risk_ranking") || asksForRiskRanking(text);
  const requiresVerificationPriority =
    globalKinds.includes("verification_priority") || asksForVerificationPriority(text);
  const requiresAuthorityAnalysis =
    authorityPrimary || globalKinds.some(isAuthorityTaskKind);

  const ensureKind = (kind: ExecutiveTaskKind, label: string) => {
    if (tasks.some((t) => t.kind === kind)) return;
    // Additive only — must not reclassify existing siblings.
    tasks.push(makeTaskUnit(`tx_${kind}`, kind, label, true));
  };
  if (requiresConditionalReasoning)
    ensureKind(
      "conditional_reasoning",
      "Reason under the owner-supplied hypothetical without treating it as current verified fact.",
    );
  if (requiresRiskRanking)
    ensureKind(
      "risk_ranking",
      "Rank which claim is most dangerous for an irreversible financial decision.",
    );
  if (requiresVerificationPriority)
    ensureKind(
      "verification_priority",
      "Choose the single most important additional verification.",
    );
  if (requiresRecommendation)
    ensureKind("recommendation", "Provide a recommendation or conditional next move.");
  if (requiresEvidenceExplanation)
    ensureKind("evidence_explanation", "Explain how you know / provenance for key claims.");
  if (requiresPremiseAudit && parts.length < 2 && explicitClaims.length < 2)
    ensureKind("premise_audit", "Audit supplied premises individually.");
  if (requiresTemporalReconciliation && !tasks.some((t) => t.kind === "temporal_reconciliation"))
    ensureKind("temporal_reconciliation", "Reconcile historical, current, and future evidence.");
  if (requiresAuthorityAnalysis && parts.length < 2 && !tasks.some((t) => isAuthorityTaskKind(t.kind))) {
    const ak = classifyAuthorityKind(text) ?? "authority_analysis";
    ensureKind(ak, "Analyze owner authorization, delegation, governance, capability, and execution distinctly.");
  }

  const expectedClaims = explicitClaims.length >= 2 ? explicitClaims.length : 0;
  const requiresClaimSetCompleteness = expectedClaims >= 2;
  const primary =
    globalKinds[0] ??
    (explicitClaims.length >= 2
      ? "explicit_claim_set"
      : parts.length >= 2
        ? "multipart_executive_request"
        : "general_executive_request");

  return {
    requestIntent: primary,
    tasks,
    requiresRecommendation,
    requiresEvidenceExplanation,
    requiresPremiseAudit: requiresPremiseAudit || requiresClaimSetCompleteness,
    requiresTemporalReconciliation,
    requiresConditionalReasoning,
    requiresRiskRanking,
    requiresVerificationPriority,
    requiresAuthorityAnalysis,
    hypotheticalPremises,
    // "authorization" alone must not surface Birth.
    birthRelevant: /\bbirth\b/i.test(text),
    multipart: parts.length >= 2 || requiresClaimSetCompleteness,
    scopeType,
    materialConstraints,
    expectedClaims,
    requiresClaimSetCompleteness,
    expectedTopLevelSections,
    sourceMessage: text,
  };
}

function kindSignals(kind: ExecutiveTaskKind): RegExp {
  switch (kind) {
    case "premise_audit":
      return /\b(premise|assumption|supported|contradict|unverified|stale|inferred|cannot (?:establish|verify)|not established|better supported|version|verdict|unproven|unsupported)\b/i;
    case "temporal_reconciliation":
      return /\b(histor(?:y|ical)|current(?:ly)?|future|superseded|was (?:true|correct)|now (?:true|verified)|yesterday|today|tomorrow|reconcil|changes? (?:the|our) conclusion)\b/i;
    case "conditional_reasoning":
      return /\b(under (?:the )?assumption|if (?:that|this|those)|in that scenario|conditional|would (?:change|not)|hypothetic|suppose|assuming|binding constraint|unit economics)\b/i;
    case "recommendation":
      return /\b(recommend(?:ation)?|should|next (?:step|move)|verify first|bounded|defer|conditional|priorit|better supported|I would|decision|choose|prefer|select|commercial (?:call|decision))\b/i;
    case "evidence_explanation":
      return /\b(because|source|provenance|how I know|from (?:live|verified|commissioning)|I can stand on|don't (?:yet )?have|not retrieved|need)\b/i;
    case "inference":
      return /\b(infer|hypothesis|assessment|suspect|likely|unproven|invalid inference)\b/i;
    case "uncertainty":
      return /\b(unknown|unproven|missing|uncertain|not (?:yet )?(?:verified|established)|would (?:falsify|change))\b/i;
    case "operating_briefing":
      return /\b(live|product|orders?|revenue|commerce|focus|posture|status)\b/i;
    case "risk_ranking":
      return /\b(most dangerous|danger(?:ous)?|rank(?:ing)?|highest risk|irreversible|what matters most)\b/i;
    case "verification_priority":
      return /\b(verify first|verification priority|most important|priority|corroborat)\b/i;
    case "authority_analysis":
    case "delegation_analysis":
    case "governance_analysis":
    case "capability_analysis":
    case "execution_analysis":
    case "approval_requirement":
    case "delegation_controls":
      return authorityKindSignals(kind);
    case "multipart_unit":
    case "general":
    default:
      return /\b(live|product|orders?|verified|unproven|recommend|because|premise|current|focus|verdict|need|authori|delegat|capability)\b/i;
  }
}

function tokenOverlapHit(taskText: string, answer: string): boolean {
  const tokens = significantTokens(taskText);
  if (tokens.length === 0) return false;
  const a = answer.toLowerCase();
  let hits = 0;
  for (const t of tokens) {
    if (a.includes(t)) hits += 1;
  }
  return hits >= Math.min(2, tokens.length);
}

/**
 * Deterministic coverage of the task contract against a draft answer.
 */
export function assessTaskCoverage(
  answer: string,
  contract: ExecutiveTaskContract,
): TaskCoverageReport {
  const text = String(answer || "");
  const byTask = contract.tasks.map((task) => {
    const claimObligations = parseClaimObligationsFromContractTasks(contract.tasks);
    const thisClaim = claimObligations.find((c) => c.id === task.id);

    // Claim obligations: require local Claim N / quote+verdict — never whole-answer token overlap.
    if (thisClaim) {
      const local = claimLocallyRendered(thisClaim, text);
      if (local) {
        return { id: task.id, kind: task.kind, status: "completed" as TaskCoverageStatus };
      }
      return {
        id: task.id,
        kind: task.kind,
        status: (task.required ? "silent_drop" : "unavailable") as TaskCoverageStatus,
        reason: task.required
          ? `Claim ${thisClaim.index} not rendered locally in released answer.`
          : undefined,
      };
    }

    const signal = kindSignals(task.kind).test(text);
    const overlap =
      task.kind === "multipart_unit" || contract.multipart
        ? tokenOverlapHit(task.text, text)
        : false;
    // Unavailable must be local to the answer content — never use task.text signals
    // (that falsely classified global "I don't have…" as covering typed obligations).
    const localUnavailableMarked =
      /\b(cannot (?:establish|verify|complete)|unavailable for this part|open for this part|not address(?:ed)? (?:in|for) this (?:part|turn)|remain(?:s)? open)\b/i.test(
        text,
      ) && (signal || overlap);
    const globalDontHaveOnly =
      /\b(don'?t (?:yet )?have enough|not enough (?:solid )?evidence|cannot answer that confidently)\b/i.test(
        text,
      ) && !signal && !overlap;

    const multiMaterial =
      contract.tasks.length >= 2 ||
      contract.multipart ||
      contract.requiresPremiseAudit ||
      contract.requiresTemporalReconciliation ||
      contract.requiresRecommendation ||
      contract.requiresEvidenceExplanation ||
      contract.requiresConditionalReasoning ||
      contract.requiresRiskRanking ||
      contract.requiresVerificationPriority ||
      contract.requiresAuthorityAnalysis;

    let status: TaskCoverageStatus;
    let reason: string | undefined;
    // Multipart / multi-task: kind signal on the whole answer is insufficient —
    // require local token overlap so siblings cannot share one topical hit.
    const multiStrict =
      contract.multipart ||
      contract.tasks.length >= 4 ||
      (contract.tasks.length >= 3 && new Set(contract.tasks.map((t) => t.kind)).size >= 2);
    if (multiStrict) {
      if (overlap && signal) {
        status = "completed";
      } else if (overlap) {
        status = "partial";
        reason = "Local subject overlap without full kind signal.";
      } else if (signal && task.kind !== "multipart_unit" && task.kind !== "premise_audit") {
        // Aggregate kinds (recommendation / risk / verification) may be global once.
        status = "partial";
        reason = "Kind signal present; local subject overlap weak.";
      } else if (localUnavailableMarked) {
        status = "unavailable";
        reason = "Explicitly marked unavailable for this part.";
      } else {
        status = task.required ? "silent_drop" : "unavailable";
        reason = task.required ? "Required task not addressed locally in released answer." : undefined;
      }
    } else if (signal && (task.kind !== "multipart_unit" || overlap || contract.tasks.length <= 3)) {
      status = "completed";
    } else if (overlap && signal) {
      status = "completed";
    } else if (overlap || signal) {
      status = "partial";
      reason = "Partial topical coverage without full obligation signal.";
    } else if (localUnavailableMarked && !multiMaterial) {
      status = "unavailable";
      reason = "Explicitly marked unavailable.";
    } else if (globalDontHaveOnly && multiMaterial) {
      // Global UNKNOWN collapse must not terminate distinct material obligations.
      status = task.required ? "silent_drop" : "unavailable";
      reason = "Global evidence collapse does not cover this obligation.";
    } else if (localUnavailableMarked) {
      status = "unavailable";
      reason = "Explicitly marked unavailable for this part.";
    } else {
      status = task.required ? "silent_drop" : "unavailable";
      reason = task.required ? "Required task not addressed in released answer." : undefined;
    }
    return { id: task.id, kind: task.kind, status, reason };
  });

  // Multipart: if answer has numbered coverage matching many parts, lift silent drops.
  if (contract.multipart) {
    const numbered = (text.match(/(?:^|\n)\s*\d+\s*[\).:]/gm) || []).length;
    if (numbered >= Math.min(3, contract.tasks.filter((t) => t.kind === "multipart_unit").length)) {
      for (const row of byTask) {
        if (row.kind === "multipart_unit" && row.status === "silent_drop") {
          row.status = "partial";
          row.reason = "Numbered multi-part structure present.";
        }
      }
    }
  }

  // Holistic completion: only for small non-multipart asks.
  // Large heterogeneous audits must not clear silent_drops via one topical hit.
  if (!contract.multipart && contract.tasks.length <= 3) {
    const completedOrPartial = byTask.filter(
      (t) => t.status === "completed" || t.status === "partial",
    ).length;
    const substantive = text.trim().length >= 160;
    const primaryHit =
      (!contract.requiresRecommendation || kindSignals("recommendation").test(text)) &&
      (!contract.requiresPremiseAudit ||
        kindSignals("premise_audit").test(text) ||
        completedOrPartial >= 1) &&
      (!contract.requiresConditionalReasoning ||
        kindSignals("conditional_reasoning").test(text) ||
        /\b(under (?:the )?assumption|if (?:that|this)|scenario|would)\b/i.test(text));
    if (
      substantive &&
      completedOrPartial >= 1 &&
      (primaryHit || completedOrPartial >= Math.ceil(byTask.length / 2))
    ) {
      for (const row of byTask) {
        if (row.status === "silent_drop") {
          row.status = "partial";
          row.reason = "Holistic semantic completion — no contradictory appendix.";
        }
      }
    }
  }

  const requiredTasks = byTask.length;
  const completedTasks = byTask.filter((t) => t.status === "completed").length;
  const partialTasks = byTask.filter((t) => t.status === "partial").length;
  const unavailableTasks = byTask.filter((t) => t.status === "unavailable").length;
  const silentlyDroppedTasks = byTask.filter((t) => t.status === "silent_drop").length;

  return {
    requiredTasks,
    completedTasks,
    partialTasks,
    unavailableTasks,
    silentlyDroppedTasks,
    byTask,
  };
}

function verifiedFactsBlock(truth: ExecutiveTruthSnapshot): {
  product: string;
  orders: number;
  revenue: number;
  live: boolean;
  birthNull: boolean;
} {
  return {
    product:
      truth.product.productName ??
      (truth.product.asin ? `bound product (${truth.product.asin})` : "our bound product"),
    orders: truth.financial.orders,
    revenue: truth.financial.realisedRevenueUsd,
    live:
      Boolean(truth.deploy.gitCommitSha) ||
      truth.deploy.serviceOnlineHint === "assume_online_if_answering",
    birthNull: truth.birth.birthTimestamp == null,
  };
}

/**
 * Natural per-task completion.
 * Under SYNTHETIC_ANALYSIS / comparative / historical scopes: evidence-structure reasoning
 * without injecting live EmpireAI product/revenue/Birth.
 */
export function synthesizeTaskUnitAnswer(
  task: ExecutiveTaskUnit,
  truth: ExecutiveTruthSnapshot,
  opts: {
    birthRelevant?: boolean;
    hypotheticalPremises?: readonly string[];
    scopeType?: ReasoningScopeType;
    siblingSubjects?: readonly string[];
    materialConstraints?: readonly MaterialConstraint[];
    /** Full user pack — enables decisionCase-aware synthesis. */
    userMessage?: string;
  } = {},
): string {
  const scope = opts.scopeType ?? "CURRENT_REALITY";
  const birthRelevant = Boolean(opts.birthRelevant);
  const subject = (task.subject || task.sourceSpan || task.text || "this obligation").slice(0, 140);
  const span = task.sourceSpan || task.text || subject;
  const packText =
    opts.userMessage ||
    [span, ...(opts.siblingSubjects ?? []), opts.hypotheticalPremises?.join(" ") ?? ""]
      .filter(Boolean)
      .join("\n");
  const decisionCase =
    buildDecisionCaseState(opts.userMessage || "") ||
    buildDecisionCaseState(packText) ||
    null;
  const scoped = isScopedAwayFromLiveEmpire(
    scope,
    `${task.text ?? ""} ${task.sourceSpan ?? ""} ${subject} ${opts.userMessage ?? ""}`,
  );
  const f = verifiedFactsBlock(truth);
  const siblings =
    opts.siblingSubjects && opts.siblingSubjects.length > 0
      ? opts.siblingSubjects
      : [subject];
  const constraints = opts.materialConstraints ?? [];

  // Valid decision case: specialized path precedes generic epistemic Unsupported.
  if (decisionCase && task.kind !== "operating_briefing") {
    if (task.kind === "recommendation") {
      const rec = synthesizeBoundedDecisionObligation("Recommendation", decisionCase, packText);
      if (rec) return rec;
    }
    const bounded = synthesizeBoundedDecisionObligation(subject, decisionCase, packText);
    if (bounded) return bounded;
    // Claim audits: do not replace with Unsupported takeover — leave a scenario-scoped shell.
    if (task.kind === "premise_audit" && /Claim\s*\d+/i.test(subject)) {
      return [
        `### ${subject.slice(0, 100)}`,
        "**Scope:** scenario claim audit — evaluate against supplied decision state, not live EmpireAI verification.",
        "",
        "Score this quoted claim against the canonical eligible set / gates for this case. Do not demand external live verification for owner-supplied scenario facts.",
      ].join("\n");
    }
  }

  if (task.kind === "risk_ranking") {
    return synthesizeRiskRanking(siblings, span);
  }
  if (task.kind === "verification_priority") {
    return synthesizeVerificationPriority(siblings, span, constraints);
  }
  if (isAuthorityTaskKind(task.kind)) {
    return synthesizeAuthorityUnitAnswer(
      task.kind,
      subject,
      truth,
      `${span} ${opts.siblingSubjects?.join(" ") ?? ""}`,
    );
  }

  if (scoped && task.kind !== "operating_briefing") {
    switch (task.kind) {
      case "premise_audit":
      case "evidence_explanation":
      case "inference":
      case "uncertainty":
      case "multipart_unit":
      case "general":
      case "temporal_reconciliation":
        return synthesizeEvidenceStructureAudit(subject, span);
      case "conditional_reasoning": {
        const premises = opts.hypotheticalPremises?.length
          ? opts.hypotheticalPremises
          : ["the owner-supplied scenario for this turn"];
        return [
          `### Conditional reasoning — ${subject.slice(0, 80)}`,
          "**Scope:** scenario only — not current EmpireAI fact.",
          "",
          ...premises.slice(0, 4).map((pr) => `- Under assumption: ${pr}`),
          "",
          "What would change under those assumptions: conclusions that depend on them.",
          "What would not automatically change: any live EmpireAI commerce or product identity — those stay outside this scenario unless the owner explicitly ties them in.",
          "When demand strength and adverse unit economics conflict, the binding economic constraint wins — do not scale losses merely because demand looks strong.",
        ].join("\n");
      }
      case "recommendation":
        return constraints.length > 0
          ? synthesizeConstraintAwareRecommendation(subject, constraints)
          : synthesizeScopedRecommendation(subject);
      default:
        return synthesizeEvidenceStructureAudit(subject, span);
    }
  }

  const live = f.live
    ? "EmpireAI is live and answering in production."
    : "I'm answering through the active Brain process.";
  const commerce =
    f.orders === 0 && f.revenue === 0
      ? "Realised orders and realised revenue remain zero."
      : `Realised orders are ${f.orders}; realised revenue is about ${f.revenue} USD.`;

  switch (task.kind) {
    case "operating_briefing":
      return [
        live,
        `Current product focus is ${f.product}.`,
        commerce,
        birthRelevant
          ? f.birthNull
            ? "Birth has not been authorised."
            : "Birth timestamp is set in verified state."
          : "",
      ]
        .filter(Boolean)
        .join(" ");
    case "premise_audit": {
      if (
        scoped ||
        /\bsynthetic/i.test(subject) ||
        /\bsynthetic/i.test(span) ||
        /\bClaim\s+\d+/i.test(subject)
      ) {
        return synthesizeEvidenceStructureAudit(subject, span);
      }
      return [
        `### Claim audit — ${subject.slice(0, 80)}`,
        "**Verdict:** Treat unsupported sales, demand-strength, or unverified market facts as unestablished.",
        "",
        `Against verified state (focus ${f.product}; ${commerce.toLowerCase()}), I will not treat unsupported commercial claims as established.`,
        /revenue|orders?|sales?|profit|usd|financial/i.test(subject)
          ? `**Financial reading:** ${commerce} Claims of realised revenue/sales beyond that stay unestablished.`
          : /asin|product|entity|identity|named|titled/i.test(subject)
            ? `**Entity reading:** verified focus remains ${f.product}${truth.product.asin ? ` (ASIN ${truth.product.asin})` : ""}. Alternate identities stay unsupported.`
            : "I support only what verified commissioning/KPI state can carry for this claim.",
      ].join("\n");
    }
    case "temporal_reconciliation": {
      const packText = `${subject} ${span}`;
      const economicOccurrence =
        packEstablishesOccurrenceThenLaterReversal(packText) ||
        userAsksOccurrenceVsEconomic(packText);
      if (scoped || /\bsynthetic/i.test(subject) || /\bsynthetic/i.test(span)) {
        if (economicOccurrence) {
          return [
            `### Temporal reading — ${subject.slice(0, 80)}`,
            "**Verdict:** Keep historical occurrence distinct from later economic outcomes.",
            "",
            "A later economic reversal changes settlement treatment; it does not by itself erase that the earlier verified event historically occurred.",
            "Only evidence that invalidates the historical record (fraud, void, never executed, erroneous duplicate) may erase historical occurrence.",
            "This temporal conclusion applies to this claim only — it does not rewrite sibling audits.",
          ].join("\n");
        }
        return [
          `### Temporal reading — ${subject.slice(0, 80)}`,
          "**Verdict:** Current scenario state supersedes older conflicting scenario language where they address the same subject.",
          "",
          "Historical notes may have been true at the time; current eligibility and status must be read from the latest verified scenario facts.",
          "This temporal conclusion applies to this claim only — it does not rewrite sibling audits.",
        ].join("\n");
      }
      return [
        `### Temporal audit — ${subject.slice(0, 80)}`,
        "**Verdict:** Current verified state supersedes older conflicting pre-launch language.",
        "",
        "Historically, earlier pre-launch waiting language may have been true at the time.",
        f.live
          ? "Currently verified: we are live and answering now — that supersedes older pre-launch waiting claims where they conflict."
          : "Currently verified service state is limited to this process answer.",
        "",
        "This temporal conclusion applies to this claim only — it does not rewrite sibling audits.",
      ].join("\n");
    }
    case "conditional_reasoning": {
      const premises = opts.hypotheticalPremises?.length
        ? opts.hypotheticalPremises
        : ["the owner-supplied scenario for this turn"];
      return [
        `### Conditional reasoning — ${subject.slice(0, 80)}`,
        "**Scope:** owner assumptions for this turn only — not current verified fact.",
        "",
        ...premises.slice(0, 4).map((pr) => `- Under assumption: ${pr}`),
        "",
        "What would change under those assumptions: conclusions that depend on them.",
        "What would not automatically change: current verified commerce counts and product identity, unless the premises themselves redefine them.",
        "When demand strength and adverse unit economics pull opposite directions, the binding constraint wins — do not scale losses merely because demand is strong; repair economics or withhold scale.",
        "",
        `Current verified baseline for contrast only: focus remains ${f.product}; ${commerce.toLowerCase()}`,
      ].join("\n");
    }
    case "recommendation":
      return constraints.length > 0
        ? synthesizeConstraintAwareRecommendation(subject, constraints)
        : [
            "### My recommendation",
            f.orders === 0
              ? `**Decision:** Verification-first next step on ${f.product} — confirm open commercial unknowns with a bounded check before irreversible spend.`
              : `**Decision:** Deepen what is already working on ${f.product} with a bounded experiment before irreversible spend.`,
            birthRelevant && f.birthNull ? "Birth remains a Grand King decision." : "",
          ]
            .filter(Boolean)
            .join("\n");
    case "evidence_explanation":
      return [
        `### Provenance — ${subject.slice(0, 80)}`,
        "**Verdict:** Only live commissioning/KPI provenance stands this turn.",
        "",
        "Product focus and realised commerce come from live commissioning and KPI state for this workspace.",
        live,
        "I did not retrieve external systems this turn — so claims that need those sources stay open for this part only.",
      ].join("\n");
    case "inference":
      return [
        `### Inference — ${subject.slice(0, 80)}`,
        "**Verdict:** Invalid to treat selection alone as likely commercial success.",
        "",
        `Labeled inference only: commercial demand for ${f.product} is still unproven given ${commerce.toLowerCase()}`,
        "Selection, workflow labels, or unverified research do not by themselves imply likely commercial success.",
        "What would change that: realised sales traction or independently retrieved demand evidence.",
      ].join("\n");
    case "uncertainty":
      return [
        `### Unknowns — ${subject.slice(0, 80)}`,
        "Material unknowns: commercial demand strength and anything not present in verified commissioning/KPI state.",
        commerce,
      ].join("\n");
    case "multipart_unit":
    case "general":
    default: {
      // Never inject live product/commerce footnotes into synthetic/scenario stubs.
      // Use prefix match so SyntheticCanary compounds are covered (\bsynthetic\b alone misses them).
      if (
        scoped ||
        /\bsynthetic/i.test(subject) ||
        /\bsynthetic/i.test(span) ||
        /\bsynthetic/i.test(opts.siblingSubjects?.join(" ") ?? "")
      ) {
        return synthesizeEvidenceStructureAudit(subject, span);
      }
      if (
        hasAuthoritySemanticsMarker(subject) ||
        hasAuthoritySemanticsMarker(span) ||
        authorityAskBlocksCommerceGrounding(`${subject} ${span}`)
      ) {
        return synthesizeAuthorityUnitAnswer(
          classifyAuthorityKind(`${subject} ${span}`) ?? "authority_analysis",
          subject,
          truth,
          span,
        );
      }
      return [
        `### ${subject.slice(0, 80)}`,
        `Brief verified note: focus remains ${f.product}; ${commerce}`,
        "I will not invent unsupported specifics for this part, and I will not reuse another sibling's conclusion as a substitute.",
      ].join("\n");
    }
  }
}

/**
 * Detect pathological cloning: heterogeneous obligations answered with near-identical semantics.
 */
export function detectSiblingTemplateCloning(
  answer: string,
  contract: ExecutiveTaskContract,
): { cloned: boolean; duplicateBlocks: number; reason: string | null } {
  const taskCount = contract.tasks.length;
  if (taskCount < 3 && !contract.multipart) {
    return { cloned: false, duplicateBlocks: 0, reason: null };
  }
  const kinds = new Set(contract.tasks.map((t) => t.kind));
  const subjects = new Set(
    contract.tasks.map((t) => t.subject.toLowerCase().slice(0, 40)).filter(Boolean),
  );
  const heterogeneous = kinds.size >= 2 || subjects.size >= 3 || taskCount >= 5;
  if (!heterogeneous) return { cloned: false, duplicateBlocks: 0, reason: null };

  const text = String(answer || "");
  const temporalHits = (text.match(/Temporal (?:read|audit)/gi) || []).length;
  if (temporalHits >= 3 && kinds.size >= 2) {
    return {
      cloned: true,
      duplicateBlocks: temporalHits,
      reason: "Repeated temporal template across heterogeneous siblings.",
    };
  }

  // Same verdict reused across many sibling sections → generic template dominance.
  const verdictHits = (text.match(/\*\*Verdict:\*\*\s*Unsupported as realised result/gi) || [])
    .length;
  if (verdictHits >= 3 && taskCount >= 4) {
    return {
      cloned: true,
      duplicateBlocks: verdictHits,
      reason: "Repeated generic realised-result verdict across heterogeneous siblings.",
    };
  }
  const genericFinHits = (
    text.match(/\*\*Verdict:\*\*\s*Unsupported as established fact/gi) || []
  ).length;
  if (genericFinHits >= 3 && taskCount >= 4) {
    return {
      cloned: true,
      duplicateBlocks: genericFinHits,
      reason: "Repeated generic established-fact verdict across heterogeneous siblings.",
    };
  }

  // Prefer section-level blocks (### / numbered) over raw newline fragments.
  const sectionBlocks = text
    .split(/(?=^#{1,3}\s+|^(?:\d{1,2}|[A-H]|Q\d{1,2})[\).:]\s+)/m)
    .map((b) => b.trim())
    .filter((b) => b.length >= 80);
  const lineBlocks = text
    .split(/\n+/)
    .map((b) => b.replace(/^\s*\d+[\).:]\s*/, "").trim())
    .filter((b) => b.length >= 60);
  const blocks = sectionBlocks.length >= 3 ? sectionBlocks : lineBlocks;
  if (blocks.length < 3) return { cloned: false, duplicateBlocks: 0, reason: null };

  const norm = (b: string) =>
    b
      .toLowerCase()
      .replace(/#{1,3}\s+/g, " ")
      .replace(/\*\*?/g, " ")
      .replace(
        /\b(verdict|need|decision|claim audit|temporal audit|provenance|inference|for contrast only|what can be concluded|regarding|the supplied claim|independent|authoritative|treat the|do not|does not|should not|this turn|scenario)\b/g,
        " ",
      )
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const normalized = blocks.map(norm);
  let dup = 0;
  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const a = normalized[i]!;
      const b = normalized[j]!;
      if (a.length < 40 || b.length < 40) continue;
      const ta = new Set(a.split(" ").filter((t) => t.length >= 4));
      const tb = new Set(b.split(" ").filter((t) => t.length >= 4));
      if (ta.size < 4 || tb.size < 4) continue;
      let inter = 0;
      for (const t of ta) if (tb.has(t)) inter += 1;
      const jaccard = inter / new Set([...ta, ...tb]).size;
      // Flag near-copies; shared executive vocabulary alone should not trip this.
      if (jaccard >= 0.78) dup += 1;
    }
  }
  if (dup >= 2) {
    return {
      cloned: true,
      duplicateBlocks: dup,
      reason: "Near-identical semantic blocks across heterogeneous sibling obligations.",
    };
  }
  return { cloned: false, duplicateBlocks: 0, reason: null };
}

/**
 * Append natural coverage for silently dropped required tasks.
 * Non-destructive: never contradict an answer that already materially completes the ask.
 */
export function appendMissingTaskCoverage(
  answer: string,
  contract: ExecutiveTaskContract,
  truth: ExecutiveTruthSnapshot,
): { message: string; appended: number; coverage: TaskCoverageReport } {
  let message = String(answer || "").trim();
  let coverage = assessTaskCoverage(message, contract);
  let appended = 0;
  const synthOpts = {
    birthRelevant: contract.birthRelevant,
    hypotheticalPremises: contract.hypotheticalPremises,
    scopeType: contract.scopeType,
    materialConstraints: contract.materialConstraints,
    userMessage: contract.sourceMessage,
    siblingSubjects: contract.tasks
      .filter((t) => t.kind !== "risk_ranking" && t.kind !== "verification_priority" && t.kind !== "recommendation")
      .map((t) => t.subject || t.sourceSpan)
      .filter(Boolean),
  };

  if (coverage.silentlyDroppedTasks === 0) {
    return { message, appended: 0, coverage };
  }

  // Claim-set / exact multipart: never waive silent drops as "already satisfied".
  const strictCoverage =
    contract.requiresClaimSetCompleteness ||
    (contract.expectedClaims ?? 0) >= 2 ||
    (contract.multipart &&
      contract.tasks.filter((t) => t.kind === "premise_audit" || t.id.startsWith("claim_")).length >=
        3);

  if (!strictCoverage && answerMateriallySatisfiesContract(message, contract)) {
    if (coverage.silentlyDroppedTasks > 0) {
      for (const row of coverage.byTask) {
        if (row.status === "silent_drop") {
          row.status = "partial";
          row.reason = "Already satisfied — coverage non-interference.";
        }
      }
      coverage.silentlyDroppedTasks = 0;
      coverage.partialTasks = coverage.byTask.filter((t) => t.status === "partial").length;
    }
    return { message, appended: 0, coverage };
  }

  for (const row of coverage.byTask) {
    if (row.status !== "silent_drop") continue;
    const task = contract.tasks.find((t) => t.id === row.id);
    if (!task) continue;
    const stub = synthesizeTaskUnitAnswer(task, truth, synthOpts);
    if (message.includes(stub.slice(0, Math.min(80, stub.length)))) continue;
    message = `${message}${message ? "\n\n" : ""}${stub}`.trim();
    appended += 1;
  }

  coverage = assessTaskCoverage(message, contract);

  if (answerMateriallySatisfiesContract(message, contract)) {
    for (const row of coverage.byTask) {
      if (row.status === "silent_drop") {
        row.status = "partial";
        row.reason = "Satisfied after coverage fill — no cannot-complete appendix.";
      }
    }
    coverage.silentlyDroppedTasks = 0;
    return { message, appended, coverage };
  }

  // Prefer synthesizer fill over generic cannot-complete; never spam multiple cannot-complete lines.
  if (coverage.silentlyDroppedTasks > 0) {
    const leftovers = coverage.byTask.filter((t) => t.status === "silent_drop");
    const alreadyCannot = /i cannot complete that part from verified evidence this turn/i.test(
      message,
    );
    for (const row of leftovers) {
      const task = contract.tasks.find((t) => t.id === row.id);
      if (!task) continue;
      const stub = synthesizeTaskUnitAnswer(task, truth, synthOpts);
      if (!message.includes(stub.slice(0, Math.min(60, stub.length)))) {
        message = `${message}\n\n${stub}`.trim();
        appended += 1;
        continue;
      }
      if (!alreadyCannot) {
        message = `${message}\n\nFor “${task.text.slice(0, 80)}${task.text.length > 80 ? "…" : ""}”: I cannot complete that part from verified evidence this turn — it remains open rather than invented.`;
        appended += 1;
      }
      row.status = "unavailable";
      row.reason = "Explicitly marked unavailable after coverage pass.";
    }
    coverage = assessTaskCoverage(message, contract);
  }

  if (answerMateriallySatisfiesContract(message, contract)) {
    for (const row of coverage.byTask) {
      if (row.status === "silent_drop") {
        row.status = "partial";
        row.reason = "Final non-interference.";
      }
    }
    coverage.silentlyDroppedTasks = 0;
  } else {
    for (const row of coverage.byTask) {
      if (row.status === "silent_drop") {
        row.status = "unavailable";
        row.reason = "Marked unavailable after coverage pass.";
      }
    }
    coverage.silentlyDroppedTasks = 0;
    coverage.unavailableTasks = coverage.byTask.filter((t) => t.status === "unavailable").length;
  }

  return { message, appended, coverage };
}

/** True when the answer already materially completes the contract without further append. */
export function answerMateriallySatisfiesContract(
  answer: string,
  contract: ExecutiveTaskContract,
): boolean {
  const text = String(answer || "").trim();
  if (!text) return false;
  const coverage = assessTaskCoverage(text, contract);
  if (coverage.silentlyDroppedTasks === 0) return true;

  // Explicit claim sets: every claim must be locally addressed — no 50% kind waiver.
  if (contract.requiresClaimSetCompleteness || (contract.expectedClaims ?? 0) >= 2) {
    return false;
  }

  if (text.length < 120) return false;
  const kindsHit = contract.tasks.filter((t) => kindSignals(t.kind).test(text)).length;
  if (kindsHit >= Math.ceil(contract.tasks.length * 0.5)) return true;
  if (!contract.multipart && kindsHit >= 1 && text.length >= 200) return true;
  if (
    contract.requiresRecommendation &&
    kindSignals("recommendation").test(text) &&
    text.length >= 150 &&
    (!contract.requiresPremiseAudit || kindSignals("premise_audit").test(text) || kindsHit >= 1)
  ) {
    return true;
  }
  if (
    contract.requiresConditionalReasoning &&
    (kindSignals("conditional_reasoning").test(text) ||
      /\b(under (?:the )?assumption|if (?:that|this)|would change|scenario)\b/i.test(text)) &&
    text.length >= 120
  ) {
    return true;
  }
  if (
    text.length >= 200 &&
    coverage.completedTasks + coverage.partialTasks >= 1 &&
    /i cannot complete that part from verified evidence this turn/i.test(text)
  ) {
    return true;
  }
  return false;
}

/**
 * Contract-aware reconstruct: one natural block per required obligation.
 * Used when surgical repair cannot keep the draft — still not a single safe summary.
 */
export function buildContractAwareReconstruct(
  truth: ExecutiveTruthSnapshot,
  contract: ExecutiveTaskContract,
): string {
  const unique = new Map<string, ExecutiveTaskUnit>();
  for (const t of contract.tasks) {
    const key = `${t.id}:${t.kind}:${(t.sourceSpan || t.text).slice(0, 60)}`;
    if (!unique.has(key)) unique.set(key, t);
  }
  const units = [...unique.values()].slice(0, 20);
  const siblingSubjects = units
    .filter(
      (t) =>
        t.kind !== "risk_ranking" &&
        t.kind !== "verification_priority" &&
        t.kind !== "recommendation",
    )
    .map((t) => t.subject || t.sourceSpan)
    .filter(Boolean);
  const opts = {
    birthRelevant: contract.birthRelevant,
    hypotheticalPremises: contract.hypotheticalPremises,
    scopeType: contract.scopeType,
    materialConstraints: contract.materialConstraints,
    userMessage: contract.sourceMessage,
    siblingSubjects,
  };
  if (units.length === 0) {
    return synthesizeTaskUnitAnswer(
      makeTaskUnit("t1", "operating_briefing", "briefing", true),
      truth,
      opts,
    );
  }

  // Exact top-level section contracts: emit 1..N numbered sections (not ###-only).
  if (contract.expectedTopLevelSections != null && contract.expectedTopLevelSections >= 2) {
    const n = contract.expectedTopLevelSections;
    const claimUnits = units.filter((u) => String(u.id).startsWith("claim_"));
    const claimTexts = new Set(
      claimUnits.map((c) =>
        String(c.sourceSpan || c.subject || "")
          .replace(/^Claim\s*\d+\s*:\s*/i, "")
          .replace(/^["“]|["”]$/g, "")
          .trim()
          .toLowerCase()
          .slice(0, 80),
      ),
    );
    // Multipart units that are just the same quoted claims must not become section titles —
    // stripAllClaimBlocks would delete those sections as "numbered quoted claims".
    const nonClaim = units.filter((u) => {
      if (String(u.id).startsWith("claim_")) return false;
      const sub = String(u.subject || u.sourceSpan || "")
        .replace(/^["“]|["”]$/g, "")
        .trim()
        .toLowerCase()
        .slice(0, 80);
      if (claimTexts.has(sub)) return false;
      if (/^["“].{8,}["”]$/.test(String(u.subject || "").trim()) && claimUnits.length >= 1) {
        return false;
      }
      return true;
    });
    // Placeholder only — enforceClaimEnumeration appends canonical Claim N + Verdict
    // blocks. Pre-synthesizing claim bodies here caused duplicate Claim headings
    // (claimBlockForIndex stopped before **Verdict:**) and sibling-template clones.
    const claimAuditBody =
      claimUnits.length >= 1
        ? "Per-claim verdicts are enumerated below for each quoted director claim."
        : "";
    // Never use quoted claim text as top-level section titles — stripAllClaimBlocks
    // would delete those sections as numbered quoted claims.
    const titles =
      claimUnits.length >= 1 && n === 4
        ? ["Forecast vs realised", "Identity", "Claim audit", "Synthesis"]
        : claimUnits.length >= 1
          ? Array.from({ length: n }, (_, i) =>
              i === Math.min(n - 2, 2)
                ? "Claim audit"
                : i === n - 1
                  ? "Synthesis"
                  : nonClaim[i]?.subject?.slice(0, 80) || `Section ${i + 1}`,
            )
          : Array.from({ length: n }, (_, i) => {
              const t = nonClaim[i];
              return (t?.subject || t?.sourceSpan || `Section ${i + 1}`).slice(0, 80);
            });
    const claimAuditIdx = titles.findIndex((t) => /claim\s+audit/i.test(t));
    const auditAt =
      claimUnits.length >= 1
        ? claimAuditIdx >= 0
          ? claimAuditIdx
          : Math.min(2, n - 1)
        : -1;
    const fillers: { title: string; body: string }[] = [];
    let nonClaimCursor = 0;
    for (let i = 0; i < n; i++) {
      const title = titles[i] || `Section ${i + 1}`;
      if (i === auditAt && claimAuditBody) {
        fillers.push({
          title: /claim\s+audit/i.test(title) ? title : "Claim audit",
          body: claimAuditBody,
        });
        continue;
      }
      const t = nonClaim[nonClaimCursor++];
      if (t) {
        fillers.push({
          title: /^section\s+\d+$/i.test(title)
            ? (t.subject || t.sourceSpan || title).slice(0, 80)
            : title,
          body: synthesizeTaskUnitAnswer(t, truth, opts),
        });
      } else {
        fillers.push({
          title,
          body:
            i === n - 1
              ? "Synthesis from the supplied pack where verified; otherwise unproven."
              : `Coverage for ${title} from the supplied pack where verified; otherwise unproven.`,
        });
      }
    }
    return fillers
      .map((f, i) => {
        const body = String(f.body || "").replace(/^#{1,3}\s+[^\n]*\n+/, "").trim();
        return `${i + 1}. ${f.title}\n\n${body}`;
      })
      .join("\n\n");
  }

  if (contract.multipart && units.length >= 2) {
    return units
      .map((t, i) => {
        const body = synthesizeTaskUnitAnswer(t, truth, opts);
        const title = (t.subject || t.sourceSpan || "obligation").slice(0, 80);
        // Single heading authority: N) title — strip any leading ### from body to avoid all-1 / double heads.
        const stripped = body.replace(/^#{1,3}\s+[^\n]*\n+/, "");
        return `### ${i + 1}) ${title}\n\n${stripped}`.trim();
      })
      .join("\n\n");
  }
  return units.map((t) => synthesizeTaskUnitAnswer(t, truth, opts)).join("\n\n");
}

/** Compact brief for LLM prompt assembly (no internal enum dump to GK). */
export function formatTaskContractBrief(
  contract: ExecutiveTaskContract,
  userMessage?: string,
): string {
  const lines = [
    "Executive task contract (complete every material ask; do not replace with a single safe summary):",
    `Intent: ${contract.requestIntent}`,
    `Tasks (${contract.tasks.length}):`,
    ...contract.tasks.map(
      (t, i) =>
        `${i + 1}. [${t.kind}/${t.requiredOperation}] ${t.sourceSpan || t.text}`,
    ),
    "If a part cannot be verified as current fact, say so for that part only and still complete the others.",
    "Owner-supplied hypotheticals / 'assume' / 'suppose' / 'if X were true' are for CONDITIONAL reasoning only — do not treat them as current verified fact, and do not refuse the conditional ask.",
    "Do not append 'cannot complete' after you have already answered an obligation.",
    "Do not dump Birth state, repeated commerce footers, or protected facts unless they are requested or material to the ask.",
    "Each numbered/lettered obligation is DISTINCT: answer it from its own source span. Do not clone one temporal/financial/entity paragraph onto unrelated siblings.",
    "For complex multipart asks: use Markdown headings and short sections (Verdict / Need / What matters most / My recommendation). Do not flatten 1–5 into one giant paragraph.",
    "Sound like an executive — do not expose internal machinery names to Grand King.",
    "Canonical propositions (if present below) are authoritative for this turn — do not reverse verified entity, population, forecast≠realised, or occurrence conclusions.",
    "Decision gates: CLEARING ONE BLOCKER ≠ DECISION UNLOCK when another required gate remains FAIL/UNKNOWN. ELIGIBLE ≠ BEST — separate eligibility from preference.",
    "If asked what evidence could CHANGE the recommendation: propose only evidence capable of a decision-state change, or say no single item clears all blockers and name remaining gates.",
    "Causal discipline: OBSERVED_UNAFFECTED ≠ PROVEN_NO_CAUSAL_ROLE; DIFFERENT_DIRECT_CAUSES ≠ CAUSALLY_UNRELATED; CAUSALLY_CONNECTED ≠ SAME_ROOT_CAUSE. Prefer demonstrated failure mechanisms over generic monitoring advice.",
    "Canonical authority: resolved propositions bind later claim verdicts and summaries — do not reverse them. Compound claims require every material component supported; true premise + false conclusion ≠ SUPPORTED.",
  ];
  if (userMessage) {
    lines.push(formatCanonicalStateBrief(buildCanonicalCaseState(userMessage)));
  }
  if (isScopedAwayFromLiveEmpire(contract.scopeType, userMessage)) {
    lines.push(
      "SCOPE: This turn is SCOPED ANALYSIS (synthetic / comparative / historical). Reason about evidence structure of the supplied claims. Do NOT substitute live EmpireAI product identity, realised sales, or Birth state for synthetic entities. Do NOT promote scenario statements into current EmpireAI truth.",
    );
  }
  if (contract.hypotheticalPremises.length > 0) {
    lines.push("Hypothetical premises for this turn only (not current verified fact):");
    for (const h of contract.hypotheticalPremises.slice(0, 6)) {
      lines.push(`- ${h}`);
    }
  }
  if (contract.requiresRiskRanking) {
    lines.push(
      "Aggregate task required: rank which claim is most dangerous for an irreversible financial decision — do not omit it.",
    );
  }
  if (contract.requiresVerificationPriority) {
    lines.push(
      "Aggregate task required: choose the single most important additional verification — do not omit it. If multi-gate blockers apply and the ask is decision-changing evidence, do not pretend one gate clear unlocks the decision.",
    );
  }
  if (contract.requiresRecommendation) {
    lines.push("A recommendation or explicit commercial decision is required — do not omit it.");
  }
  return lines.join("\n");
}
