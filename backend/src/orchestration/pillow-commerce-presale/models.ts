/**
 * First-dollar Pillow commerce pre-sale models.
 * ACCEPTED ≠ BUYABLE — commercial states are explicit and evidence-backed.
 */

import type { CommercialDecisionDossier } from "./commercial-decision-dossier.js";

export const STANDING_COMMERCE_OBJECTIVE =
  "FIND AND PREPARE SAFE, PROFITABLE DROPSHIPPING OPPORTUNITIES FOR AMAZON US" as const;

export const AMAZON_US_MARKETPLACE_ID = "ATVPDKIKX0DER" as const;
export const PROOF_001_BLOCKED_ASIN = "B088NRLMPV" as const;
export const PROOF_001_BLOCKED_SKU = "EMP-PROOF-1786072434049" as const;

/** Minimum expected contribution (USD) required before Grand King approval surface. */
export const MIN_EXPECTED_PROFIT_USD = 1;

/** Starting Amazon offer quantity — low exposure for first-dollar. */
export const DEFAULT_START_QUANTITY = 3;

export type EvidenceFreshness = "LIVE" | "ESTIMATED" | "CACHED" | "UNAVAILABLE" | "UNKNOWN";

export type CommercialOfferState =
  | "NOT_PUBLISHED"
  | "SUBMITTED"
  | "ACCEPTED"
  | "DISCOVERABLE"
  | "SUPPRESSED"
  | "QUALIFICATION_REQUIRED"
  | "INACTIVE"
  | "RESTRICTED"
  | "BUYABLE"
  | "UNKNOWN";

export type CandidateDisposition =
  | "REJECTED"
  | "BLOCKED"
  | "QUALIFIED"
  | "APPROVAL_READY"
  | "AWAITING_APPROVAL"
  | "APPROVED_PENDING_PUBLISH"
  | "REJECTED_BY_OWNER";

export type RejectionReasonCode =
  | "PROOF_001_BRAND_FAILURE_CLASS"
  | "OUT_OF_STOCK"
  | "COST_UNAVAILABLE"
  | "FREIGHT_UNAVAILABLE"
  | "NO_AMAZON_ASIN"
  | "AMAZON_RESTRICTION"
  | "QUALIFICATION_REQUIRED"
  | "LOSS_MAKING"
  | "FEE_UNAVAILABLE"
  | "SUPPLIER_UNAVAILABLE"
  | "INCOMPLETE_IDENTITY"
  | "DELIVERY_PROMISE_MISMATCH"
  | "BRAND_AUTHENTICITY_UNVERIFIED"
  | "PRIVATE_LABEL_NOT_CONFIGURED"
  | "DOSSIER_REJECT"
  | "OTHER";

export type MoneyEvidence = {
  amountUsd: number | null;
  freshness: EvidenceFreshness;
  source: string;
  note?: string;
};

export type AmazonCjProductMap = {
  marketplaceId: string;
  asin: string;
  amazonSellerSku: string;
  cjPid: string;
  cjVid: string;
  cjVariantSku: string;
  supplierCostUsd: MoneyEvidence;
  shippingUsd: MoneyEvidence;
  amazonFeesUsd: MoneyEvidence;
  proposedSellingPriceUsd: number;
  expectedProfitUsd: number;
  expectedMarginPct: number;
  startQuantity: number;
  verifiedAt: string;
};

export type CandidateRejection = {
  cjPid: string;
  productName: string;
  reasonCode: RejectionReasonCode;
  reason: string;
  evidence?: Record<string, unknown>;
};

export type ExecutiveRecommendation = {
  headline: string;
  productName: string;
  amazonUsEligibility: string;
  supplier: "CJdropshipping";
  supplierStock: string;
  supplierCost: string;
  usShipping: string;
  amazonFees: string;
  proposedSellingPrice: string;
  expectedProfit: string;
  expectedMargin: string;
  riskSummary: string;
  pillowRecommendation: "APPROVE" | "DO NOT APPROVE";
  proposedActionAfterApproval: string;
  fullNarrative: string;
};

export type QualifiedOpportunity = {
  opportunityId: string;
  workspaceId: string;
  companyId: string;
  disposition: CandidateDisposition;
  preflightOfferState: CommercialOfferState;
  mapping: AmazonCjProductMap;
  stockUnits: number;
  stockFreshness: EvidenceFreshness;
  risks: string[];
  recommendation: ExecutiveRecommendation;
  /** Complete Commercial Decision Dossier (FD-CDD-001) — mandatory before Grand King approval. */
  dossier?: CommercialDecisionDossier;
  approvalId: string | null;
  approvalStatus: "none" | "Pending" | "Approved" | "Rejected" | "Cancelled" | "Expired";
  publicationAllowed: false;
  supplierSpendAllowed: false;
  createdAt: string;
  updatedAt: string;
};

export type PresaleCycleResult = {
  cycleId: string;
  workspaceId: string;
  companyId: string;
  initiatedBy: "pillow-autonomous" | "pillow-tool" | "http";
  standingObjective: typeof STANDING_COMMERCE_OBJECTIVE;
  startedAt: string;
  completedAt: string;
  candidatesRetrieved: number;
  rejections: CandidateRejection[];
  qualifiedOpportunity: QualifiedOpportunity | null;
  /** Additional SMART viable finds in batch mode (no extra Grand King approvals). */
  smartViableBatchCount?: number;
  smartViableAsins?: string[];
  outcome:
    | "APPROVAL_SURFACED"
    | "NO_QUALIFIED_OPPORTUNITY"
    | "BLOCKED_INTEGRATION"
    | "ALREADY_PENDING_APPROVAL"
    | "SMART_VIABLE_BATCH_COMPLETE";
  blockers: string[];
  publicationAttempted: false;
  supplierSpendAttempted: false;
  actorWasCursor: false;
  kpiTarget?: number;
};

export function formatMoneyEvidence(m: MoneyEvidence): string {
  if (m.amountUsd === null || m.freshness === "UNAVAILABLE") {
    return `UNAVAILABLE (${m.source})`;
  }
  const label =
    m.freshness === "LIVE"
      ? "LIVE"
      : m.freshness === "ESTIMATED"
        ? "ESTIMATED"
        : m.freshness;
  return `$${m.amountUsd.toFixed(2)} [${label}]`;
}
