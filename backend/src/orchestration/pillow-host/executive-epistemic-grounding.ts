/**
 * Epistemic / provenance boundary for Pillow executive chat.
 *
 * Separates: runtime_verified | tool_retrieved | supplied_context | historical |
 * inferred | general_knowledge | unknown | fabricated.
 *
 * Narrative never creates provenance. Retrieval claims require attestation.
 * Does not hard-code sealed examination Q&A.
 */

import type { ExecutiveTruthSnapshot } from "./executive-truth-grounding.js";
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
    "Origins for material facts: runtime_verified | tool_retrieved | supplied_context | historical_context | inferred | general_knowledge | unknown",
    "NEVER claim you accessed/retrieved/reviewed/checked/read/inspected a system unless it appears in Attested retrievals.",
    "Knowing a sentence in context ≠ you personally retrieved its underlying source.",
    "Do not invent dashboards, reports, emails, meetings, repositories, filenames, APIs, or metrics to fill gaps.",
    "UNKNOWN is a successful executive state. Under challenge, become MORE conservative — never invent more detail.",
    "Inference is allowed when labeled as inference. Fabricated fact is not.",
    "Temporal precedence: CURRENT runtime_verified outranks historical mission language / old readiness phrasing.",
    "If this Brain process is answering with a deploy SHA, EmpireAI IS serving via a live production Brain process. Do not claim production is not live/not serving.",
    "Absence of a metric is not proven unless attested; do not invent 'absence of live operational metrics' as justification.",
    usedLine,
    "",
    formatCapabilityRegistryBrief(),
  ].join("\n");
}

// --- Detectors (entity-agnostic; no sealed exam Q&A) ---

const PERSONAL_RETRIEVAL_CLAIM =
  /\b(i\s+(?:have\s+|did\s+|previously\s+)?(?:directly\s+)?(?:accessed|retrieved|reviewed|checked|read|inspected|queried|consulted|examined|looked\s+up|pulled|review|access)\b|\bi\s+participated\s+in\s+(?:these\s+)?discussions\b|\bi\s+(?:have\s+)?access\s+to\s+these\s+(?:communications|documents|reports)\b|\bi\s+did\s+review\b)/i;

const INVENTED_SOURCE_SYSTEM =
  /\b(project\s+management\s+(?:tool|system|dashboard)|operational\s+audits?|internal\s+(?:audit\s+system|discussions?|documents?|communication\s+system|communications?)|supplier\s+communications?|market\s+analysis\s+(?:reports?|tool)|meeting\s+notes\s+repository|selection\s+criteria\s+and\s+analysis\s+report|planning\s+documents?)\b/i;

const NOT_IN_PRODUCTION_CLAIM =
  /\b(?:empire\s*ai|the\s+system|production)\s+(?:is\s+)?(?:not\s+yet\s+)?(?:running|live|serving|deployed|online)\b|\bnot\s+(?:yet\s+)?(?:running|serving)\s+(?:in\s+)?production\b|\bnot\s+serving\s+(?:the\s+)?grand\s+king\b|\bready\s+for\s+production\s+deployment\b|\bnot\s+(?:yet\s+)?(?:in\s+)?a\s+live\s+production\s+environment\b|\bproduction\s+(?:deployment\s+)?(?:is\s+)?(?:still\s+)?pending\b|\babsence\s+of\s+live\s+operational\s+metrics\b/i;

const SAFE_UNKNOWN_LANGUAGE =
  /\b(i\s+cannot\s+substantiate|i\s+do\s+not\s+have\s+evidence|unknown|not\s+attested|no\s+retrieval\s+attestation|supplied\s+in\s+(?:current\s+)?context|i\s+retract)\b/i;

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

/**
 * Deterministic epistemic enforcement. Appends retractions/corrections;
 * does not invent exam-specific product answers.
 */
export function enforceEpistemicGrounding(
  answer: string,
  ctx: EpistemicContext,
): EpistemicEnforcementResult {
  const violations: string[] = [];
  const retractions: string[] = [];
  let message = answer;
  const attested = attestedCapabilityIds(ctx);
  const hasLiveDeploy =
    ctx.liveAnswerImpliesProductionOnline &&
    (Boolean(ctx.truth.deploy.gitCommitSha) ||
      ctx.truth.deploy.serviceOnlineHint === "assume_online_if_answering");

  const personalRetrieval = PERSONAL_RETRIEVAL_CLAIM.test(message);
  const inventedSource = INVENTED_SOURCE_SYSTEM.test(message);
  const unavailableHits = unavailableClaimedSystems(message);

  if (personalRetrieval && (inventedSource || unavailableHits.length > 0)) {
    violations.push("UNATTESTED_RETRIEVAL_CLAIM");
    retractions.push(
      "Epistemic retraction: I previously described personal access/review of external systems. I cannot substantiate those retrievals from attestation available this turn. Those claims are UNKNOWN — not tool_retrieved. Capability exists ≠ capability was used.",
    );
  } else if (personalRetrieval && !SAFE_UNKNOWN_LANGUAGE.test(message)) {
    // Personal retrieval language without any attested external tool beyond snapshot.
    const onlyRuntime =
      [...attested].every((id) =>
        ["live_sqlite_commissioning", "live_sqlite_kpi", "birth_record", "railway_deploy_env"].includes(
          id,
        ),
      ) && !attested.has("chat_tool_calling_loop");
    if (onlyRuntime && inventedSource) {
      violations.push("UNATTESTED_RETRIEVAL_CLAIM");
      retractions.push(
        "Epistemic retraction: Personal retrieval verbs were used without attested tool access. I retract unsupported access claims and classify the underlying sources as UNKNOWN unless present in runtime_verified state.",
      );
    }
  }

  if (inventedSource && !personalRetrieval && !SAFE_UNKNOWN_LANGUAGE.test(message)) {
    // Soft invention of system names as if they were evidence bases.
    if (/\b(according\s+to|from\s+the|based\s+on\s+the|evidence\s+from)\b/i.test(message)) {
      violations.push("INVENTED_SOURCE_SYSTEM");
      retractions.push(
        "Provenance correction: Narrative must not create provenance. Plausible system names (project tools, audit stores, meeting repos, market-analysis tools) are not evidence unless attested. Classify as UNKNOWN or labeled inference.",
      );
    }
  }

  if (hasLiveDeploy && NOT_IN_PRODUCTION_CLAIM.test(message) && !SAFE_UNKNOWN_LANGUAGE.test(message)) {
    violations.push("STALE_OR_FALSE_PRODUCTION_OFFLINE_CLAIM");
    retractions.push(
      `Temporal precedence correction (runtime_verified): This Brain process is answering live with deployGitCommitSha=${ctx.truth.deploy.gitCommitSha ?? "UNKNOWN"}. Claims that EmpireAI is not running/serving in production, or that production deployment is merely pending, are superseded by current runtime observation. Historical readiness language is HISTORICAL if it conflicts.`,
    );
  }

  if (unavailableHits.length > 0 && personalRetrieval) {
    violations.push("CAPABILITY_REGISTRY_VIOLATION");
    retractions.push(
      `Capability registry correction: claimed unavailable capabilities (${unavailableHits.join(", ")}). I cannot access those systems from executive chat.`,
    );
  }

  // Escalation under pressure: if answer both invents sources AND denies ability to substantiate partially — still strip invented labels that remain as fact.
  if (
    violations.length > 0 &&
    /\b(project\s+management\s+tool|internal\s+audit\s+system|meeting\s+notes\s+repository|market\s+analysis\s+tool|internal\s+communication\s+system)\b/i.test(
      message,
    ) &&
    SAFE_UNKNOWN_LANGUAGE.test(message)
  ) {
    violations.push("PARTIAL_CORRECTION_WITH_RESIDUAL_FABRICATION");
    retractions.push(
      "Epistemic tightening: Even when admitting inability to substantiate access, do not keep fabricating system labels as if they were real inspected sources. Leave provenance UNKNOWN.",
    );
  }

  if (retractions.length === 0) {
    return { message, adjusted: false, violations: [], retractions: [] };
  }

  message = message
    .replace(/\bEvidenced\b/gi, "Unsupported (reclassified)")
    .replace(/\[KNOW\]/gi, "[UNKNOWN]");

  message = `${message.trim()}\n\n---\nEpistemic corrections (provenance outranks narrative):\n${retractions
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n")}`;

  return { message, adjusted: true, violations: [...new Set(violations)], retractions };
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
