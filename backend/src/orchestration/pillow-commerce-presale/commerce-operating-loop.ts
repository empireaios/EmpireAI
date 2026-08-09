/**
 * First-dollar complete commerce operating loop readiness.
 * Canonical Amazon→CJ route: EmpireAI automated bridge (SP-API orders → map → CJ createOrder).
 * Cursor does not operate this loop. Grand King approval remains mandatory for publish/spend.
 */
import { openAmazonUsSession, getListingItemCommercialState } from "./amazon-commerce-preflight.js";
import type { CommercialDecisionDossier } from "./commercial-decision-dossier.js";
import type { QualifiedOpportunity } from "./models.js";
import { getPillowCommercePresaleRepository } from "./repository/sqlite-pillow-commerce-presale-repository.js";

export type OperatingLoopStageStatus =
  | "LIVE_PROVEN"
  | "IMPLEMENTED_READY"
  | "READY_AWAITING_FIRST_REAL_ORDER"
  | "BLOCKED"
  | "NOT_IMPLEMENTED";

export type CommerceOperatingLoopReadiness = {
  computedAt: string;
  canonicalAmazonToCjRoute:
    | "EMPIREAI_AUTOMATED_BRIDGE"
    | "NATIVE_CJ_AMAZON_SYNC"
    | "UNSUPPORTED";
  routeRationale: string;
  stages: Array<{
    stage: string;
    status: OperatingLoopStageStatus;
    detail: string;
  }>;
  idempotency: {
    amazonOrderToSupplierOrderKey: string;
    policy: string;
  };
  financialSeparation: {
    amazonCustomerPayment: string;
    cjSupplierPayment: string;
  };
  cursorRequiredForNormalOperation: false;
  performanceLadderLevel: number;
  performanceLadderLabel: string;
};

export function buildCommerceOperatingLoopReadiness(): CommerceOperatingLoopReadiness {
  return {
    computedAt: new Date().toISOString(),
    canonicalAmazonToCjRoute: "EMPIREAI_AUTOMATED_BRIDGE",
    routeRationale:
      "No native CJ↔Amazon sync is certified for this Grand King account. Existing authorized path is Amazon SP-API orders → EmpireAI mapping (amazonSellerSku→cjPid/cjVid) → approval-gated CjOrderClient createOrder → tracking sync → Amazon confirmShipment. Avoids unnecessary ERP intermediaries.",
    stages: [
      {
        stage: "DISCOVERY_DOSSIER",
        status: "IMPLEMENTED_READY",
        detail: "Pillow presale cycle builds Commercial Decision Dossier with LIVE economics where APIs allow.",
      },
      {
        stage: "GRAND_KING_APPROVAL",
        status: "IMPLEMENTED_READY",
        detail: "Pillow approval gate; no publish/spend without Approved decision.",
      },
      {
        stage: "REVALIDATION_PUBLISH",
        status: "IMPLEMENTED_READY",
        detail: "Marketplace publish executor LISTING_OFFER_ONLY exists; armed only after approval.",
      },
      {
        stage: "BUYABLE_VERIFY",
        status: "IMPLEMENTED_READY",
        detail: "getListingItemCommercialState + interpretListingCommercialState (ACCEPTED≠BUYABLE).",
      },
      {
        stage: "OFFER_MONITOR",
        status: "IMPLEMENTED_READY",
        detail: "Bounded competitive pricing + listing status reads available; no aggressive polling.",
      },
      {
        stage: "AMAZON_ORDER_DETECT",
        status: "READY_AWAITING_FIRST_REAL_ORDER",
        detail: "Amazon orders GET adapter + first-order operations scaffolding present.",
      },
      {
        stage: "AMAZON_TO_CJ_ORCHESTRATION",
        status: "READY_AWAITING_FIRST_REAL_ORDER",
        detail: "live-cj-fulfillment + CjOrderClient createOrder; idempotent amazonOrderId key required.",
      },
      {
        stage: "CJ_SUPPLIER_PAYMENT",
        status: "READY_AWAITING_FIRST_REAL_ORDER",
        detail: "CJ createOrder path is the spend event; remains Grand King spend-governance gated. Amazon payout ≠ CJ payment.",
      },
      {
        stage: "TRACKING",
        status: "READY_AWAITING_FIRST_REAL_ORDER",
        detail: "CJ logistic/trackInfo sync implemented in live-cj-fulfillment / cj-tracking-sync.",
      },
      {
        stage: "AMAZON_SHIPMENT_CONFIRM",
        status: "IMPLEMENTED_READY",
        detail: "confirmAmazonMerchantShipment executor wired for merchant-fulfilled orders when tracking exists.",
      },
      {
        stage: "ACTUAL_PNL",
        status: "READY_AWAITING_FIRST_REAL_ORDER",
        detail: "Actual revenue − Amazon fees − CJ cost − CJ shipping recorded separately from expected profit.",
      },
      {
        stage: "INSTITUTIONAL_MEMORY",
        status: "LIVE_PROVEN",
        detail: "Certified institutional memory captures recommendations, rejections, approvals, lessons.",
      },
    ],
    idempotency: {
      amazonOrderToSupplierOrderKey: "amazonOrderId + orderItemId + amazonSellerSku",
      policy:
        "Retries must resume existing LiveCjFulfillmentRecord by pipeline/amazon order id — never create duplicate CJ orders.",
    },
    financialSeparation: {
      amazonCustomerPayment: "Marketplace customer revenue / settlement (separate event).",
      cjSupplierPayment: "Supplier createOrder / CJ account debit under spend governance (separate event).",
    },
    cursorRequiredForNormalOperation: false,
    performanceLadderLevel: 1,
    performanceLadderLabel: "LEVEL 1 — decision-ready opportunity autonomously produced (awaiting Grand King approval for LEVEL 2).",
  };
}

export async function verifyBuyableForSku(input: {
  amazonSellerSku: string;
  env?: NodeJS.ProcessEnv;
}): Promise<{
  state: string;
  reasons: string[];
  buyable: boolean;
}> {
  const amazon = await openAmazonUsSession(input.env ?? process.env);
  if (!amazon.session) {
    return { state: "UNKNOWN", reasons: [amazon.blocker ?? "Amazon session unavailable"], buyable: false };
  }
  const result = await getListingItemCommercialState(amazon.session, input.amazonSellerSku);
  return {
    state: result.state,
    reasons: result.reasons,
    buyable: result.state === "BUYABLE",
  };
}

export function getPendingOpportunityWithDossier(workspaceId: string): {
  opportunity: QualifiedOpportunity | null;
  dossier: CommercialDecisionDossier | null;
  operatingLoop: CommerceOperatingLoopReadiness;
} {
  const opportunity = getPillowCommercePresaleRepository().getPendingApprovalOpportunity(workspaceId);
  const dossier =
    (opportunity as QualifiedOpportunity & { dossier?: CommercialDecisionDossier } | null)?.dossier ??
    null;
  return {
    opportunity,
    dossier,
    operatingLoop: buildCommerceOperatingLoopReadiness(),
  };
}
