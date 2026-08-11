/**
 * Pillow commercial decision standard (FD-CDD-001).
 * Hard fails → REJECT. Material uncertainty → WAIT / INVESTIGATE / TEST.
 * APPROVE only when evidence supports owner-facing confidence.
 */
import type { BrandRoute, DossierVerdict } from "./commercial-decision-dossier.js";

export type DecideDossierVerdictInput = {
  brandRoute: BrandRoute | string;
  deliveryCanMeet: "YES" | "NO" | "UNKNOWN";
  amazonEligibility: "PASS" | "FAIL" | "UNKNOWN";
  profitOk: boolean;
  /** Proposed offer vs lowest competing offer; null if competitor unknown. */
  pricePremiumPct: number | null;
  /** True when sales-rank or equivalent demand signal exists. */
  demandEvidencePresent: boolean;
  competingOfferCount: number | null;
};

export type DecideDossierVerdictResult = {
  verdict: DossierVerdict;
  why: string;
  rejectCode?: string;
  confidence: "high" | "medium" | "low";
};

export function computePricePremiumPct(
  ourPriceUsd: number | null | undefined,
  lowestCompetitorUsd: number | null | undefined,
): number | null {
  if (
    ourPriceUsd == null ||
    lowestCompetitorUsd == null ||
    !Number.isFinite(ourPriceUsd) ||
    !Number.isFinite(lowestCompetitorUsd) ||
    lowestCompetitorUsd <= 0
  ) {
    return null;
  }
  return ((ourPriceUsd - lowestCompetitorUsd) / lowestCompetitorUsd) * 100;
}

export function decideDossierVerdict(
  input: DecideDossierVerdictInput,
): DecideDossierVerdictResult {
  if (input.amazonEligibility === "FAIL") {
    return {
      verdict: "REJECT",
      why: "Amazon eligibility/restriction preflight failed.",
      rejectCode: "AMAZON_RESTRICTION",
      confidence: "high",
    };
  }
  if (input.deliveryCanMeet === "NO") {
    return {
      verdict: "REJECT",
      why: "Supplier delivery cannot realistically meet Amazon buyer delivery promise.",
      rejectCode: "DELIVERY_PROMISE_MISMATCH",
      confidence: "high",
    };
  }
  if (input.brandRoute === "EXISTING_BRANDED_CATALOG") {
    return {
      verdict: "REJECT",
      why: "Brand route is existing branded catalog, but CJ authenticity vs Amazon ASIN is not verified (keyword/catalog match alone is insufficient). Do not treat lookalike generics as authentic branded goods.",
      rejectCode: "BRAND_AUTHENTICITY_UNVERIFIED",
      confidence: "high",
    };
  }
  if (input.brandRoute === "OWN_BRAND_PRIVATE_LABEL") {
    return {
      verdict: "REJECT",
      why: "Private-label/own-brand route requires verified CJ branding/packaging configuration before first-dollar sale.",
      rejectCode: "PRIVATE_LABEL_NOT_CONFIGURED",
      confidence: "high",
    };
  }
  if (!input.profitOk) {
    return {
      verdict: "REJECT",
      why: "Economics fail minimum expected contribution gate.",
      rejectCode: "LOSS_MAKING",
      confidence: "high",
    };
  }

  if (input.amazonEligibility === "UNKNOWN") {
    return {
      verdict: "INVESTIGATE",
      why: "Amazon eligibility is UNKNOWN — Pillow will not recommend APPROVE until restriction/eligibility is verified.",
      confidence: "low",
    };
  }

  const premium = input.pricePremiumPct;
  const extremePremium = premium != null && premium >= 100;
  const materialPremium = premium != null && premium >= 25;
  const demandUnknown = !input.demandEvidencePresent;
  const competitionThin =
    input.competingOfferCount == null || input.competingOfferCount < 1;

  if (extremePremium && demandUnknown) {
    return {
      verdict: "INVESTIGATE",
      why: `Proposed price is about ${premium!.toFixed(0)}% above the lowest competing offer and demand evidence is UNKNOWN. Positive expected margin alone does not justify APPROVE — Pillow needs stronger demand or a competitive price before asking Grand King to approve publication.`,
      confidence: "low",
    };
  }

  if (extremePremium) {
    return {
      verdict: "INVESTIGATE",
      why: `Proposed price is about ${premium!.toFixed(0)}% above the lowest competing offer. That is an extreme pricing disadvantage — Pillow recommends INVESTIGATE, not APPROVE, until price competitiveness or demand evidence improves.`,
      confidence: "low",
    };
  }

  if (materialPremium && demandUnknown) {
    return {
      verdict: "INVESTIGATE",
      why: `Proposed price is about ${premium!.toFixed(0)}% above the lowest competing offer and demand is UNKNOWN. Pillow will not treat expected profit as sufficient for APPROVE under material price disadvantage without demand evidence.`,
      confidence: "low",
    };
  }

  if (demandUnknown && competitionThin) {
    return {
      verdict: "WAIT",
      why: "Demand evidence is UNKNOWN and competing-offer coverage is incomplete. Pillow recommends WAIT for fresher marketplace evidence before an owner approve/reject decision.",
      confidence: "low",
    };
  }

  if (input.deliveryCanMeet === "UNKNOWN" && materialPremium) {
    return {
      verdict: "WAIT",
      why: "Supplier delivery capability is UNKNOWN and price is materially above the lowest competitor. Pillow recommends WAIT until delivery competitiveness is clearer.",
      confidence: "low",
    };
  }

  if (demandUnknown && !materialPremium) {
    return {
      verdict: "TEST",
      why: "Price is relatively competitive but demand evidence is still UNKNOWN. Pillow recommends TEST (small exposure only) rather than full APPROVE confidence — catalog existence is not demand proof.",
      confidence: "medium",
    };
  }

  if (materialPremium) {
    return {
      verdict: "WAIT",
      why: `Proposed price is about ${premium!.toFixed(0)}% above the lowest competing offer. Even with other gates passing, Pillow recommends WAIT for a price/positioning review before APPROVE.`,
      confidence: "medium",
    };
  }

  return {
    verdict: "APPROVE",
    why:
      input.deliveryCanMeet === "UNKNOWN"
        ? "Generic/unbranded offer with live stock/cost/freight/fees, restriction clear, competitive-enough pricing, and positive expected contribution. Delivery capability remains estimated/UNKNOWN — Amazon promise must match supplier reality. Publication still requires Grand King approval; BUYABLE must be verified after publish."
        : "Generic/unbranded offer route with live stock/cost/freight/fees, restriction clear, delivery feasible under conservative estimates, competitive-enough pricing, and positive expected contribution. Publication still requires Grand King approval; BUYABLE must be verified after publish.",
    confidence: input.deliveryCanMeet === "UNKNOWN" ? "medium" : "high",
  };
}

export function dossierVerdictAllowsApprovalSurface(verdict: DossierVerdict): boolean {
  return verdict === "APPROVE";
}

export function toExecutiveRecommendationFlag(
  verdict: DossierVerdict,
): "APPROVE" | "DO NOT APPROVE" {
  return verdict === "APPROVE" ? "APPROVE" : "DO NOT APPROVE";
}
