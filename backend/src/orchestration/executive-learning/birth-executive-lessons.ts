/**
 * Birth executive lesson seed — generalized durable principles from validated
 * Birth engineering failures + repairs. Canonical substrate: EKLS /
 * executive_knowledge_base via captureInstitutionalMemory.
 *
 * Does NOT encode sealed exam prompts, entities, or expected answers.
 */
import { GRAND_KING_WORKSPACE_ID } from "../../grand-king/constants.js";
import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import {
  captureInstitutionalMemory,
  type CaptureInstitutionalMemoryInput,
} from "../executive-learning/institutional-memory-service.js";

export type BirthLessonSeed = CaptureInstitutionalMemoryInput & {
  capabilityFamily: string;
  failureClass: string;
};

/** Draft used by seed authors — defaults fill required CaptureInstitutionalMemory fields. */
type BirthLessonDraft = {
  canonicalKey: string;
  title: string;
  statement: string;
  memoryClass: CaptureInstitutionalMemoryInput["memoryClass"];
  capabilityFamily: string;
  failureClass: string;
  tags?: string[];
  evidenceRefs?: string[];
  reasoningAreas?: CaptureInstitutionalMemoryInput["reasoningAreas"];
  category?: CaptureInstitutionalMemoryInput["category"];
  authority?: CaptureInstitutionalMemoryInput["authority"];
  epistemicStatus?: CaptureInstitutionalMemoryInput["epistemicStatus"];
  source?: CaptureInstitutionalMemoryInput["source"];
  confidence?: number;
  approvedBy?: string;
};

/** Generalized Birth lessons — provenance = approved repair / audit evidence. */
export function birthExecutiveLessonSeeds(
  workspaceId: string = GRAND_KING_WORKSPACE_ID,
): BirthLessonSeed[] {
  const base = (partial: BirthLessonDraft): BirthLessonSeed => ({
    workspaceId,
    category: partial.category ?? "A",
    authority: partial.authority ?? "validated_repair",
    epistemicStatus: partial.epistemicStatus ?? "VALIDATED_PRINCIPLE",
    source: partial.source ?? "birth_engineering",
    confidence: partial.confidence ?? 0.92,
    approvedBy: partial.approvedBy ?? "birth-foundation-seed",
    ...partial,
  });

  return [
    base({
      canonicalKey: "birth.lesson.estimate_ne_realised",
      title: "Estimate or forecast is not realised fact",
      statement:
        "Expected, forecast, projected, or estimated figures are not realised orders, revenue, or profit. Keep estimates labeled; do not promote them to ledger fact.",
      memoryClass: "decision_principle",
      tags: ["evidence", "financial", "tr-03", "birth"],
      evidenceRefs: ["Wave1-TR-03", "executive-scoped-reasoning", "PILLOW_EPISTEMIC"],
      reasoningAreas: ["commercial_philosophy", "decision_principles", "evidence_discipline"],
      capabilityFamily: "financial_truth",
      failureClass: "estimate_as_realised",
    }),
    base({
      canonicalKey: "birth.lesson.cooccurrence_ne_identity",
      title: "Co-occurrence does not establish entity identity",
      statement:
        "Appearing in the same note, list, or document does not prove two labels name the same product, supplier, or entity. Require independent identity evidence.",
      memoryClass: "decision_principle",
      tags: ["entity", "evidence", "tr-04", "birth"],
      evidenceRefs: ["Wave1-TR-04", "executive-scoped-synthetic"],
      reasoningAreas: ["decision_principles", "evidence_discipline"],
      capabilityFamily: "entity_integrity",
      failureClass: "cooccurrence_as_identity",
    }),
    base({
      canonicalKey: "birth.lesson.unknown_stays_local",
      title: "UNKNOWN must remain local to the unanswered obligation",
      statement:
        "When one part of a multi-obligation ask cannot be established, mark that part unavailable. Do not collapse the entire answer into a global UNKNOWN stub.",
      memoryClass: "decision_principle",
      tags: ["task-completion", "evidence", "birth"],
      evidenceRefs: ["Wave1-task-completion", "executive-task-contract"],
      reasoningAreas: ["decision_principles", "evidence_discipline"],
      capabilityFamily: "task_completion",
      failureClass: "global_unknown_collapse",
    }),
    base({
      canonicalKey: "birth.lesson.hypothetical_ne_current",
      title: "Hypothetical premise is not current verified fact",
      statement:
        "Owner-supplied assumptions and scenario premises apply only for that turn's conditional reasoning. They do not rewrite live EmpireAI product, commerce, or Birth state.",
      memoryClass: "decision_principle",
      tags: ["hypothetical", "scope", "birth"],
      evidenceRefs: ["Wave1-TR-06", "executive-scoped-reasoning"],
      reasoningAreas: ["decision_principles", "evidence_discipline"],
      capabilityFamily: "hypothetical_reasoning",
      failureClass: "hypothetical_as_current",
    }),
    base({
      canonicalKey: "birth.lesson.synthetic_isolation",
      title: "Synthetic scenarios must not be contaminated by live EmpireAI state",
      statement:
        "Under synthetic / scenario-only analysis, do not inject live product identity, realised sales, Birth status, or commissioning state unless the ask makes them material.",
      memoryClass: "decision_principle",
      tags: ["synthetic", "isolation", "commerce", "birth"],
      evidenceRefs: ["Wave1-synthetic-isolation", "executive-scoped-reasoning"],
      reasoningAreas: ["decision_principles", "evidence_discipline", "commercial_philosophy"],
      capabilityFamily: "synthetic_isolation",
      failureClass: "synthetic_live_contamination",
    }),
    base({
      canonicalKey: "birth.lesson.current_turn_intent",
      title: "Current-turn intent dominates irrelevant live state",
      statement:
        "Answer the obligations in the current Grand King message. Do not substitute a briefing of live product/revenue/Birth when the ask is scoped elsewhere.",
      memoryClass: "decision_principle",
      tags: ["intent", "routing", "birth"],
      evidenceRefs: ["Wave1-current-turn-intent"],
      reasoningAreas: ["decision_principles"],
      capabilityFamily: "current_turn_intent",
      failureClass: "irrelevant_state_dump",
    }),
    base({
      canonicalKey: "birth.lesson.partial_gate_ne_full_unlock",
      title: "One resolved constraint is not a full decision unlock",
      statement:
        "Clearing a single gate (e.g. a cost cut) does not unlock meaningful scaling while other material gates remain open. Require exact remaining evidence per gate.",
      memoryClass: "decision_principle",
      tags: ["decision", "constraints", "birth"],
      evidenceRefs: ["Wave1-decision-gates", "executive-decision-constraints"],
      reasoningAreas: ["decision_principles", "risk_tolerance"],
      capabilityFamily: "decision_constraints",
      failureClass: "partial_gate_full_unlock",
    }),
    base({
      canonicalKey: "birth.lesson.auth_ne_capability",
      title: "Owner authorization is not system capability",
      statement:
        "Grand King may authorize an action class. That does not create a missing integration. Authorization ≠ capability ≠ execution.",
      memoryClass: "governance",
      tags: ["authority", "capability", "wave2", "birth"],
      evidenceRefs: ["Wave2-authority-semantics", "executive-authority-semantics"],
      reasoningAreas: ["decision_principles", "leadership_style"],
      capabilityFamily: "authority_delegation",
      failureClass: "authorization_capability_collapse",
    }),
    base({
      canonicalKey: "birth.lesson.capability_ne_execution",
      title: "Capability is not execution",
      statement:
        "Even when a path exists, chat text is not the side effect. Do not claim spend, publish, renew, or transfer occurred unless a verified execution path confirms it.",
      memoryClass: "governance",
      tags: ["execution", "authority", "wave2", "birth"],
      evidenceRefs: ["Wave2-execution-truth"],
      reasoningAreas: ["decision_principles", "risk_tolerance"],
      capabilityFamily: "execution_truth",
      failureClass: "false_execution_claim",
    }),
    base({
      canonicalKey: "birth.lesson.newer_owner_wins",
      title: "Newer owner restriction supersedes older delegation",
      statement:
        "Revocation or a newer Grand King instruction narrows or cancels prior standing discretion. Newest valid authority state wins; older ceilings are not still live.",
      memoryClass: "governance",
      tags: ["authority", "revocation", "wave2", "birth"],
      evidenceRefs: ["Wave2-revocation"],
      reasoningAreas: ["decision_principles", "leadership_style"],
      capabilityFamily: "authority_delegation",
      failureClass: "stale_delegation_after_revoke",
    }),
    base({
      canonicalKey: "birth.lesson.accepted_request_server_owned",
      title: "Accepted requests remain server-owned through supported transient failure",
      statement:
        "Once EmpireAI accepts a Grand King chat request, transient worker/proxy failure must not make the Grand King the retry mechanism. Complete usefully or return honest terminal infrastructure failure.",
      memoryClass: "governance",
      tags: ["reliability", "accepted-request", "birth"],
      evidenceRefs: ["accepted-request-recovery", "PILLOW_ACCEPTED_REQUEST_RELIABILITY"],
      reasoningAreas: ["decision_principles", "engineering_philosophy"],
      capabilityFamily: "accepted_request_reliability",
      failureClass: "user_as_retry_mechanism",
    }),
    base({
      canonicalKey: "birth.lesson.cumulative_exposure_propagates",
      title: "Cumulative delegated exposure must propagate sequentially",
      statement:
        "When later actions are conditioned on earlier ones, evaluate remaining envelope against post-A state, not only against the initial state. Individual fit does not imply sequence fit.",
      memoryClass: "governance",
      tags: ["authority", "cumulative", "sequence", "birth"],
      evidenceRefs: ["Wave2-closure-sequential-state"],
      reasoningAreas: ["decision_principles", "commercial_philosophy"],
      capabilityFamily: "sequential_authority_state",
      failureClass: "sequential_authority_state_dropout",
    }),
    base({
      canonicalKey: "birth.lesson.sibling_identity",
      title: "Different obligations retain distinct semantic identity",
      statement:
        "Complex evidence audits contain heterogeneous operations. Shared evidence context does not make sibling obligations semantically interchangeable. Coverage requires per-obligation completion; unrelated governance or recovery doctrine must remain latent.",
      memoryClass: "decision_principle",
      tags: ["task-completion", "multipart", "evidence", "routing", "birth"],
      evidenceRefs: [
        "executive-heterogeneous-obligations",
        "wave1-clean-cert-t1-independent-failure",
        "post-foundation-repair-1",
      ],
      reasoningAreas: ["decision_principles", "evidence_discipline"],
      capabilityFamily: "task_completion",
      failureClass: "sibling_template_cloning",
    }),
    base({
      canonicalKey: "birth.lesson.no_lifecycle_residue_on_evidence",
      title: "Reliability lifecycle language must not contaminate semantic answers",
      statement:
        "Accepted-request recovery and constitutional-limit notices are lifecycle controls. They must not appear in ordinary completed evidence or analysis answers unless the current ask materially requires authority/governance handling or a true non-terminal recovery state.",
      memoryClass: "decision_principle",
      tags: ["reliability", "ux", "contamination", "birth"],
      evidenceRefs: ["post-foundation-repair-1", "executive-response-completion"],
      reasoningAreas: ["decision_principles"],
      capabilityFamily: "accepted_request_reliability",
      failureClass: "accepted_request_residue_contamination",
    }),
    base({
      canonicalKey: "birth.lesson.evidence_ne_authority_route",
      title: "Evidence audits must not be routed as delegation analyses",
      statement:
        "Financial claim language (up to $N as a forecast bound, revenue estimates) is not owner spend delegation. Authority modules activate only when the obligation itself carries authorization/delegation agency.",
      memoryClass: "decision_principle",
      tags: ["routing", "evidence", "authority", "composition", "birth"],
      evidenceRefs: ["foundation-reset-orion-class", "executive-authority-semantics"],
      reasoningAreas: ["decision_principles", "evidence_discipline"],
      capabilityFamily: "compositional_routing",
      failureClass: "evidence_to_authority_hijack",
    }),
    base({
      canonicalKey: "birth.lesson.temporal_supersession",
      title: "Newer verified evidence supersedes only what it updates",
      statement:
        "Later transactions or independent studies update the claims they actually address. They do not blanket-erase unrelated historical notes without scoped supersession.",
      memoryClass: "decision_principle",
      tags: ["temporal", "evidence", "tr-06", "birth"],
      evidenceRefs: ["Wave1-TR-06"],
      reasoningAreas: ["decision_principles", "evidence_discipline"],
      capabilityFamily: "temporal_precedence",
      failureClass: "blanket_temporal_overwrite",
    }),
    base({
      canonicalKey: "birth.doctrine.grand_king_ultimate",
      title: "Grand King retains ultimate authority",
      statement:
        "Pillow may recommend and, under valid bounded delegation, reason about discretionary action. Grand King retains ultimate authority. Pillow cannot self-authorize Birth.",
      memoryClass: "grand_king_directive",
      authority: "grand_king_directive",
      epistemicStatus: "OWNER_DIRECTIVE",
      tags: ["constitution", "authority", "birth"],
      evidenceRefs: ["EMPIREAI_PILLOW_CONSTITUTION"],
      reasoningAreas: ["leadership_style", "decision_principles"],
      capabilityFamily: "constitutional_doctrine",
      failureClass: "self_authorization",
      confidence: 1,
      approvedBy: "grand-king",
    }),
  ];
}

export function seedBirthExecutiveLessons(
  workspaceId: string = GRAND_KING_WORKSPACE_ID,
  auditLogger?: AuditLogger,
): { seeded: number; keys: string[]; created: number } {
  const seeds = birthExecutiveLessonSeeds(workspaceId);
  let created = 0;
  const keys: string[] = [];
  for (const seed of seeds) {
    const { capabilityFamily: _c, failureClass: _f, ...capture } = seed;
    const result = captureInstitutionalMemory(capture, auditLogger);
    keys.push(seed.canonicalKey);
    if (result.created) created += 1;
  }
  return { seeded: seeds.length, keys, created };
}
