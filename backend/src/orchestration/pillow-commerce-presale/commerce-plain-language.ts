/**
 * Plain-language Grand King Commerce answers from canonical live truth.
 * UNKNOWN remains UNKNOWN — never fabricate Featured Offer / organic rank / actual profit.
 */
import { buildCommerceOperatingLoopReadiness } from "./commerce-operating-loop.js";
import type { QualifiedOpportunity } from "./models.js";
import { getPillowCommercePresaleRepository } from "./repository/sqlite-pillow-commerce-presale-repository.js";

export function explainPillowCommerce(workspaceId: string): {
  answers: Record<string, string>;
  opportunityId: string | null;
  operatingLoopRoute: string;
} {
  const repo = getPillowCommercePresaleRepository();
  const pending = repo.getPendingApprovalOpportunity(workspaceId);
  const latest = pending ?? repo.getLatestOpportunity(workspaceId);
  const loop = buildCommerceOperatingLoopReadiness();
  const d = latest?.dossier;
  const answers: Record<string, string> = {
    "What are you working on now?": latest
      ? `Commerce opportunity ${latest.mapping.asin} (${latest.disposition}).`
      : "Autonomous commerce discovery under standing first-dollar objective — no pending dossier.",
    "Why did you choose this product?":
      d?.exposureAndAction.why ??
      latest?.recommendation.fullNarrative.split("\n").slice(0, 3).join(" ") ??
      "UNKNOWN — no qualified opportunity yet.",
    "Why is this price rational?":
      d?.economics.pricingRationale ?? "UNKNOWN until dossier economics are computed.",
    "What does CJ charge us?": d
      ? `Product ${formatMoney(d.supplier.productCost)} + US shipping ${formatMoney(d.supplier.usShipping)} [${d.supplier.stockFreshness} stock ${d.supplier.stockUnits ?? "UNKNOWN"}].`
      : "UNKNOWN",
    "What does Amazon charge us?": d
      ? formatMoney(d.economics.amazonFees)
      : "UNKNOWN",
    "What will the buyer see for delivery?":
      d?.demandFulfilmentRisk.delivery.customerExpectation ?? "UNKNOWN",
    "How long does CJ need to process it?": d?.supplier.processingDays ?? "UNKNOWN",
    "Who actually fulfils the order?":
      "CJ physically fulfils (pick/pack/ship). EmpireAI orchestrates. Pillow supervises. Grand King governs approvals.",
    "How does CJ receive the order?":
      `${loop.canonicalAmazonToCjRoute}: Amazon SP-API order → EmpireAI map (SKU→CJ PID/VID) → approval-gated CJ createOrder. Not Cursor. Not manual Grand King typing.`,
    "Is the Amazon offer actually buyable?":
      latest?.preflightOfferState === "BUYABLE"
        ? "YES — BUYABLE verified"
        : "NO / NOT YET — ACCEPTED≠BUYABLE; offer not claimed buyable until post-publish verification.",
    "Are we the Featured Offer?":
      d?.marketplaceCompetition.currentlyFeaturedOffer ?? "UNKNOWN",
    "Where do we stand among seller offers?":
      d?.marketplaceCompetition.relativeOfferPosition ?? "UNKNOWN",
    "What is our organic search rank, if known?":
      "UNKNOWN — organic search rank is not claimed from offer-position APIs.",
    "Where does our brand appear?":
      d?.eligibilityAndBrand.brandAppearsWhere ?? "UNKNOWN",
    "What exactly will the customer receive?":
      d?.eligibilityAndBrand.customerReceives ?? "UNKNOWN",
    "How much have we actually earned?":
      "UNKNOWN / not yet measured — no realised first-dollar transaction recorded. Expected profit is not actual profit.",
    "What is expected profit versus realised profit?": d
      ? `Expected: $${d.economics.expectedProfitUsd.toFixed(2)}. Actual realised: UNKNOWN (READY — AWAITING FIRST REAL ORDER).`
      : "UNKNOWN",
    "What is going wrong?":
      latest?.disposition === "REJECTED"
        ? latest.recommendation.fullNarrative.slice(0, 400)
        : latest
          ? "No operational exception — awaiting Grand King approval before publish/spend."
          : "No decision-ready opportunity currently surfaced.",
    "What should we scale?":
      "Do not scale until BUYABLE + real orders + realised contribution validate the offer (earn the right to scale).",
    "What should we stop?":
      d?.exposureAndAction.pillowRecommendation === "REJECT"
        ? d.exposureAndAction.why
        : "Continue autonomous pipeline; stop only on restriction, delivery mismatch, authenticity failure, or loss-making economics.",
  };

  return {
    answers,
    opportunityId: latest?.opportunityId ?? null,
    operatingLoopRoute: loop.canonicalAmazonToCjRoute,
  };
}

function formatMoney(m: { amountUsd: number | null; freshness: string; source: string }): string {
  if (m.amountUsd == null) return `UNAVAILABLE (${m.source})`;
  return `$${m.amountUsd.toFixed(2)} [${m.freshness}]`;
}

export function summarizeOpportunityForExecutive(opportunity: QualifiedOpportunity | null): string {
  if (!opportunity) return "No commerce opportunity pending.";
  if (opportunity.dossier?.grandKingSummary) return opportunity.dossier.grandKingSummary;
  return opportunity.recommendation.fullNarrative;
}
