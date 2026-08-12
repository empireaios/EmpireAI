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

export type TruthClass = "CURRENT_VERIFIED" | "HISTORICAL" | "ESTIMATED" | "UNKNOWN";

export type ExecutiveTruthSnapshot = {
  computedAt: string;
  workspaceId: string;
  provenance: "live_sqlite_commissioning_kpi_birth";
  product: {
    commissioningId: string | null;
    asin: string | null;
    productName: string | null;
    supplier: string | null;
    marketplace: string | null;
    selectionAuthority: string | null;
    cursorSelected: boolean | null;
    stage: string | null;
    pillowRecommendation: string | null;
    truthClass: TruthClass;
  };
  financial: {
    orders: number;
    realisedRevenueUsd: number;
    buyableListings: number;
    publishedListings: number;
    expectedProfitDisplay: string | null;
    expectedProfitTruthClass: TruthClass;
    realisedTruthClass: TruthClass;
  };
  birth: {
    status: string;
    technicallyReady: boolean;
    birthTimestamp: string | null;
    gatesPassedCount: number;
    gatesTotal: number;
    truthClass: TruthClass;
  };
  deploy: {
    gitCommitSha: string | null;
    serviceOnlineHint: "assume_online_if_answering";
    truthClass: TruthClass;
  };
  authority: {
    pillowMayPublish: false;
    pillowMaySupplierSpend: false;
    pillowMayAuthoriseBirth: false;
    pillowMayExecuteProductionDeploy: false;
    chatHasToolCallingLoop: false;
    executableNow: string[];
    requiresGrandKing: string[];
    truthClass: TruthClass;
  };
  demandEvidence: string;
  notes: string[];
};

export type GroundingEnforcementResult = {
  message: string;
  adjusted: boolean;
  violations: string[];
};

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

const FABRICATED_COMMERCE_CLAIM =
  /\b(last quarter|last three months|past (three|3) months|historical sales|sales (data|figures|performance|trend)|declining .{0,40}sales|customer feedback ratings?|competitor pricing analysis|internal sales tracking|market research reports?|revenue (of|totaling|was)|units? sold|conversion rate of)\b/i;

/** True zero/unknown statements are allowed even if they mention realised revenue/orders. */
const ZERO_OR_UNKNOWN_COMMERCE =
  /\b(0|zero|none|no verified|no realised|unknown)\b/i;

const DEPLOY_AUTHORITY_CLAIM =
  /\b(i can (initiate|execute|perform|run|complete)|i will (initiate|execute|perform|run)|i am able to (initiate|execute)|under (an |the )?operational playbook.{0,80}(deploy|deployment))\b.{0,80}\b(production deployment|deploy(ment)? to production|railway deploy)\b/i;

const STALE_DEPLOY_BLOCKER_AS_CURRENT =
  /\b(blocker\s*b[0-9]+|b5\s+proves|production deployment has not occurred|complete production deployment\s*\(p0-1\)|p0-1\b.{0,60}\b(not |still |blocked)|production deployment is currently blocked|still blocked by (an )?unresolved historical)\b/i;

const EVIDENCED_LABEL = /\b(evidenced|\[know\]|classified as\s+know)\b/i;

/** Asserts a concrete alternate product title (not "is no/not/unknown"). */
const ALTERNATE_PRODUCT_CLAIM =
  /\b(?:is|was|titled|called|named)\s+(?:the\s+)?["']?[A-Z][A-Za-z0-9]+(?:[\s\-][A-Za-z0-9]+){1,8}/;

function significantTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4)
    .filter((t) => !["with", "from", "that", "this", "high", "speed", "portable", "digital", "display"].includes(t));
}

function answerMentionsAuthoritativeProduct(answer: string, productName: string): boolean {
  const tokens = significantTokens(productName);
  if (tokens.length === 0) return true;
  const lower = answer.toLowerCase();
  // Require at least one distinctive token (prefer stronger ones)
  const strong = tokens.filter((t) => t.length >= 5);
  const pool = strong.length > 0 ? strong : tokens;
  return pool.some((t) => lower.includes(t));
}

/**
 * Deterministic high-stakes enforcement. Does not invent a polished essay —
 * appends grounded corrections when the model violated truth boundaries.
 */
export function enforceExecutiveTruthGrounding(
  answer: string,
  truth: ExecutiveTruthSnapshot,
): GroundingEnforcementResult {
  const violations: string[] = [];
  let message = answer;
  const corrections: string[] = [];

  const asin = truth.product.asin?.toUpperCase() ?? null;
  const productName = truth.product.productName;

  if (asin && productName && message.toUpperCase().includes(asin)) {
    const mentionsAuth = answerMentionsAuthoritativeProduct(message, productName);
    const assertsAlternate =
      ALTERNATE_PRODUCT_CLAIM.test(message) && !mentionsAuth;
    if (assertsAlternate) {
      violations.push("PRODUCT_IDENTITY_MISMATCH");
      corrections.push(
        `Product identity correction (CURRENT_VERIFIED): ASIN ${asin} is bound to "${productName}" (commissioningId=${truth.product.commissioningId ?? "UNKNOWN"}; selectionAuthority=${truth.product.selectionAuthority ?? "UNKNOWN"}). Any other product name for this ASIN is false. I do not invent alternate titles.`,
      );
    }
  }

  if (
    truth.financial.orders === 0 &&
    truth.financial.realisedRevenueUsd === 0 &&
    FABRICATED_COMMERCE_CLAIM.test(message) &&
    !ZERO_OR_UNKNOWN_COMMERCE.test(message)
  ) {
    violations.push("FABRICATED_COMMERCE_OR_FINANCIAL_CLAIM");
    corrections.push(
      `Financial truth correction (CURRENT_VERIFIED): realised orders=${truth.financial.orders}, realisedRevenueUsd=${truth.financial.realisedRevenueUsd}. I have no verified sales history, quarterly trends, customer ratings, or competitor-analysis evidence in EmpireAI. Those claims are UNKNOWN — not KNOW.`,
    );
  }

  if (DEPLOY_AUTHORITY_CLAIM.test(message) || /\bi can execute production deployment\b/i.test(message)) {
    violations.push("FALSE_DEPLOY_AUTHORITY");
    corrections.push(
      "Authority correction (CURRENT_VERIFIED): I cannot autonomously execute production deployment from this chat. Production deploy requires Grand King / platform release authority. Chat has no tool-calling deploy loop. Process docs are not executable authority.",
    );
  }

  if (
    (truth.birth.technicallyReady || Boolean(truth.deploy.gitCommitSha)) &&
    STALE_DEPLOY_BLOCKER_AS_CURRENT.test(message)
  ) {
    violations.push("STALE_HISTORICAL_BLOCKER_AS_CURRENT");
    corrections.push(
      `State freshness correction: Brain is answering live with deployGitCommitSha=${truth.deploy.gitCommitSha ?? "UNKNOWN"}; birthStatus=${truth.birth.status}; technicallyReady=${truth.birth.technicallyReady}. Historical certification blockers (P0-1/B5/B6/B7/B8 mission language) must be labeled HISTORICAL — not stated as current production-deploy blockers.`,
    );
  }

  if (
    violations.includes("FABRICATED_COMMERCE_OR_FINANCIAL_CLAIM") &&
    EVIDENCED_LABEL.test(message)
  ) {
    violations.push("UNSUPPORTED_MARKED_EVIDENCED");
    corrections.push(
      "Evidence-discipline correction: unsupported commercial/financial statements must be labeled UNKNOWN or INFERENCE — never Evidenced/KNOW.",
    );
  }

  if (corrections.length === 0) {
    return { message, adjusted: false, violations: [] };
  }

  // Soften false certainty markers without rewriting the whole answer into a fixture.
  message = message
    .replace(/\bEvidenced\b/gi, "Unsupported (reclassified)")
    .replace(/\[KNOW\]/gi, "[UNKNOWN]");

  message = `${message.trim()}\n\n---\nGrounded corrections (deterministic; CURRENT VERIFIED state outranks prior text):\n${corrections
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n")}`;

  return { message, adjusted: true, violations };
}
