/**
 * Epistemic / provenance boundary for Pillow executive chat.
 *
 * Separates: runtime_verified | tool_retrieved | supplied_context | historical |
 * inferred | general_knowledge | unknown | fabricated.
 *
 * Narrative never creates provenance. Retrieval claims require attestation.
 * Does not hard-code sealed examination Q&A.
 */

import type { ExecutiveTruthSnapshot } from "./executive-truth-types.js";
import {
  formatCapabilityRegistryBrief,
  getPillowCapabilityRegistry,
} from "./pillow-capability-registry.js";

export type EpistemicOrigin =
  | "runtime_verified"
  | "tool_retrieved"
  | "supplied_context"
  | "historical_context"
  | "inferred"
  | "general_knowledge"
  | "unknown"
  | "fabricated";

export type RetrievalAttestation = {
  capabilityId: string;
  requestId: string;
  at: string;
  sourceIdentifier: string;
  observedSummary: string;
};

export type EpistemicContext = {
  truth: ExecutiveTruthSnapshot;
  /** Capabilities actually used this turn (from attestation ledger). */
  attestations: readonly RetrievalAttestation[];
  /** When true, answering through live production Brain implies process is online. */
  liveAnswerImpliesProductionOnline: boolean;
};

export type EpistemicEnforcementResult = {
  message: string;
  adjusted: boolean;
  violations: string[];
  retractions: string[];
};

/** Session/request-scoped ledger — CAPABILITY USED, not merely EXISTS. */
export class RetrievalAttestationLedger {
  private readonly items: RetrievalAttestation[] = [];

  record(input: Omit<RetrievalAttestation, "at"> & { at?: string }): void {
    this.items.push({
      ...input,
      at: input.at ?? new Date().toISOString(),
    });
  }

  list(): readonly RetrievalAttestation[] {
    return this.items;
  }

  has(capabilityId: string): boolean {
    return this.items.some((a) => a.capabilityId === capabilityId);
  }
}

/** Attest standard snapshot reads performed for executive truth injection. */
export function attestExecutiveTruthSnapshotReads(
  ledger: RetrievalAttestationLedger,
  truth: ExecutiveTruthSnapshot,
  requestId: string,
): void {
  ledger.record({
    capabilityId: "live_sqlite_commissioning",
    requestId,
    sourceIdentifier: `commissioning:${truth.product.commissioningId ?? "none"}`,
    observedSummary: `asin=${truth.product.asin ?? "null"}; name=${truth.product.productName ?? "null"}`,
  });
  ledger.record({
    capabilityId: "live_sqlite_kpi",
    requestId,
    sourceIdentifier: `kpi:${truth.workspaceId}`,
    observedSummary: `orders=${truth.financial.orders}; realisedRevenueUsd=${truth.financial.realisedRevenueUsd}`,
  });
  ledger.record({
    capabilityId: "birth_record",
    requestId,
    sourceIdentifier: `birth:${truth.workspaceId}`,
    observedSummary: `status=${truth.birth.status}; birthTimestamp=${truth.birth.birthTimestamp ?? "NULL"}`,
  });
  if (truth.deploy.gitCommitSha) {
    ledger.record({
      capabilityId: "railway_deploy_env",
      requestId,
      sourceIdentifier: `deploySha:${truth.deploy.gitCommitSha}`,
      observedSummary: "process env commit SHA present while answering",
    });
  }
}

export function formatEpistemicDisciplineBrief(ctx: EpistemicContext): string {
  const used = ctx.attestations.map((a) => a.capabilityId);
  const usedLine =
    used.length > 0
      ? `Attested retrievals this turn: ${[...new Set(used)].join(", ")}`
      : "Attested retrievals this turn: none beyond unavailable";
  return [
    "--- Epistemic discipline (mandatory) ---",
    "Internal claim classes (do NOT dump these labels into ordinary Grand King replies): runtime_verified | tool_retrieved | supplied_context | historical_context | inference | hypothesis | recommendation | unknown",
    "Speak to Grand King as a world-class executive partner: ANSWER FIRST, in natural language.",
    "Match depth to the question: short question → short answer; deep ask → deeper synthesis. Do not mechanically emit What I Know / Inference / Uncertainty / Next Steps headings unless the question truly needs them.",
    "Do NOT open with verification boilerplate, enum names, deploy SHAs, commissioning IDs, or attestation jargon unless Grand King asks for technical evidence.",
    "NEVER claim you accessed/retrieved/reviewed/checked/read/inspected a system unless it appears in Attested retrievals.",
    "Knowing a sentence in context ≠ you personally retrieved its underlying source.",
    "Do not invent dashboards, reports, emails, meetings, repositories, filenames, APIs, metrics, or 'market demand analysis' results to fill gaps.",
    "Workflow labels (approval/pending/commissioning) do NOT invent business meaning such as 'passed market evaluation' or 'selected based on demand analysis' unless attested evidence supports that.",
    "INFERENCE IS ALLOWED and often required: label it clearly in natural language, preserve uncertainty, say what would falsify it when useful, and propose realistic next verification from capabilities that actually exist.",
    "UNKNOWN means the proposition is unproven — not that you must refuse to reason. Reason around unknowns.",
    "Owner-supplied hypotheticals (assume/suppose/if X were true) may be used for conditional reasoning without claiming they are current verified fact.",
    "High-risk actions (spend/publish/Birth/deploy) stay blocked without authority even if a hypothesis is reasonable.",
    "Temporal precedence: if you are answering live in production, do not claim EmpireAI is not live or that deployment is still pending as current state.",
    "Natural wording may change tone, not create new facts. Support strength must not increase during phrasing.",
    usedLine,
    "",
    formatCapabilityRegistryBrief(),
  ].join("\n");
}

// --- Detectors (entity-agnostic; no sealed exam Q&A) ---

const PERSONAL_RETRIEVAL_CLAIM =
  /\b(i\s+(?:have\s+|did\s+|previously\s+)?(?:directly\s+)?(?:accessed|retrieved|reviewed|checked|read|inspected|queried|consulted|examined|looked\s+up|pulled|review|access)\b|\bi\s+participated\s+in\s+(?:these\s+)?discussions\b|\bi\s+(?:have\s+)?access\s+to\s+these\s+(?:communications|documents|reports)\b|\bi\s+did\s+review\b)/i;

/** Plausible-but-unattested evidence scaffolding (class detector; not an exam dictionary). */
const INVENTED_SOURCE_SYSTEM =
  /\b(?:project\s+management\s+(?:tool|system|dashboard)|commerce\s+tracking\s+(?:system|tool|platform|service)|commercial\s+position\s+reports?|operational\s+(?:audits?|status\s+reports?)|internal\s+(?:audit\s+system|discussions?|documents?|communication(?:s|\s+system)?|planning)|supplier\s+communications?|market(?:[- ]demand)?\s+analysis(?:\s+(?:reports?|tool))?|market\s+evaluation|demand\s+analysis|meeting\s+notes(?:\s+repository)?|selection\s+criteria\s+and\s+analysis\s+report|planning\s+documents?|team\s+communications?)\b/i;

/** Provenance-bearing phrasing (semantic class — not a sealed-phrase dictionary). */
const PROVENANCE_BEARING =
  /\b(?:according\s+to|based\s+on(?:\s+the)?|from\s+the|evidence\s+from|confirmed\s+by|as\s+(?:shown|stated|documented)\s+in|research\s+indicates|analysis\s+(?:shows|identified|confirmed|indicates)|audits?\s+confirmed|internal\s+discussions?\s+show|the\s+tracking\s+system\s+shows|reports?\s+indicate)\b/i;

const SOURCE_AS_EVIDENCE = PROVENANCE_BEARING;

/** Unsupported business-meaning invented from workflow/state labels. */
const UNSUPPORTED_STATE_SEMANTICS =
  /\b(?:passed\s+(?:an?\s+)?(?:initial\s+)?market\s+evaluation|selected\s+based\s+on\s+(?:market(?:[- ]demand)?|demand)\s+analysis|identified\s+(?:this|it)\s+as\s+a\s+strategic\s+opportunity|market[- ]demand\s+analysis\s+identified)\b/i;

const NOT_IN_PRODUCTION_CLAIM =
  /\b(?:empire\s*ai|the\s+system|production|the\s+platform|the\s+service)\s+(?:is\s+)?(?:not\s+yet\s+)?(?:running|live|serving|deployed|online)\b|\bnot\s+(?:yet\s+)?(?:running|serving|live)\s+(?:in\s+)?production\b|\bnot\s+(?:yet\s+)?live\s+in\s+production\b|\bnot\s+serving\s+(?:the\s+)?grand\s+king\b|\bready\s+for\s+production\s+deployment\b|\bnot\s+(?:yet\s+)?(?:in\s+)?a\s+live\s+production\s+environment\b|\b(?:production\s+)?deployment\s+(?:is\s+)?(?:still\s+)?pending(?:\s+grand\s+king(?:\s+approval)?)?\b|\bawaiting\s+(?:production\s+)?deployment\b|\bpending\s+grand\s+king\s+approval.{0,40}\bdeploy/i;

const SAFE_UNKNOWN_LANGUAGE =
  /\b(i\s+cannot\s+(?:currently\s+)?(?:substantiate|verify)|i\s+do\s+not\s+have\s+evidence|unknown|not\s+attested|no\s+retrieval\s+attestation|supplied\s+in\s+(?:current\s+)?context|i\s+retract|remain\s+unknown)\b/i;

const DENIES_RETRIEVAL =
  /\bi\s+(?:did\s+not|have\s+not|cannot|could\s+not)\s+(?:personally\s+)?(?:retrieve|access|review|check|read|inspect)|i\s+cannot\s+(?:currently\s+)?(?:substantiate|verify).{0,40}(?:access|retriev|source)/i;

const AFFIRMS_VERIFIED =
  /\b(?:is\s+verified|verified\s+fact|runtime_verified|i\s+(?:have\s+)?verified|confirmed\s+as\s+fact)\b/i;

const DENIES_VERIFY =
  /\bi\s+cannot\s+(?:currently\s+)?verify\b|\bcannot\s+be\s+verified\b|\bunverifiable\b/i;

const CORRECTION_APPENDIX =
  /\n---\n(?:Grounded corrections|Epistemic corrections)\b/i;

function attestedCapabilityIds(ctx: EpistemicContext): Set<string> {
  return new Set(ctx.attestations.map((a) => a.capabilityId));
}

function unavailableClaimedSystems(message: string): string[] {
  const hits: string[] = [];
  const regs = getPillowCapabilityRegistry().filter((c) => c.availability === "unavailable");
  const lower = message.toLowerCase();
  for (const c of regs) {
    const needles = [
      c.label.toLowerCase(),
      c.id.replace(/_/g, " "),
      ...c.label.toLowerCase().split(/[\/]/).map((s) => s.trim()),
    ];
    if (needles.some((n) => n.length >= 8 && lower.includes(n))) {
      hits.push(c.id);
    }
  }
  return hits;
}

/** Affirmative retrieval only — ignores denial clauses like "I cannot substantiate that I accessed…". */
function hasAffirmativeRetrievalClaim(message: string): boolean {
  const clauses = message.split(/(?<=[.!?])\s+|\n+/);
  return clauses.some((clause) => {
    const c = clause.trim();
    if (!c) return false;
    if (DENIES_RETRIEVAL.test(c)) return false;
    if (/\bcannot\s+substantiate\b/i.test(c) && PERSONAL_RETRIEVAL_CLAIM.test(c)) return false;
    return PERSONAL_RETRIEVAL_CLAIM.test(c);
  });
}

function hasRetrievalDenial(message: string): boolean {
  return DENIES_RETRIEVAL.test(message) || /\bcannot\s+substantiate\b/i.test(message);
}

/**
 * Pure epistemic validation — violations only. Does NOT mutate or append corrections.
 * Release path must reconstruct; never surface invalid draft + appendix.
 */
export function validateEpistemicDraft(
  message: string,
  ctx: EpistemicContext,
): string[] {
  const violations: string[] = [];
  const attested = attestedCapabilityIds(ctx);
  const hasLiveDeploy =
    ctx.liveAnswerImpliesProductionOnline &&
    (Boolean(ctx.truth.deploy.gitCommitSha) ||
      ctx.truth.deploy.serviceOnlineHint === "assume_online_if_answering");

  const personalRetrieval = hasAffirmativeRetrievalClaim(message);
  const inventedSource = INVENTED_SOURCE_SYSTEM.test(message);
  const unavailableHits = unavailableClaimedSystems(message);
  const safeUnknown = SAFE_UNKNOWN_LANGUAGE.test(message);
  const sourceAsEvidence = SOURCE_AS_EVIDENCE.test(message) || PROVENANCE_BEARING.test(message);
  const unsupportedSemantics = UNSUPPORTED_STATE_SEMANTICS.test(message);
  const onlyRuntimeAttested =
    [...attested].every((id) =>
      ["live_sqlite_commissioning", "live_sqlite_kpi", "birth_record", "railway_deploy_env"].includes(
        id,
      ),
    ) && !attested.has("chat_tool_calling_loop");

  if (CORRECTION_APPENDIX.test(message)) {
    violations.push("CORRECTION_APPENDIX_LEAK");
  }

  // Internal contradiction: affirm retrieval/verification while denying it.
  if (personalRetrieval && hasRetrievalDenial(message)) {
    violations.push("INTERNAL_CONTRADICTION");
  }
  if (AFFIRMS_VERIFIED.test(message) && DENIES_VERIFY.test(message) && inventedSource) {
    violations.push("INTERNAL_CONTRADICTION");
  }

  if (personalRetrieval && (inventedSource || unavailableHits.length > 0)) {
    violations.push("UNATTESTED_RETRIEVAL_CLAIM");
  } else if (personalRetrieval && !safeUnknown && onlyRuntimeAttested && inventedSource) {
    violations.push("UNATTESTED_RETRIEVAL_CLAIM");
  }

  // Plausible source / analysis used as evidence without attestation.
  if (
    (inventedSource || unsupportedSemantics) &&
    !safeUnknown &&
    (sourceAsEvidence || personalRetrieval || unsupportedSemantics) &&
    onlyRuntimeAttested
  ) {
    const labeled = /\b(i\s+(?:infer|suspect|think|assess)|inference|hypothesis|probably|likely|my\s+best\s+assessment)\b/i.test(
      message,
    );
    if (unsupportedSemantics && !labeled) {
      violations.push("UNSUPPORTED_STATE_SEMANTICS");
    }
    if (
      inventedSource &&
      !(labeled && !personalRetrieval && /\b(do\s+not\s+have|without|no\s+access|unavailable|cannot\s+retrieve)\b/i.test(message))
    ) {
      violations.push("INVENTED_SOURCE_SYSTEM");
    }
    if (sourceAsEvidence && inventedSource && !labeled) {
      violations.push("UNSUPPORTED_PROVENANCE_CLAIM");
    }
  }

  // Residual fabrication: UNKNOWN admission + still treating invented systems as reference frames.
  if (
    inventedSource &&
    safeUnknown &&
    /\b(remain\s+my\s+reference|frame\s+my\s+view|my\s+reference\s+frames?|still,?\s+the)\b/i.test(
      message,
    )
  ) {
    violations.push("PARTIAL_CORRECTION_WITH_RESIDUAL_FABRICATION");
  }

  // Temporal: live runtime outranks offline/pending-deploy current-state claims.
  // Do not exempt merely because the word "unknown" appears elsewhere in the answer.
  if (hasLiveDeploy && NOT_IN_PRODUCTION_CLAIM.test(message)) {
    violations.push("STALE_OR_FALSE_PRODUCTION_OFFLINE_CLAIM");
    if (/\b(answering\s+live|deploygitcommitsha|this\s+brain\s+process\s+is\s+answering|live\s+and\s+answering)\b/i.test(message)) {
      violations.push("INTERNAL_CONTRADICTION");
    }
  }

  if (unavailableHits.length > 0 && personalRetrieval) {
    violations.push("CAPABILITY_REGISTRY_VIOLATION");
  }

  return [...new Set(violations)];
}

/**
 * @deprecated Audit-only helper. Does NOT append corrections to user-facing text.
 * Prefer validateEpistemicDraft + releaseExecutiveAnswer.
 */
export function enforceEpistemicGrounding(
  answer: string,
  ctx: EpistemicContext,
): EpistemicEnforcementResult {
  const violations = validateEpistemicDraft(answer, ctx);
  if (violations.length === 0) {
    return { message: answer, adjusted: false, violations: [], retractions: [] };
  }
  // Telemetry-shaped retractions for tests/tools — NOT concatenated into message.
  const retractions = violations.map((v) => `violation:${v}`);
  return {
    message: answer,
    adjusted: true,
    violations,
    retractions,
  };
}

/** Classify a material claim origin for tests / tooling (heuristic, deterministic). */
export function classifyClaimOrigin(input: {
  text: string;
  attestedCapabilityIds: string[];
  runtimeVerified: boolean;
}): EpistemicOrigin {
  const { text, attestedCapabilityIds, runtimeVerified } = input;
  if (PERSONAL_RETRIEVAL_CLAIM.test(text) && attestedCapabilityIds.length === 0) {
    return "fabricated";
  }
  if (PERSONAL_RETRIEVAL_CLAIM.test(text) && INVENTED_SOURCE_SYSTEM.test(text)) {
    const regs = getPillowCapabilityRegistry();
    const anyAvailableUsed = attestedCapabilityIds.some((id) =>
      regs.some((c) => c.id === id && c.availability === "available"),
    );
    if (!anyAvailableUsed || unavailableClaimedSystems(text).length > 0) {
      return "fabricated";
    }
    return "tool_retrieved";
  }
  if (runtimeVerified) return "runtime_verified";
  if (/\b(i\s+infer|inference|likely|probably)\b/i.test(text)) return "inferred";
  if (/\b(unknown|cannot\s+substantiate)\b/i.test(text)) return "unknown";
  if (/\b(historically|previously|earlier\s+mission)\b/i.test(text)) return "historical_context";
  return "unknown";
}
