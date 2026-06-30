import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { ProductOffer } from "../../product-offer-generation/models/product-offer.js";
import type { LandingPageBlueprintCreateInput } from "../models/landing-page-blueprint.js";
import type { LandingPageSection } from "../models/landing-page-section.js";
import type { LandingPageSignal, LandingPageSignalType } from "../models/landing-page-signal.js";

export const LANDING_PAGE_SIGNAL_WEIGHTS: Record<LandingPageSignalType, number> = {
  offer_alignment: 0.2,
  brand_alignment: 0.16,
  hero_strength: 0.16,
  benefits_clarity: 0.14,
  cta_strength: 0.12,
  section_coverage: 0.1,
  social_proof_fit: 0.06,
  blueprint_composite: 0.06,
};

export type BlueprintProductOfferInput = Pick<
  ProductOffer,
  | "offerId"
  | "brandId"
  | "productId"
  | "offerStyle"
  | "offerTitle"
  | "headline"
  | "valueProposition"
  | "keyBenefits"
  | "keyFeatures"
  | "customerProblem"
  | "customerOutcome"
  | "callToAction"
  | "confidence"
>;

export type BlueprintBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type LandingPageBlueprintInput = {
  offer: BlueprintProductOfferInput;
  brand: BlueprintBrandInput;
};

export type LandingPageBlueprintBreakdown = LandingPageBlueprintCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: LandingPageSignalType,
  score: number,
  detail: string,
): LandingPageSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: LANDING_PAGE_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function buildSection(
  sectionType: LandingPageSection["sectionType"],
  title: string,
  headline: string,
  body: string,
  bullets: string[],
  callToAction: string | null,
  order: number,
): LandingPageSection {
  return {
    sectionType,
    title,
    headline,
    body,
    bullets,
    callToAction,
    order,
  };
}

function buildFaqItems(offer: BlueprintProductOfferInput, brand: BlueprintBrandInput): string[] {
  return [
    `Who is ${brand.brandName} for? ${brand.targetAudience}`,
    `What problem does this solve? ${offer.customerProblem}`,
    `What makes this ${offer.offerStyle.toLowerCase()} offer different? ${offer.valueProposition}`,
    `What outcome should buyers expect? ${offer.customerOutcome}`,
  ];
}

function buildSocialProofBullets(
  offer: BlueprintProductOfferInput,
  brand: BlueprintBrandInput,
): string[] {
  return [
    `${brand.brandName} positioning: ${brand.positioning}`,
    `${offer.offerStyle} offer confidence score: ${offer.confidence}`,
    `Built for ${brand.niche.toLowerCase()} buyers`,
  ];
}

function computeConfidence(
  offer: BlueprintProductOfferInput,
  brand: BlueprintBrandInput,
  sections: LandingPageSection[],
): number {
  const sectionCoverage = sections.filter((section) => section.body.length > 0).length / sections.length;
  const heroStrength = offer.headline.length >= 20 ? 85 : 65;
  const benefitsClarity = offer.keyBenefits.length >= 3 ? 82 : 60;
  const ctaStrength = offer.callToAction.length >= 8 ? 80 : 55;

  return clampScore(
    offer.confidence * 0.45 +
      brand.confidence * 0.25 +
      heroStrength * 0.1 +
      benefitsClarity * 0.1 +
      ctaStrength * 0.05 +
      sectionCoverage * 100 * 0.05,
  );
}

/** Converts a product offer into a landing page blueprint. */
export function scoreLandingPageBlueprint(
  input: LandingPageBlueprintInput,
): LandingPageBlueprintBreakdown {
  const { offer, brand } = input;

  const pageTitle = `${brand.brandName} | ${offer.offerTitle}`;

  const heroSection = buildSection(
    "HERO",
    "Hero",
    offer.headline,
    `${brand.slogan} ${offer.valueProposition}`,
    [brand.targetAudience, brand.positioning],
    offer.callToAction,
    1,
  );

  const problemSection = buildSection(
    "PROBLEM",
    "Problem",
    "The problem buyers face",
    offer.customerProblem,
    [
      `Buyers in ${brand.niche.toLowerCase()} need a clearer path to the right solution`,
      "Generic pages fail to connect problem, proof, and offer",
    ],
    null,
    2,
  );

  const solutionSection = buildSection(
    "SOLUTION",
    "Solution",
    `${brand.brandName} solves it`,
    offer.valueProposition,
    offer.keyFeatures,
    null,
    3,
  );

  const benefitsSection = buildSection(
    "BENEFITS",
    "Benefits",
    "Why this offer wins",
    offer.customerOutcome,
    offer.keyBenefits,
    null,
    4,
  );

  const offerSection = buildSection(
    "OFFER",
    "Offer",
    offer.offerTitle,
    `${offer.offerStyle} offer designed for ${brand.targetAudience.toLowerCase()}`,
    offer.keyFeatures,
    offer.callToAction,
    5,
  );

  const socialProofSection = buildSection(
    "SOCIAL_PROOF",
    "Social Proof",
    `Trusted by ${brand.niche.toLowerCase()} buyers`,
    `${brand.brandName} presents a ${offer.offerStyle.toLowerCase()} offer with strong market alignment.`,
    buildSocialProofBullets(offer, brand),
    null,
    6,
  );

  const faqSection = buildSection(
    "FAQ",
    "FAQ",
    "Common questions answered",
    "Address the final objections before purchase.",
    buildFaqItems(offer, brand),
    null,
    7,
  );

  const ctaSection = buildSection(
    "CTA",
    "Call To Action",
    "Ready to buy?",
    offer.customerOutcome,
    [offer.valueProposition, brand.slogan],
    offer.callToAction,
    8,
  );

  const sections = [
    heroSection,
    problemSection,
    solutionSection,
    benefitsSection,
    offerSection,
    socialProofSection,
    faqSection,
    ctaSection,
  ];

  const confidence = computeConfidence(offer, brand, sections);

  const signals: LandingPageSignal[] = [
    buildSignal("offer_alignment", offer.confidence, `Offer confidence ${offer.confidence}`),
    buildSignal("brand_alignment", brand.confidence, `Brand confidence ${brand.confidence}`),
    buildSignal(
      "hero_strength",
      offer.headline.length >= 20 ? 85 : 65,
      "Hero headline strength",
    ),
    buildSignal(
      "benefits_clarity",
      offer.keyBenefits.length >= 3 ? 82 : 60,
      `${offer.keyBenefits.length} key benefits mapped`,
    ),
    buildSignal(
      "cta_strength",
      offer.callToAction.length >= 8 ? 80 : 55,
      `CTA: ${offer.callToAction}`,
    ),
    buildSignal(
      "section_coverage",
      clampScore((sections.length / 8) * 100),
      `${sections.length} sections generated`,
    ),
    buildSignal(
      "social_proof_fit",
      clampScore((brand.confidence + offer.confidence) / 2),
      "Social proof alignment",
    ),
    buildSignal("blueprint_composite", confidence, `Blueprint confidence ${confidence}`),
  ];

  return {
    offerId: offer.offerId,
    brandId: brand.brandId,
    productId: offer.productId,
    pageTitle,
    heroSection,
    problemSection,
    solutionSection,
    benefitsSection,
    offerSection,
    socialProofSection,
    faqSection,
    ctaSection,
    confidence,
    signals,
  };
}

export const landingPageBlueprintScoring = {
  scoreLandingPageBlueprint,
  weights: LANDING_PAGE_SIGNAL_WEIGHTS,
};
