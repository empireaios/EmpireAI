/**
 * Institutional cumulative memory — completes EKLS/Executive Learning spine.
 * Capture → persist → retrieve → use in reasoning. Not chat transcripts.
 */
import { randomUUID } from "node:crypto";

import {
  selectRelevantInstitutionalKnowledge,
  type ExecutiveKnowledgeEntry,
  type InstitutionalMemoryClass,
  type LearningSource,
  type MemoryAuthority,
  type MemoryEpistemicStatus,
  type ReasoningArea,
} from "@empireai/pillow";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import { GRAND_KING_WORKSPACE_ID } from "../../grand-king/constants.js";
import { logger } from "../../config/logger.js";
import { SqliteExecutiveLearningRepository } from "./repository/sqlite-executive-learning-repository.js";

export type CaptureInstitutionalMemoryInput = {
  workspaceId: string;
  canonicalKey: string;
  title: string;
  statement: string;
  detail?: string;
  category?: ExecutiveKnowledgeEntry["category"];
  memoryClass: InstitutionalMemoryClass;
  authority: MemoryAuthority;
  epistemicStatus: MemoryEpistemicStatus;
  source?: LearningSource;
  confidence?: number;
  tags?: string[];
  evidenceRefs?: string[];
  linkedEntities?: Record<string, string>;
  reasoningAreas?: ReasoningArea[];
  approvedBy?: string;
  actor?: string;
  supersedeCanonicalKey?: string;
  outcomeLink?: ExecutiveKnowledgeEntry["outcomeLink"];
};

export type InstitutionalMemoryCaptureResult = {
  ok: boolean;
  created: boolean;
  updated: boolean;
  learningId: string | null;
  degraded?: string;
  entry: ExecutiveKnowledgeEntry | null;
};

let repository = new SqliteExecutiveLearningRepository();

export function resetInstitutionalMemoryRepository(): void {
  repository = new SqliteExecutiveLearningRepository();
}

function ensureRepo(): SqliteExecutiveLearningRepository {
  repository.ensureTables();
  return repository;
}

/** Persist a durable institutional memory unit into the Executive Knowledge Base. */
export function captureInstitutionalMemory(
  input: CaptureInstitutionalMemoryInput,
  auditLogger?: AuditLogger,
): InstitutionalMemoryCaptureResult {
  try {
    const repo = ensureRepo();
    const existing = repo.findApprovedByCanonicalKey(input.workspaceId, input.canonicalKey);
    if (existing) {
      return {
        ok: true,
        created: false,
        updated: false,
        learningId: existing.learningId,
        entry: existing,
      };
    }

    const now = new Date().toISOString();
    const learningId = randomUUID();
    const description = [
      input.statement,
      input.detail ? `Detail: ${input.detail}` : null,
      `Authority: ${input.authority}`,
      `Epistemic: ${input.epistemicStatus}`,
      `MemoryClass: ${input.memoryClass}`,
      input.evidenceRefs?.length ? `Evidence: ${input.evidenceRefs.join(" | ")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const entry: ExecutiveKnowledgeEntry = {
      learningId,
      workspaceId: input.workspaceId,
      title: input.title,
      category: input.category ?? (input.authority === "grand_king_directive" ? "A" : "B"),
      description,
      source: input.source ?? "system_seed",
      confidence: input.confidence ?? 0.95,
      discoveredAt: now,
      approvedAt: now,
      approvedBy: input.approvedBy ?? input.actor ?? "institutional-memory",
      status: "approved",
      supersededBy: null,
      reasoningAreas: input.reasoningAreas ?? ["commercial_philosophy", "decision_principles"],
      affectedReasoningAreas: input.reasoningAreas ?? ["commercial_philosophy", "decision_principles"],
      memoryClass: input.memoryClass,
      authority: input.authority,
      epistemicStatus: input.epistemicStatus,
      tags: input.tags ?? [],
      evidenceRefs: input.evidenceRefs ?? [],
      linkedEntities: input.linkedEntities ?? {},
      outcomeLink: input.outcomeLink,
      supersedes: null,
      canonicalKey: input.canonicalKey,
    };

    if (input.supersedeCanonicalKey) {
      const old = repo.findApprovedByCanonicalKey(input.workspaceId, input.supersedeCanonicalKey);
      if (old) {
        repo.supersedeKnowledge({
          workspaceId: input.workspaceId,
          oldLearningId: old.learningId,
          newKnowledge: entry,
        });
        auditLogger?.write({
          action: "pillow.learning.approve",
          actor: input.actor ?? "institutional-memory",
          workspaceId: input.workspaceId,
          correlationId: learningId,
          metadata: {
            institutional: true,
            supersedes: old.learningId,
            canonicalKey: input.canonicalKey,
          },
        });
        return { ok: true, created: true, updated: true, learningId, entry };
      }
    }

    repo.saveKnowledgeDirect(entry);
    auditLogger?.write({
      action: "pillow.learning.approve",
      actor: input.actor ?? "institutional-memory",
      workspaceId: input.workspaceId,
      correlationId: learningId,
      metadata: {
        institutional: true,
        canonicalKey: input.canonicalKey,
        memoryClass: input.memoryClass,
        authority: input.authority,
        epistemicStatus: input.epistemicStatus,
      },
    });
    return { ok: true, created: true, updated: false, learningId, entry };
  } catch (error) {
    const degraded = error instanceof Error ? error.message : String(error);
    logger.error({ error: degraded, canonicalKey: input.canonicalKey }, "Institutional memory capture failed");
    return {
      ok: false,
      created: false,
      updated: false,
      learningId: null,
      degraded,
      entry: null,
    };
  }
}

export function retrieveInstitutionalMemory(input: {
  workspaceId: string;
  tags?: string[];
  keywords?: string[];
  memoryClasses?: string[];
  limit?: number;
}): ExecutiveKnowledgeEntry[] {
  const repo = ensureRepo();
  const approved = repo.listApprovedKnowledge(input.workspaceId);
  return selectRelevantInstitutionalKnowledge(approved, input);
}

export function listInstitutionalMemory(workspaceId: string): ExecutiveKnowledgeEntry[] {
  return ensureRepo().listApprovedKnowledge(workspaceId);
}

export function linkOutcomeToMemory(input: {
  workspaceId: string;
  canonicalKey: string;
  outcomeLink: NonNullable<ExecutiveKnowledgeEntry["outcomeLink"]>;
  actor?: string;
}): ExecutiveKnowledgeEntry | null {
  const repo = ensureRepo();
  const existing = repo.findApprovedByCanonicalKey(input.workspaceId, input.canonicalKey);
  if (!existing) return null;
  const updated: ExecutiveKnowledgeEntry = {
    ...existing,
    outcomeLink: { ...(existing.outcomeLink ?? {}), ...input.outcomeLink },
    description: `${existing.description}\nOutcome: ${JSON.stringify(input.outcomeLink)}`,
  };
  // supersede with outcome-linked version under same key after archiving key uniqueness:
  // mark old superseded and write new with same canonicalKey
  const learningId = randomUUID();
  const next: ExecutiveKnowledgeEntry = {
    ...updated,
    learningId,
    approvedAt: new Date().toISOString(),
    approvedBy: input.actor ?? existing.approvedBy,
    supersedes: existing.learningId,
  };
  repo.supersedeKnowledge({
    workspaceId: input.workspaceId,
    oldLearningId: existing.learningId,
    newKnowledge: next,
  });
  return next;
}

/** Seed non-negotiable institutional memories that must exist from day one. Idempotent. */
export function seedInstitutionalMemoryBootstrap(
  workspaceId: string = GRAND_KING_WORKSPACE_ID,
  auditLogger?: AuditLogger,
): { seeded: number; keys: string[] } {
  const seeds: CaptureInstitutionalMemoryInput[] = [
    {
      workspaceId,
      canonicalKey: "gk.directive.first_dollar_dropshipping",
      title: "First-dollar dropshipping is the standing commerce objective",
      statement:
        "FIND AND PREPARE SAFE, PROFITABLE DROPSHIPPING OPPORTUNITIES FOR AMAZON US until first real buyable sale and profit.",
      category: "A",
      memoryClass: "grand_king_directive",
      authority: "grand_king_directive",
      epistemicStatus: "OWNER_DIRECTIVE",
      tags: ["commerce", "first-dollar", "objective", "grand-king"],
      evidenceRefs: ["FIRST-DOLLAR PILLOW COMMERCE ACTIVATION 001"],
      reasoningAreas: ["priorities", "commercial_philosophy", "decision_principles"],
      approvedBy: "grand-king",
    },
    {
      workspaceId,
      canonicalKey: "gk.directive.pillow_initiates_commerce",
      title: "Pillow initiates commerce; Grand King approves or rejects",
      statement:
        "Pillow must autonomously discover, analyse, reject unsuitable candidates, and surface only qualified recommendations. The Grand King role is APPROVE or REJECT — not product search or API operation.",
      category: "A",
      memoryClass: "grand_king_directive",
      authority: "grand_king_directive",
      epistemicStatus: "OWNER_DIRECTIVE",
      tags: ["commerce", "governance", "pillow", "grand-king"],
      evidenceRefs: ["FIRST-DOLLAR PILLOW COMMERCE ACTIVATION 001"],
      reasoningAreas: ["leadership_style", "decision_principles", "commercial_philosophy"],
      approvedBy: "grand-king",
    },
    {
      workspaceId,
      canonicalKey: "gk.directive.cursor_minimization",
      title: "Cursor is not the commerce operator",
      statement:
        "Cursor builds/repairs EmpireAI. Routine product discovery, analysis, qualification, recommendation, and approval workflow must not require Cursor.",
      category: "A",
      memoryClass: "grand_king_directive",
      authority: "grand_king_directive",
      epistemicStatus: "OWNER_DIRECTIVE",
      tags: ["cursor", "governance", "operations"],
      evidenceRefs: ["FIRST-DOLLAR PILLOW COMMERCE ACTIVATION 001"],
      reasoningAreas: ["engineering_philosophy", "decision_principles"],
      approvedBy: "grand-king",
    },
    {
      workspaceId,
      canonicalKey: "gk.directive.no_publish_without_approval",
      title: "No publication or supplier spend without Grand King approval",
      statement:
        "Do not publish Amazon offers or place supplier orders without explicit Grand King approval. No fabricated or implied approval.",
      category: "A",
      memoryClass: "grand_king_directive",
      authority: "grand_king_directive",
      epistemicStatus: "OWNER_DIRECTIVE",
      tags: ["governance", "approval", "commerce", "safety"],
      evidenceRefs: ["constitutional-approval", "pillow-commerce-presale"],
      reasoningAreas: ["decision_principles", "risk_tolerance", "commercial_philosophy"],
      approvedBy: "grand-king",
    },
    {
      workspaceId,
      canonicalKey: "commerce.lesson.accepted_ne_buyable",
      title: "Amazon ACCEPTED is not publicly BUYABLE",
      statement:
        "putListingsItem ACCEPTED does not mean the offer can receive customer orders. Verify post-publish commercial state. DISCOVERABLE + LISTING_SUPPRESSED / QUALIFICATION_REQUIRED is not success.",
      detail:
        "Proof 001 SKU EMP-PROOF-1786072434049 ASIN B088NRLMPV was ACCEPTED then suppressed (issue 18304 brand qualification).",
      category: "B",
      memoryClass: "commerce",
      authority: "marketplace_data",
      epistemicStatus: "FACT",
      source: "commerce_event",
      tags: ["commerce", "amazon", "buyable", "accepted", "restriction", "proof-001"],
      evidenceRefs: [
        "COMMERCE_PROOF_001_EVIDENCE.json",
        "COMMERCE_PROOF_001_LISTING_STATUS_EVIDENCE.json",
        "ASIN:B088NRLMPV",
        "issue:18304",
      ],
      linkedEntities: {
        asin: "B088NRLMPV",
        amazonSellerSku: "EMP-PROOF-1786072434049",
        marketplaceId: "ATVPDKIKX0DER",
      },
      reasoningAreas: ["commercial_philosophy", "risk_tolerance", "decision_principles"],
      approvedBy: "system-observed-commerce-proof",
    },
    {
      workspaceId,
      canonicalKey: "commerce.lesson.anker_brand_gate",
      title: "Do not recommend Anker / B088NRLMPV brand-gated catalog offers",
      statement:
        "Anker USB-C cable ASIN B088NRLMPV requires brand approval (QUALIFICATION_REQUIRED). Never treat it as a first-dollar candidate. Preflight getListingsRestrictions before recommending or publishing.",
      category: "B",
      memoryClass: "experience",
      authority: "marketplace_data",
      epistemicStatus: "FACT",
      source: "commerce_event",
      tags: ["commerce", "amazon", "anker", "brand-gate", "restriction", "preflight"],
      evidenceRefs: ["ASIN:B088NRLMPV", "issue:18304", "QUALIFICATION_REQUIRED"],
      linkedEntities: { asin: "B088NRLMPV", brand: "Anker" },
      reasoningAreas: ["commercial_philosophy", "risk_tolerance"],
      approvedBy: "system-observed-commerce-proof",
    },
    {
      workspaceId,
      canonicalKey: "commerce.lesson.preflight_restrictions_mandatory",
      title: "Amazon selling eligibility must be checked before recommendation",
      statement:
        "Never publish-first then discover brand/category qualification afterward. Restriction preflight is mandatory before Pillow surfaces APPROVAL-READY opportunities.",
      category: "B",
      memoryClass: "semantic",
      authority: "derived_inference",
      epistemicStatus: "INFERENCE",
      source: "pattern_detection",
      tags: ["commerce", "amazon", "preflight", "restrictions"],
      evidenceRefs: [
        "commerce.lesson.accepted_ne_buyable",
        "commerce.lesson.anker_brand_gate",
      ],
      reasoningAreas: ["commercial_philosophy", "decision_principles", "risk_tolerance"],
      approvedBy: "institutional-consolidation",
    },
    {
      workspaceId,
      canonicalKey: "ops.lesson.eos_session_storm",
      title: "Pillow host-session storms must not clear persisted host on transient 503",
      statement:
        "Bounded recovery: do not clear persisted host session on 503; ensureHostSession must reuse persisted host; avoid parallel session creates on Executive Home mount.",
      category: "B",
      memoryClass: "operational",
      authority: "system_observed",
      epistemicStatus: "OBSERVATION",
      source: "operational_event",
      tags: ["eos", "pillow", "session", "production", "incident"],
      evidenceRefs: ["EOS certification", "commits:e9c066be,36fd72d1"],
      reasoningAreas: ["engineering_philosophy", "risk_tolerance"],
      approvedBy: "system-observed-eos",
    },
    {
      workspaceId,
      canonicalKey: "collab.memory.ready",
      title: "ChatGPT–Pillow collaboration conclusions must use institutional memory",
      statement:
        "Future Grand King ↔ Pillow ↔ ChatGPT strategic collaboration must persist question, context, positions, disagreements, conclusion, owner decision, and later outcome with provenance — not disposable API responses.",
      category: "B",
      memoryClass: "collaboration",
      authority: "grand_king_directive",
      epistemicStatus: "OWNER_DIRECTIVE",
      source: "system_seed",
      tags: ["collaboration", "chatgpt", "pillow", "memory"],
      evidenceRefs: ["PERSISTENT CUMULATIVE MEMORY mission"],
      reasoningAreas: ["decision_principles", "engineering_philosophy"],
      approvedBy: "grand-king",
    },
  ];

  const keys: string[] = [];
  let seeded = 0;
  for (const seed of seeds) {
    const result = captureInstitutionalMemory(seed, auditLogger);
    if (result.ok && result.learningId) {
      keys.push(seed.canonicalKey);
      if (result.created) seeded += 1;
    }
  }
  logger.info({ workspaceId, seeded, total: keys.length }, "Institutional memory bootstrap complete");
  return { seeded, keys };
}

/** Commerce reasoning helper — retrieve lessons that must influence product decisions. */
export function getCommerceInstitutionalContext(workspaceId: string): {
  memories: ExecutiveKnowledgeEntry[];
  formatted: string;
  mustAvoidAsins: string[];
  mustAvoidBrands: string[];
  lessons: string[];
} {
  const memories = retrieveInstitutionalMemory({
    workspaceId,
    tags: ["commerce", "amazon", "restriction", "buyable", "brand-gate", "first-dollar"],
    keywords: ["accepted", "buyable", "anker", "qualification", "preflight"],
    memoryClasses: ["commerce", "experience", "semantic", "grand_king_directive"],
    limit: 16,
  });
  const mustAvoidAsins = new Set<string>();
  const mustAvoidBrands = new Set<string>();
  for (const m of memories) {
    // Only treat ASINs/brands from rejection / brand-gate / restriction lessons as must-avoid.
    // Recommendation memories also link ASINs — those must NOT block re-evaluation.
    const avoidSignal =
      m.tags?.some((t) =>
        /reject|restriction|brand-gate|suppressed|qualification|avoid/i.test(t),
      ) ||
      /reject|restriction|brand-gate|suppressed|qualification|avoid|do not recommend/i.test(
        `${m.title} ${m.canonicalKey}`,
      );
    if (!avoidSignal) continue;
    if (m.linkedEntities?.asin) mustAvoidAsins.add(m.linkedEntities.asin.toUpperCase());
    if (m.linkedEntities?.brand) mustAvoidBrands.add(m.linkedEntities.brand.toLowerCase());
  }
  // Hard-coded provenance from known proof class even if seed lag
  mustAvoidAsins.add("B088NRLMPV");
  mustAvoidBrands.add("anker");

  const lessons = memories.map((m) => m.title);
  const formatted = [
    "=== INSTITUTIONAL COMMERCE MEMORY (must influence recommendation) ===",
    ...memories.map(
      (m) =>
        `- [${m.epistemicStatus ?? "UNKNOWN"}/${m.authority ?? "unknown"}] ${m.title}: ${m.description.split("\n")[0]}`,
    ),
    `Avoid ASINs: ${[...mustAvoidAsins].join(", ")}`,
    `Avoid brands: ${[...mustAvoidBrands].join(", ")}`,
  ].join("\n");

  return {
    memories,
    formatted,
    mustAvoidAsins: [...mustAvoidAsins],
    mustAvoidBrands: [...mustAvoidBrands],
    lessons,
  };
}
