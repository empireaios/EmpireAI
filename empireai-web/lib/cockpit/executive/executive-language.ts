/**
 * Canonical Grand King presentation layer — machine truth → business language.
 * Technical IDs remain available via toTechnicalDetails(), not default surfaces.
 */

export type CommerceOpportunityLike = {
  productName: string;
  asin: string;
  cjPid: string;
  amazonSellerSku: string;
  offerPrice: string;
  expectedProfitUsd: string;
  approvalStatus: string;
  disposition: string;
  summary?: string | null;
  dossierSummary?: string | null;
  brandRoute?: string | null;
  pillowRecommendation?: string | null;
  deliveryPromise?: string | null;
  competingOffers?: string | number | null;
  supplierCost?: string | null;
};

export type ExecutiveLanguageCard = {
  headline: string;
  supplierLine: string;
  economicsLine: string;
  competitionLine: string | null;
  deliveryLine: string | null;
  recommendationLine: string;
  decisionLine: string;
  technicalDetails: Array<{ label: string; value: string }>;
};

function humanizeEnum(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bAsin\b/g, "Amazon listing")
    .replace(/\bCj\b/gi, "CJdropshipping");
}

function humanDecision(status: string, disposition: string): string {
  const s = status.toUpperCase();
  if (s.includes("PENDING") || s.includes("REQUIRED") || s.includes("AWAIT")) {
    return "Grand King approval is required before publication or supplier spend.";
  }
  if (s.includes("APPROVED")) {
    return "Approved — downstream listing actions follow governed automation.";
  }
  if (s.includes("REJECT")) {
    return "Rejected — do not publish this opportunity.";
  }
  return `${humanizeEnum(status)}. Pillow disposition: ${humanizeEnum(disposition)}.`;
}

/** Default Grand King card — no raw PID/SKU/enum dump. */
export function toExecutiveCommerceLanguage(opp: CommerceOpportunityLike): ExecutiveLanguageCard {
  const brand = opp.brandRoute ? humanizeEnum(opp.brandRoute) : null;
  const competing =
    opp.competingOffers != null && String(opp.competingOffers).trim()
      ? `Competing offers currently begin around / count: ${String(opp.competingOffers)}.`
      : null;
  const delivery = opp.deliveryPromise?.trim()
    ? opp.deliveryPromise.replace(/\bCJ\b/gi, "supplier")
    : null;
  const recommendation = opp.pillowRecommendation
    ? humanizeEnum(opp.pillowRecommendation)
    : "Review the opportunity economics and risks, then decide in the approval queue.";

  return {
    headline: opp.productName,
    supplierLine: brand
      ? `Supplier: CJdropshipping · Brand route: ${brand}`
      : "Supplier: CJdropshipping",
    economicsLine: [
      opp.supplierCost ? `Supplier cost: ${opp.supplierCost}` : null,
      `Proposed Amazon price: ${opp.offerPrice}`,
      `Expected profit: ${opp.expectedProfitUsd} per sale (EXPECTED — not realised)`,
    ]
      .filter(Boolean)
      .join(" · "),
    competitionLine: competing,
    deliveryLine: delivery,
    recommendationLine: `Pillow recommendation: ${recommendation}`,
    decisionLine: humanDecision(opp.approvalStatus, opp.disposition),
    technicalDetails: [
      { label: "Amazon ASIN", value: opp.asin },
      { label: "CJ product ID", value: opp.cjPid },
      { label: "Internal SKU", value: opp.amazonSellerSku },
      { label: "Approval status", value: opp.approvalStatus },
      { label: "Disposition", value: opp.disposition },
      ...(opp.brandRoute ? [{ label: "Brand route code", value: opp.brandRoute }] : []),
    ],
  };
}

/** Prompt for Pillow that keeps conversation in business language while preserving context. */
export function toPillowCommerceAskPrompt(opp: CommerceOpportunityLike, intent: "discuss" | "challenge"): string {
  const card = toExecutiveCommerceLanguage(opp);
  if (intent === "challenge") {
    return [
      `Challenge the proposed selling price for "${card.headline}".`,
      card.economicsLine,
      card.competitionLine ?? "",
      "Explain in plain executive language whether the price is commercially rational.",
      "Keep ASIN/SKU in technical context only — do not ask me to restate identifiers.",
    ]
      .filter(Boolean)
      .join(" ");
  }
  return [
    `Discuss the commerce opportunity "${card.headline}".`,
    card.supplierLine,
    card.economicsLine,
    card.deliveryLine ?? "",
    card.recommendationLine,
    card.decisionLine,
    "Explain competitiveness, delivery promise, risks, and what happens after approval.",
    "Use the Commercial Decision Dossier — do not ask me to restate identifiers.",
  ]
    .filter(Boolean)
    .join(" ");
}
