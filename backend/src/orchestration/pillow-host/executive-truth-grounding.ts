/**
 * Live operational truth for Pillow executive chat.
 *
 * Injects compact CURRENT VERIFIED STATE into the LLM context and
 * deterministically enforces high-stakes claim discipline after the answer.
 * Does not hard-code Birth interrogation answers or product-specific fixtures.
 */

import { env } from "../../config/env.js";
import { getBirthRecord } from "../pillow-commissioning/birth.js";
import { getOneProductCommissioningRecord } from "../pillow-commissioning/one-product-commissioning.js";
import { buildLiveCommercialSituation } from "../pillow-commissioning/executive-operating-loop/live-situation.js";
import { buildSmartViableKpiSnapshot } from "../pillow-commerce-presale/smart-viable-kpi.js";
import {
  formatEpistemicDisciplineBrief,
  type EpistemicContext,
  type RetrievalAttestation,
} from "./executive-epistemic-grounding.js";
import { formatExecutiveDecisionDisciplineBrief } from "./executive-decision-quality.js";
import type { ExecutiveTruthSnapshot } from "./executive-truth-types.js";

export type {
  ExecutiveTruthSnapshot,
  GroundingEnforcementResult,
  TruthClass,
} from "./executive-truth-types.js";
export { validateTruthDraft } from "./executive-truth-validators.js";

export function buildExecutiveTruthSnapshot(workspaceId: string): ExecutiveTruthSnapshot {
  const commission = getOneProductCommissioningRecord(workspaceId);
  const situation = buildLiveCommercialSituation(workspaceId);
  const kpi = buildSmartViableKpiSnapshot(workspaceId);
  const birth = getBirthRecord(workspaceId);
  const orders = Number(kpi.orders ?? situation.orders ?? 0) || 0;
  const realisedRevenueUsd =
    Number(kpi.realisedRevenueUsd ?? situation.realisedRevenueUsd ?? 0) || 0;

  return {
    computedAt: new Date().toISOString(),
    workspaceId,
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: commission?.commissioningId ?? null,
      asin: commission?.asin ?? null,
      productName: commission?.productName ?? null,
      supplier: commission?.supplier ?? null,
      marketplace: commission?.marketplace ?? null,
      selectionAuthority: commission?.selectionAuthority ?? null,
      cursorSelected: commission ? commission.cursorSelected : null,
      stage: commission?.stage ?? null,
      pillowRecommendation: commission?.pillowRecommendation ?? null,
      truthClass: commission ? "CURRENT_VERIFIED" : "UNKNOWN",
    },
    financial: {
      orders,
      realisedRevenueUsd,
      buyableListings: kpi.buyable ?? 0,
      publishedListings: kpi.published ?? 0,
      expectedProfitDisplay: commission?.expectedProfit ?? null,
      expectedProfitTruthClass: commission?.expectedProfit ? "ESTIMATED" : "UNKNOWN",
      realisedTruthClass: "CURRENT_VERIFIED",
    },
    birth: {
      status: birth.status,
      technicallyReady: birth.technicallyReady,
      birthTimestamp: birth.birthTimestamp,
      gatesPassedCount: birth.gatesPassedCount,
      gatesTotal: birth.gatesTotal,
      truthClass: "CURRENT_VERIFIED",
    },
    deploy: {
      gitCommitSha:
        process.env.RAILWAY_GIT_COMMIT_SHA ||
        process.env.RAILWAY_GIT_COMMIT ||
        null,
      serviceOnlineHint: "assume_online_if_answering",
      truthClass: "CURRENT_VERIFIED",
    },
    authority: {
      pillowMayPublish: false,
      pillowMaySupplierSpend: false,
      pillowMayAuthoriseBirth: false,
      pillowMayExecuteProductionDeploy: false,
      chatHasToolCallingLoop: false,
      executableNow: [
        "Answer Grand King questions within Digital Soul gates",
        "Run commissioning / executive-loop tools via API when invoked (L1/L2)",
        "Surface escalations requiring Grand King approval",
      ],
      requiresGrandKing: [
        "Authorise Pillow Birth (immutable birthTimestamp)",
        "Approve publish / listing go-live",
        "Approve supplier spend / BUY",
        "Production deploy / Railway release decisions",
        "Aggressive 1,000 release",
      ],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: situation.demandEvidence,
    notes: [
      "CURRENT_VERIFIED outranks historical mission docs (P0-1/B5 etc.).",
      "ZERO realised sales means sales/demand/ratings/competitor history are UNKNOWN unless cited from this block.",
      "Product ASIN and title are bound; never rename an ASIN.",
      `NODE_ENV=${process.env.NODE_ENV ?? "unset"}; DATABASE_PATH set=${Boolean(env.DATABASE_PATH)}`,
    ],
  };
}

/** Compact prompt block — targeted truth, not a repo dump. */
export function formatExecutiveTruthBrief(truth: ExecutiveTruthSnapshot): string {
  const p = truth.product;
  const f = truth.financial;
  const lines = [
    "--- Live Operational Truth (CURRENT VERIFIED — highest precedence) ---",
    `ComputedAt: ${truth.computedAt}`,
    `Provenance: ${truth.provenance}`,
    "",
    "Truth classes you MUST use internally for EmpireAI state claims:",
    "CURRENT_VERIFIED | HISTORICAL | ESTIMATED | MODEL_INFERENCE | UNVERIFIED_MEMORY | UNKNOWN",
    "Never promote MODEL_INFERENCE / UNVERIFIED_MEMORY / UNKNOWN into KNOW.",
    "Repository journey/status text and prior chat are HISTORICAL or UNVERIFIED unless they match this block.",
    "",
    "PRODUCT IDENTITY (bound entity — do not rename):",
    p.commissioningId || p.asin
      ? [
          `  truthClass=${p.truthClass}`,
          `  commissioningId=${p.commissioningId ?? "UNKNOWN"}`,
          `  ASIN=${p.asin ?? "UNKNOWN"}`,
          `  productName=${p.productName ?? "UNKNOWN"}`,
          `  supplier=${p.supplier ?? "UNKNOWN"}`,
          `  marketplace=${p.marketplace ?? "UNKNOWN"}`,
          `  selectionAuthority=${p.selectionAuthority ?? "UNKNOWN"}`,
          `  cursorSelected=${p.cursorSelected ?? "UNKNOWN"}`,
          `  stage=${p.stage ?? "UNKNOWN"}`,
          `  pillowRecommendation=${p.pillowRecommendation ?? "UNKNOWN"}`,
        ].join("\n")
      : "  No active commissioning product — product identity is UNKNOWN. Do not invent a product name or ASIN.",
    "",
    "FINANCIAL / COMMERCE (realised):",
    `  truthClass=${f.realisedTruthClass}`,
    `  orders=${f.orders}`,
    `  realisedRevenueUsd=${f.realisedRevenueUsd}`,
    `  publishedListings=${f.publishedListings}`,
    `  buyableListings=${f.buyableListings}`,
    `  demandEvidence=${truth.demandEvidence} (not realised sales)`,
    `  expectedProfit=${f.expectedProfitDisplay ?? "UNKNOWN"} (${f.expectedProfitTruthClass})`,
    f.orders === 0 && f.realisedRevenueUsd === 0
      ? "  HARD RULE: realised commerce is ZERO. You MUST NOT invent sales history, quarters, ratings, competitor analyses, or market research. Say UNKNOWN."
      : null,
    "",
    "BIRTH / DEPLOY (current):",
    `  birthStatus=${truth.birth.status} (CURRENT_VERIFIED)`,
    `  technicallyReady=${truth.birth.technicallyReady}`,
    `  birthTimestamp=${truth.birth.birthTimestamp ?? "NULL"}`,
    `  gates=${truth.birth.gatesPassedCount}/${truth.birth.gatesTotal}`,
    `  deployGitCommitSha=${truth.deploy.gitCommitSha ?? "UNKNOWN"}`,
    truth.deploy.gitCommitSha
      ? "  HARD RULE: This Brain process is live in production (you are answering now). Do NOT say production deployment is currently blocked."
      : null,
    "  Historical blockers (e.g. old P0-1/B5/B6/B7/B8 mission language) are HISTORICAL — do not treat as current if they conflict with this block.",
    "",
    "AUTHORITY (current):",
    `  pillowMayPublish=${truth.authority.pillowMayPublish}`,
    `  pillowMaySupplierSpend=${truth.authority.pillowMaySupplierSpend}`,
    `  pillowMayAuthoriseBirth=${truth.authority.pillowMayAuthoriseBirth}`,
    `  pillowMayExecuteProductionDeploy=${truth.authority.pillowMayExecuteProductionDeploy}`,
    `  chatToolCallingLoop=${truth.authority.chatHasToolCallingLoop}`,
    "  Executable now:",
    ...truth.authority.executableNow.map((x) => `    - ${x}`),
    "  Requires Grand King:",
    ...truth.authority.requiresGrandKing.map((x) => `    - ${x}`),
    "  Do not claim you can execute deploy/publish/spend/Birth merely because a playbook describes the process.",
    "",
    ...truth.notes.map((n) => `Note: ${n}`),
  ];
  return lines.filter((x) => x != null).join("\n");
}

/** Truth brief + epistemic/capability discipline (attested retrievals optional). */
export function formatExecutiveTruthBriefWithEpistemics(
  truth: ExecutiveTruthSnapshot,
  attestations: readonly RetrievalAttestation[] = [],
): string {
  const ctx: EpistemicContext = {
    truth,
    attestations,
    liveAnswerImpliesProductionOnline: true,
  };
  return `${formatExecutiveTruthBrief(truth)}\n\n${formatEpistemicDisciplineBrief(ctx)}\n\n${formatExecutiveDecisionDisciplineBrief()}`;
}

