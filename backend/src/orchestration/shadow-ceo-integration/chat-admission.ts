/**
 * Shadow CEO chat admission — single entry from Grand King Pillow chat.
 * Intent → durable episode → source-backed brief. No plan-as-execution.
 */

import { createHash } from "node:crypto";

import {
  openShadowCeoRepository,
  runVerticalSliceDemo,
  verifyChainIntegrity,
  type VerticalSliceDemoResult,
} from "../shadow-ceo/index.js";
import {
  attemptExternalActionAndPersist,
  createApprovalRequestAndPersist,
  MISSION_DEFAULT_MODE,
} from "../shadow-ceo-authority/index.js";
import {
  computeProfitLedger,
  eligibilityFromProduct,
  seedSyntheticAmazonUsCatalog,
  unitEconomicsFromProduct,
} from "../synthetic-commerce/index.js";
import {
  resolveShadowCeoAuthorityDir,
  resolveShadowCeoDbPath,
} from "./durable-paths.js";

export type ShadowCeoChatAdmission =
  | {
      admitted: true;
      blocked: false;
      objectiveId: string;
      correlationId: string;
      runKey: string;
      message: string;
      kind: "shadow_ceo_episode";
      episode: VerticalSliceDemoResult;
      ledgerRealisedSyntheticNetProfitUsd: number;
      syntheticCatalogProductCount: number;
      eligibleProductCount: number;
    }
  | {
      admitted: true;
      blocked: true;
      code: "SHADOW_CEO_EXECUTION_BLOCKED";
      stage: string;
      reason: string;
      correlationId: string;
      objectiveId: string | null;
      message: string;
      kind: "shadow_ceo_blocked";
    }
  | { admitted: false };

/** Generic Shadow CEO operating intent — not keyed to SC-01 targets or names. */
export function detectShadowCeoOperatingIntent(message: string): boolean {
  const t = String(message || "");
  if (!t.trim()) return false;

  const mentionsShadowCeo = /\bshadow[\s_-]*ceo\b/i.test(t);
  const mentionsSynthetic = /\bsynthetic\b/i.test(t);
  const mentionsSyntheticMode =
    /\bSYNTHETIC\s+mode\b/i.test(t) || /\bunder\s+SYNTHETIC\b/i.test(t);
  const operateIntent =
    /\b(operate|operating|execute|run|admit|continue|stand\s+up|open\s+one\s+bounded)\b/i.test(
      t,
    ) || /\b(objective|environment|control\s*plane|operating\s+loop|episode)\b/i.test(t);
  const commerceOps =
    /\b(amazon|commerce|profit|experiment|trial|listing|product\s+cohort|contribution)\b/i.test(
      t,
    );
  const noLive =
    /\b(do not touch live|no real|not live|real commerce|SYNTHETIC\s+mode|under\s+SYNTHETIC)\b/i.test(
      t,
    );

  if (mentionsShadowCeo && (operateIntent || mentionsSyntheticMode || mentionsSynthetic)) {
    return true;
  }
  // Operating ask that names synthetic commerce + live lock without saying "Shadow CEO"
  if (mentionsSynthetic && commerceOps && operateIntent && noLive) {
    return true;
  }
  return false;
}

function stableRunKey(workspaceId: string, message: string): string {
  const digest = createHash("sha256")
    .update(`${workspaceId}\n${normalizeObjectiveText(message)}`)
    .digest("hex")
    .slice(0, 24);
  return `chat_${digest}`;
}

function normalizeObjectiveText(message: string): string {
  return String(message || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

function deriveObjectiveTitle(message: string): string {
  const compact = String(message || "").replace(/\s+/g, " ").trim();
  if (!compact) return "Shadow CEO SYNTHETIC operating objective";
  const firstSentence = compact.split(/(?<=[.!?])\s+/)[0] ?? compact;
  return firstSentence.slice(0, 180);
}

function inspectSyntheticState(): {
  catalogCount: number;
  eligibleCount: number;
  assessmentOverride: {
    situationSummary: string;
    findings: string[];
    risks: string[];
    opportunities: string[];
  };
  productForLedger: ReturnType<typeof seedSyntheticAmazonUsCatalog>["products"][number];
} {
  const catalog = seedSyntheticAmazonUsCatalog();
  const eligible = catalog.products.filter((p) => {
    const stockOk = catalog.stock
      .filter((s) => s.productId === p.productId)
      .some((s) => s.available > 0);
    const ue = unitEconomicsFromProduct(p);
    return eligibilityFromProduct(p, {
      stockAvailable: stockOk,
      economicsViable: ue.contributionAfterAds > 0,
      deliveryAcceptable: p.deliveryDaysMax <= 12,
    }).eligible;
  });

  const findings = [
    `Synthetic Amazon US catalog inspected: ${catalog.products.length} products`,
    `Eligibility-pass products: ${eligible.length}`,
    `Suppliers in fixture: ${catalog.suppliers.length}; warehouses: ${catalog.warehouses.length}`,
  ];
  if (eligible.length === 0) {
    findings.push("No product currently passes every eligibility hard-stop in the synthetic pack");
  } else {
    findings.push(
      `Top eligible product sample: ${eligible[0]!.productId} (${eligible[0]!.title})`,
    );
  }

  return {
    catalogCount: catalog.products.length,
    eligibleCount: eligible.length,
    assessmentOverride: {
      situationSummary: `Inspected synthetic Amazon US commerce state before prioritization (${catalog.products.length} SKUs; ${eligible.length} eligibility-pass). Real commerce remains locked.`,
      findings,
      risks: [
        "Live listing/ads/supplier commitments are physically blocked under SYNTHETIC",
        "Eligibility counts are fixture-derived, not live marketplace scrape",
      ],
      opportunities: [
        eligible.length > 0
          ? "Authorized synthetic experiment / monitor actions may proceed within Cost Centre caps"
          : "Widen synthetic cohort eligibility only via fixture/state updates — do not invent live inventory",
      ],
    },
    productForLedger: eligible[0] ?? catalog.products[0]!,
  };
}

function formatSourceBackedBrief(input: {
  objectiveId: string;
  correlationId: string;
  runKey: string;
  episode: VerticalSliceDemoResult;
  ledgerProfit: number;
  catalogCount: number;
  eligibleCount: number;
  userObjectiveExcerpt: string;
}): string {
  const { episode } = input;
  const c = episode.chain;
  const tasks = c.tasks
    .map(
      (t) =>
        `- ${t.title} [${t.completion.status}] owner=${t.assignee} id=${t.id}`,
    )
    .join("\n");
  const decisions = c.decision
    ? `- ${c.decision.disposition} (${c.decision.id}) — ${c.decision.rationale}`
    : "- (none)";
  const actions = c.actions
    .map(
      (a) =>
        `- ${a.title} status=${a.executionStatus} kind=${a.actionKind} id=${a.id}`,
    )
    .join("\n");
  const approvals = c.approvals
    .map((a) => `- ${a.requestSummary} status=${a.approvalStatus} id=${a.id}`)
    .join("\n");
  const lesson = c.lesson
    ? `${c.lesson.statement} (id=${c.lesson.id}, evidence=${c.lesson.completion.status})`
    : "(none — no outcome lesson without evidence)";
  const outcome = c.outcome
    ? `expected=${c.outcome.expectedResult}; actual=${c.outcome.actualResult}; variance=${c.outcome.variance}`
    : "(none)";

  return [
    "### Shadow CEO Executive Brief (source-backed)",
    "",
    `- Operating episode / objective ID: \`${input.objectiveId}\``,
    `- Correlation ID: \`${input.correlationId}\``,
    `- Run key: \`${input.runKey}\``,
    `- Operating mode: \`${c.objective.mode}\` (SYNTHETIC isolation; real commerce locked)`,
    `- Birth status: NOT_BORN · Wave 1: 0/24 · Real commerce authorized: false`,
    `- Assessed state source: synthetic Amazon US catalog (${input.catalogCount} products; ${input.eligibleCount} eligibility-pass)`,
    `- Admitted objective excerpt: ${input.userObjectiveExcerpt.slice(0, 280)}`,
    "",
    "#### Priorities established",
    ...c.priorities.map((p) => `- [#${p.rank}] ${p.title} — ${p.rationale} (${p.id})`),
    "",
    "#### Tasks created",
    tasks || "- (none)",
    "",
    "#### Decisions",
    decisions,
    "",
    "#### Synthetic / gated actions",
    actions || "- (none)",
    "",
    "#### Approvals / blockers",
    approvals || "- (none)",
    "",
    "#### Outcomes observed",
    `- ${outcome}`,
    "",
    "#### Financial effect (deterministic synthetic ledger)",
    `- Realised synthetic net profit (USD): **${input.ledgerProfit}**`,
    `- liveSales: null · realisedLiveProfit: null (forbidden for synthetic rows)`,
    "",
    "#### Lesson",
    `- ${lesson}`,
    "",
    "#### Next operating action",
    c.brief?.recommendedNext
      ? `- ${c.brief.recommendedNext}`
      : "- Continue SYNTHETIC evidence cycle; do not escalate live marketplace actions",
    "",
    "#### Claim discipline",
    "- This brief is generated only from persisted Shadow CEO records + synthetic ledger totals.",
    "- No plan-as-execution: proposed vs accepted vs completed vs blocked are taken from record status fields.",
  ].join("\n");
}

function formatBlocked(input: {
  stage: string;
  reason: string;
  correlationId: string;
  objectiveId: string | null;
}): string {
  return [
    "### SHADOW_CEO_EXECUTION_BLOCKED",
    "",
    `- Code: \`SHADOW_CEO_EXECUTION_BLOCKED\``,
    `- Stage: \`${input.stage}\``,
    `- Reason: ${input.reason}`,
    `- Correlation ID: \`${input.correlationId}\``,
    `- Objective ID: \`${input.objectiveId ?? "none"}\``,
    `- Mode: SYNTHETIC · Birth: NOT_BORN · Real commerce: locked`,
    "",
    "No ordinary planning prose is substituted for execution.",
    "Retry is idempotent for the same admitted objective text.",
  ].join("\n");
}

/**
 * Admit a Shadow CEO operating request from Pillow chat and execute one durable cycle.
 */
export function admitAndExecuteShadowCeoFromChat(input: {
  message: string;
  workspaceId: string;
  correlationId: string;
}): ShadowCeoChatAdmission {
  if (!detectShadowCeoOperatingIntent(input.message)) {
    return { admitted: false };
  }

  const runKey = stableRunKey(input.workspaceId, input.message);
  const dbPath = resolveShadowCeoDbPath();
  const authorityDir = resolveShadowCeoAuthorityDir();
  let repo: ReturnType<typeof openShadowCeoRepository> | null = null;

  try {
    const inspected = inspectSyntheticState();
    repo = openShadowCeoRepository({ dbPath });
    const episode = runVerticalSliceDemo({
      repo,
      workspaceId: input.workspaceId,
      runKey,
      mode: MISSION_DEFAULT_MODE,
      objectiveTitle: deriveObjectiveTitle(input.message),
      objectiveStatement: input.message.replace(/\s+/g, " ").trim().slice(0, 8000),
      assessmentOverride: inspected.assessmentOverride,
    });
    const issues = verifyChainIntegrity(episode.chain);
    if (issues.length > 0) {
      const blocked = formatBlocked({
        stage: "chain_integrity",
        reason: issues.map((i) => `${i.code}:${i.message}`).join("; "),
        correlationId: input.correlationId,
        objectiveId: episode.objectiveId,
      });
      return {
        admitted: true,
        blocked: true,
        code: "SHADOW_CEO_EXECUTION_BLOCKED",
        stage: "chain_integrity",
        reason: issues[0]?.message ?? "chain integrity failed",
        correlationId: input.correlationId,
        objectiveId: episode.objectiveId,
        message: blocked,
        kind: "shadow_ceo_blocked",
      };
    }

    const product = inspected.productForLedger;
    const variant = product.variants[0]!;
    const fees = product.amazonReferralFeeUsd + product.fbaOrSellerFeeUsd;
    const ledger = computeProfitLedger(
      [
        {
          entryId: `chat-led-${episode.objectiveId}`,
          synthetic: true,
          currency: "USD",
          revenue: product.listPriceUsd,
          productCost: variant.unitProductCostUsd,
          shipping: product.shippingEstimateUsd,
          fees,
          ads: product.adsSpendPerUnitUsd,
          refunds: 0,
          returns: 0,
          opex: 0,
          productId: product.productId,
          notes: "Chat-admitted SYNTHETIC experiment line — not live sales",
        },
      ],
      { ledgerId: `chat-tpl-${episode.objectiveId}`, currency: "USD" },
    );

    const liveAttempt = attemptExternalActionAndPersist(
      {
        kind: "listing",
        mode: MISSION_DEFAULT_MODE,
        approvalStatus: "pending",
        authorized: false,
      },
      authorityDir,
    );
    if (liveAttempt.decision !== "BLOCKED") {
      return {
        admitted: true,
        blocked: true,
        code: "SHADOW_CEO_EXECUTION_BLOCKED",
        stage: "authority_gate",
        reason: "Live listing was not physically blocked",
        correlationId: input.correlationId,
        objectiveId: episode.objectiveId,
        message: formatBlocked({
          stage: "authority_gate",
          reason: "Live listing was not physically blocked",
          correlationId: input.correlationId,
          objectiveId: episode.objectiveId,
        }),
        kind: "shadow_ceo_blocked",
      };
    }
    createApprovalRequestAndPersist(
      {
        kind: "listing",
        mode: MISSION_DEFAULT_MODE,
        reason: "Real marketplace listing outside SYNTHETIC authority",
        requestedAction: "Publish live Amazon US listing",
        whyRequired: "External marketplace side effect",
        financialExternalConsequence: "Real fees / inventory / customer exposure",
        optionsForGrandKing: ["deny", "defer_until_birth"],
      },
      authorityDir,
    );

    const synAttempt = attemptExternalActionAndPersist(
      {
        kind: "synthetic_experiment_run",
        mode: MISSION_DEFAULT_MODE,
        approvalStatus: "none",
        authorized: true,
      },
      authorityDir,
    );
    if (synAttempt.decision !== "ALLOWED") {
      return {
        admitted: true,
        blocked: true,
        code: "SHADOW_CEO_EXECUTION_BLOCKED",
        stage: "synthetic_action",
        reason: synAttempt.reason ?? "synthetic experiment not allowed",
        correlationId: input.correlationId,
        objectiveId: episode.objectiveId,
        message: formatBlocked({
          stage: "synthetic_action",
          reason: String(synAttempt.reason ?? "synthetic experiment not allowed"),
          correlationId: input.correlationId,
          objectiveId: episode.objectiveId,
        }),
        kind: "shadow_ceo_blocked",
      };
    }

    const message = formatSourceBackedBrief({
      objectiveId: episode.objectiveId,
      correlationId: input.correlationId,
      runKey,
      episode,
      ledgerProfit: ledger.totals.realisedNetProfit,
      catalogCount: inspected.catalogCount,
      eligibleCount: inspected.eligibleCount,
      userObjectiveExcerpt: input.message.replace(/\s+/g, " ").trim(),
    });

    const planHits = shadowCeoPlanAsExecutionViolations(message);
    if (planHits.length > 0) {
      return {
        admitted: true,
        blocked: true,
        code: "SHADOW_CEO_EXECUTION_BLOCKED",
        stage: "plan_as_execution_guard",
        reason: planHits.join("; "),
        correlationId: input.correlationId,
        objectiveId: episode.objectiveId,
        message: formatBlocked({
          stage: "plan_as_execution_guard",
          reason: planHits.join("; "),
          correlationId: input.correlationId,
          objectiveId: episode.objectiveId,
        }),
        kind: "shadow_ceo_blocked",
      };
    }

    return {
      admitted: true,
      blocked: false,
      objectiveId: episode.objectiveId,
      correlationId: input.correlationId,
      runKey,
      message,
      kind: "shadow_ceo_episode",
      episode,
      ledgerRealisedSyntheticNetProfitUsd: ledger.totals.realisedNetProfit,
      syntheticCatalogProductCount: inspected.catalogCount,
      eligibleProductCount: inspected.eligibleCount,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return {
      admitted: true,
      blocked: true,
      code: "SHADOW_CEO_EXECUTION_BLOCKED",
      stage: "admission_or_execution",
      reason,
      correlationId: input.correlationId,
      objectiveId: null,
      message: formatBlocked({
        stage: "admission_or_execution",
        reason,
        correlationId: input.correlationId,
        objectiveId: null,
      }),
      kind: "shadow_ceo_blocked",
    };
  } finally {
    try {
      repo?.close();
    } catch {
      /* ignore */
    }
  }
}

/** Unsupported plan-as-execution claims for Shadow CEO visible surfaces. */
export function shadowCeoPlanAsExecutionViolations(text: string): string[] {
  const t = String(text || "");
  const hits: string[] = [];
  if (/\bI (initiated|executed|delegated|learned)\b/i.test(t) && !/\bobj_[a-z0-9_]+\b/i.test(t)) {
    hits.push("first_person_execution_without_objective_id");
  }
  if (/\bthe plan will be executed\b/i.test(t) && !/\bstatus=EXECUTED\b|\bEXECUTED\b/.test(t)) {
    hits.push("plan_will_be_executed_without_executed_action");
  }
  if (
    /\bDO\s+NOT\s+SELECT\s+ANY\b/i.test(t) &&
    /Shadow CEO Executive Brief \(source-backed\)/i.test(t)
  ) {
    hits.push("dns_appender_on_shadow_ceo_brief");
  }
  return hits;
}
