import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { LandingPageBlueprint } from "../../landing-page-blueprint/models/landing-page-blueprint.js";
import type { LandingPageSection } from "../../landing-page-blueprint/models/landing-page-section.js";
import type { ProductOffer, OfferStyle } from "../../product-offer-generation/models/product-offer.js";
import type { LandingPageContentCreateInput } from "../models/landing-page-content.js";
import type { ContentSection } from "../models/content-section.js";
import { renderContentSection } from "../models/content-section.js";
import type { ContentSignal, ContentSignalType } from "../models/content-signal.js";

export const CONTENT_SIGNAL_WEIGHTS: Record<ContentSignalType, number> = {
  blueprint_alignment: 0.18,
  offer_style_alignment: 0.16,
  brand_voice_alignment: 0.16,
  audience_alignment: 0.14,
  conversion_focus: 0.14,
  hero_copy_strength: 0.1,
  benefits_clarity: 0.08,
  content_composite: 0.04,
};

export type ContentBlueprintInput = Pick<
  LandingPageBlueprint,
  | "pageId"
  | "offerId"
  | "brandId"
  | "productId"
  | "pageTitle"
  | "heroSection"
  | "problemSection"
  | "solutionSection"
  | "benefitsSection"
  | "offerSection"
  | "socialProofSection"
  | "faqSection"
  | "ctaSection"
  | "confidence"
>;

export type ContentOfferInput = Pick<
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

export type ContentBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "valueProposition"
  | "confidence"
>;

export type LandingPageContentInput = {
  blueprint: ContentBlueprintInput;
  offer: ContentOfferInput;
  brand: ContentBrandInput;
};

export type LandingPageContentBreakdown = LandingPageContentCreateInput;

const OFFER_STYLE_TONE: Record<OfferStyle, string> = {
  PREMIUM: "premium and trustworthy",
  VALUE: "smart-value and conversion-ready",
  PERFORMANCE: "results-driven and confident",
  CONVENIENCE: "simple and friction-free",
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: ContentSignalType,
  score: number,
  detail: string,
): ContentSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: CONTENT_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function tonePrefix(offerStyle: OfferStyle, brand: ContentBrandInput): string {
  return `${brand.brandName} speaks in a ${OFFER_STYLE_TONE[offerStyle]} voice for ${brand.targetAudience.toLowerCase()}.`;
}

function buildHeroContent(
  section: LandingPageSection,
  offer: ContentOfferInput,
  brand: ContentBrandInput,
): ContentSection {
  return {
    sectionType: "HERO",
    headline: section.headline,
    paragraphs: [
      tonePrefix(offer.offerStyle, brand),
      `${brand.slogan} ${section.body}`,
      `Built for ${brand.niche.toLowerCase()} buyers who want a ${offer.offerStyle.toLowerCase()} experience.`,
    ],
    bullets: section.bullets,
    callToAction: section.callToAction ?? offer.callToAction,
  };
}

function buildProblemContent(
  section: LandingPageSection,
  offer: ContentOfferInput,
  brand: ContentBrandInput,
): ContentSection {
  return {
    sectionType: "PROBLEM",
    headline: section.headline,
    paragraphs: [
      offer.customerProblem,
      section.body,
      `${brand.targetAudience} deserve a clearer answer than generic marketplace listings.`,
    ],
    bullets: section.bullets,
    callToAction: null,
  };
}

function buildSolutionContent(
  section: LandingPageSection,
  offer: ContentOfferInput,
  brand: ContentBrandInput,
): ContentSection {
  return {
    sectionType: "SOLUTION",
    headline: section.headline,
    paragraphs: [
      `${brand.brandName} presents ${offer.offerTitle.toLowerCase()} with ${brand.positioning.toLowerCase()}.`,
      offer.valueProposition,
      section.body,
    ],
    bullets: offer.keyFeatures,
    callToAction: null,
  };
}

function buildBenefitsContent(
  section: LandingPageSection,
  offer: ContentOfferInput,
): ContentSection {
  return {
    sectionType: "BENEFITS",
    headline: section.headline,
    paragraphs: [
      offer.customerOutcome,
      section.body,
      "Every benefit is written to reduce hesitation and move buyers toward action.",
    ],
    bullets: offer.keyBenefits.length > 0 ? offer.keyBenefits : section.bullets,
    callToAction: null,
  };
}

function buildOfferContent(
  section: LandingPageSection,
  offer: ContentOfferInput,
  brand: ContentBrandInput,
): ContentSection {
  return {
    sectionType: "OFFER",
    headline: section.headline,
    paragraphs: [
      `${offer.offerStyle} offer crafted for ${brand.targetAudience.toLowerCase()}.`,
      section.body,
      offer.valueProposition,
    ],
    bullets: offer.keyFeatures,
    callToAction: offer.callToAction,
  };
}

function buildSocialProofContent(
  section: LandingPageSection,
  brand: ContentBrandInput,
  offer: ContentOfferInput,
): ContentSection {
  return {
    sectionType: "SOCIAL_PROOF",
    headline: section.headline,
    paragraphs: [
      section.body,
      `${brand.brandName} aligns with ${brand.niche.toLowerCase()} demand at ${offer.confidence}% offer confidence.`,
    ],
    bullets: section.bullets,
    callToAction: null,
  };
}

function buildFaqContent(section: LandingPageSection, brand: ContentBrandInput): ContentSection {
  const faqItems = section.bullets.map((bullet, index) => `Q${index + 1}: ${bullet}`);
  return {
    sectionType: "FAQ",
    headline: section.headline,
    paragraphs: [
      section.body,
      `Everything ${brand.targetAudience.toLowerCase()} asks before buying from ${brand.brandName}.`,
    ],
    bullets: faqItems,
    callToAction: null,
  };
}

function buildCtaContent(
  section: LandingPageSection,
  offer: ContentOfferInput,
  brand: ContentBrandInput,
): ContentSection {
  return {
    sectionType: "CTA",
    headline: section.headline,
    paragraphs: [
      offer.customerOutcome,
      section.body,
      `${brand.brandName}: ${brand.valueProposition}`,
    ],
    bullets: section.bullets,
    callToAction: section.callToAction ?? offer.callToAction,
  };
}

function computeConfidence(
  blueprint: ContentBlueprintInput,
  offer: ContentOfferInput,
  brand: ContentBrandInput,
  sections: ContentSection[],
): number {
  const copyLengthScore = sections.every((section) => section.paragraphs.join(" ").length >= 40)
    ? 85
    : 65;

  return clampScore(
    blueprint.confidence * 0.35 +
      offer.confidence * 0.3 +
      brand.confidence * 0.2 +
      copyLengthScore * 0.15,
  );
}

/** Generates complete landing page content from blueprint, offer, and brand inputs. */
export function scoreLandingPageContent(
  input: LandingPageContentInput,
): LandingPageContentBreakdown {
  const { blueprint, offer, brand } = input;

  const hero = buildHeroContent(blueprint.heroSection, offer, brand);
  const problem = buildProblemContent(blueprint.problemSection, offer, brand);
  const solution = buildSolutionContent(blueprint.solutionSection, offer, brand);
  const benefits = buildBenefitsContent(blueprint.benefitsSection, offer);
  const offerContent = buildOfferContent(blueprint.offerSection, offer, brand);
  const socialProof = buildSocialProofContent(blueprint.socialProofSection, brand, offer);
  const faq = buildFaqContent(blueprint.faqSection, brand);
  const cta = buildCtaContent(blueprint.ctaSection, offer, brand);

  const sections = [hero, problem, solution, benefits, offerContent, socialProof, faq, cta];
  const confidence = computeConfidence(blueprint, offer, brand, sections);

  const signals: ContentSignal[] = [
    buildSignal("blueprint_alignment", blueprint.confidence, "Blueprint alignment"),
    buildSignal(
      "offer_style_alignment",
      offer.offerStyle === "PREMIUM" ? 88 : offer.offerStyle === "VALUE" ? 76 : 68,
      `Offer style ${offer.offerStyle}`,
    ),
    buildSignal("brand_voice_alignment", brand.confidence, `Brand voice ${brand.brandName}`),
    buildSignal(
      "audience_alignment",
      clampScore(brand.confidence * 0.6 + offer.confidence * 0.4),
      brand.targetAudience,
    ),
    buildSignal(
      "conversion_focus",
      clampScore((offer.confidence + blueprint.confidence) / 2),
      "Conversion-focused copy structure",
    ),
    buildSignal(
      "hero_copy_strength",
      hero.paragraphs.join(" ").length >= 80 ? 86 : 68,
      "Hero copy strength",
    ),
    buildSignal(
      "benefits_clarity",
      benefits.bullets.length >= 3 ? 84 : 62,
      `${benefits.bullets.length} benefit bullets`,
    ),
    buildSignal("content_composite", confidence, `Content confidence ${confidence}`),
  ];

  return {
    pageId: blueprint.pageId,
    offerId: offer.offerId,
    brandId: brand.brandId,
    productId: offer.productId,
    heroCopy: renderContentSection(hero),
    problemCopy: renderContentSection(problem),
    solutionCopy: renderContentSection(solution),
    benefitsCopy: renderContentSection(benefits),
    offerCopy: renderContentSection(offerContent),
    socialProofCopy: renderContentSection(socialProof),
    faqCopy: renderContentSection(faq),
    ctaCopy: renderContentSection(cta),
    confidence,
    signals,
  };
}

export const landingPageContentScoring = {
  scoreLandingPageContent,
  weights: CONTENT_SIGNAL_WEIGHTS,
  offerStyleTone: OFFER_STYLE_TONE,
};

export type { OfferStyle };
