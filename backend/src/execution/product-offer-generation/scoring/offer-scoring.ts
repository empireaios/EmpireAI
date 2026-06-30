import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { BrandProduct } from "../../brand-product-portfolio/models/brand-product.js";
import type { ProductEntity } from "../../../intelligence/product-knowledge-graph/models/product-entity.js";
import type { ProductOfferCreateInput, OfferStyle } from "../models/product-offer.js";
import type { OfferSignal, OfferSignalType } from "../models/offer-signal.js";

export const OFFER_SIGNAL_WEIGHTS: Record<OfferSignalType, number> = {
  brand_fit: 0.18,
  product_role: 0.14,
  knowledge_confidence: 0.14,
  opportunity_score: 0.16,
  supplier_match: 0.12,
  offer_style: 0.1,
  value_alignment: 0.1,
  offer_composite: 0.06,
};

export type OfferBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "valueProposition"
  | "confidence"
>;

export type OfferBrandProductInput = Pick<
  BrandProduct,
  | "productId"
  | "displayName"
  | "role"
  | "productScore"
  | "opportunityScore"
  | "supplierMatchScore"
>;

export type OfferProductKnowledgeInput = Pick<
  ProductEntity,
  "id" | "displayName" | "description" | "categoryId" | "confidence" | "tags"
>;

export type ProductOfferGenerationInput = {
  brand: OfferBrandInput;
  brandProduct: OfferBrandProductInput;
  productEntity: OfferProductKnowledgeInput;
  portfolioConfidence?: number;
};

export type ProductOfferBreakdown = ProductOfferCreateInput;

type OfferStyleTemplate = {
  titlePrefix: string;
  headlinePattern: (productName: string, brandName: string) => string;
  problemPattern: (niche: string) => string;
  outcomePattern: (audience: string) => string;
  cta: string;
  benefits: string[];
  features: string[];
};

const OFFER_STYLE_TEMPLATES: Record<OfferStyle, OfferStyleTemplate> = {
  PREMIUM: {
    titlePrefix: "Premium",
    headlinePattern: (productName, brandName) =>
      `Elevate your ${productName.toLowerCase()} experience with ${brandName}`,
    problemPattern: (niche) =>
      `Buyers in ${niche.toLowerCase()} struggle to find products that feel premium and trustworthy`,
    outcomePattern: (audience) =>
      `${audience} get a polished, high-confidence purchase they feel proud to own`,
    cta: "Shop the premium offer",
    benefits: [
      "Premium positioning buyers trust immediately",
      "Higher perceived quality and brand credibility",
      "Stronger conversion for high-intent shoppers",
    ],
    features: [
      "Curated premium presentation",
      "Brand-backed quality promise",
      "Priority fulfillment positioning",
    ],
  },
  VALUE: {
    titlePrefix: "Value",
    headlinePattern: (productName, brandName) =>
      `Get more from every ${productName.toLowerCase()} with ${brandName}`,
    problemPattern: (niche) =>
      `Shoppers in ${niche.toLowerCase()} want strong results without overpaying`,
    outcomePattern: (audience) =>
      `${audience} receive meaningful value at a price that feels smart`,
    cta: "Claim the value bundle",
    benefits: [
      "Clear savings versus buying items separately",
      "Bundle-ready offer structure for faster checkout",
      "Strong value story for comparison shoppers",
    ],
    features: [
      "Bundle-friendly offer packaging",
      "Transparent value framing",
      "Multi-item purchase incentive",
    ],
  },
  PERFORMANCE: {
    titlePrefix: "Performance",
    headlinePattern: (productName, brandName) =>
      `${brandName} ${productName}: built for results that perform`,
    problemPattern: (niche) =>
      `Customers in ${niche.toLowerCase()} need products that deliver measurable performance`,
    outcomePattern: (audience) =>
      `${audience} achieve reliable performance they can notice and repeat`,
    cta: "Unlock peak performance",
    benefits: [
      "Performance-first messaging for decisive buyers",
      "Supplier-backed reliability story",
      "Strong fit for results-oriented audiences",
    ],
    features: [
      "Performance-led product framing",
      "Supplier reliability emphasis",
      "Outcome-focused offer structure",
    ],
  },
  CONVENIENCE: {
    titlePrefix: "Easy",
    headlinePattern: (productName, brandName) =>
      `The easiest way to get ${productName.toLowerCase()} from ${brandName}`,
    problemPattern: (niche) =>
      `Busy buyers in ${niche.toLowerCase()} want a simpler path from discovery to purchase`,
    outcomePattern: (audience) =>
      `${audience} solve the problem quickly with minimal friction`,
    cta: "Get it the easy way",
    benefits: [
      "Simple offer flow reduces purchase hesitation",
      "Convenience-first positioning for accessory products",
      "Fast path from interest to checkout",
    ],
    features: [
      "Low-friction offer presentation",
      "Accessory-friendly convenience framing",
      "Quick decision purchase path",
    ],
  },
};

const ROLE_DEFAULT_STYLES: Record<BrandProduct["role"], OfferStyle> = {
  HERO: "PREMIUM",
  BUNDLE: "VALUE",
  SUPPORTING: "CONVENIENCE",
  EXPERIMENTAL: "PERFORMANCE",
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(signalType: OfferSignalType, score: number, detail: string): OfferSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: OFFER_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function resolveOfferStyle(
  brandProduct: OfferBrandProductInput,
  productEntity: OfferProductKnowledgeInput,
): OfferStyle {
  const tags = productEntity.tags.map((tag) => tag.toLowerCase());

  if (
    brandProduct.role === "HERO" &&
    brandProduct.productScore >= 75 &&
    brandProduct.opportunityScore >= 70
  ) {
    return "PREMIUM";
  }

  if (brandProduct.role === "BUNDLE" || /bundle/.test(brandProduct.displayName.toLowerCase())) {
    return "VALUE";
  }

  if (brandProduct.role === "SUPPORTING") {
    if (tags.some((tag) => /performance|power|pro/.test(tag))) {
      return "PERFORMANCE";
    }
    return "CONVENIENCE";
  }

  if (
    brandProduct.supplierMatchScore >= 70 ||
    tags.some((tag) => /performance|power|pro/.test(tag))
  ) {
    return "PERFORMANCE";
  }

  if (
    brandProduct.role === "EXPERIMENTAL" ||
    tags.some((tag) => /accessory|portable|easy|convenience/.test(tag))
  ) {
    return "CONVENIENCE";
  }

  return ROLE_DEFAULT_STYLES[brandProduct.role];
}

function buildKeyFeatures(
  template: OfferStyleTemplate,
  productEntity: OfferProductKnowledgeInput,
): string[] {
  const features = [...template.features];
  if (productEntity.description) {
    features.unshift(productEntity.description);
  }
  if (productEntity.categoryId) {
    features.push(`Category: ${productEntity.categoryId.replace(/^cat-/, "").replace(/-/g, " ")}`);
  }
  return [...new Set(features)].slice(0, 4);
}

function computeConfidence(
  brand: OfferBrandInput,
  brandProduct: OfferBrandProductInput,
  productEntity: OfferProductKnowledgeInput,
  portfolioConfidence: number | undefined,
): number {
  return clampScore(
    brand.confidence * 0.3 +
      brandProduct.productScore * 0.25 +
      productEntity.confidence * 0.25 +
      (portfolioConfidence ?? brandProduct.opportunityScore) * 0.2,
  );
}

/** Generates a sellable product offer from brand, portfolio, and knowledge inputs. */
export function scoreProductOffer(input: ProductOfferGenerationInput): ProductOfferBreakdown {
  const { brand, brandProduct, productEntity, portfolioConfidence } = input;
  const offerStyle = resolveOfferStyle(brandProduct, productEntity);
  const template = OFFER_STYLE_TEMPLATES[offerStyle];
  const productName = brandProduct.displayName;

  const offerTitle = `${template.titlePrefix} ${productName} Offer`;
  const headline = template.headlinePattern(productName, brand.brandName);
  const valueProposition = `${brand.valueProposition} ${productName} delivers ${offerStyle.toLowerCase()} positioning for ${brand.niche.toLowerCase()}.`;
  const customerProblem = template.problemPattern(brand.niche);
  const customerOutcome = template.outcomePattern(brand.targetAudience);
  const callToAction = template.cta;
  const confidence = computeConfidence(brand, brandProduct, productEntity, portfolioConfidence);

  const signals: OfferSignal[] = [
    buildSignal("brand_fit", brand.confidence, `Brand confidence ${brand.confidence}`),
    buildSignal(
      "product_role",
      brandProduct.role === "HERO"
        ? 90
        : brandProduct.role === "BUNDLE"
          ? 78
          : brandProduct.role === "SUPPORTING"
            ? 65
            : 50,
      `Product role ${brandProduct.role}`,
    ),
    buildSignal(
      "knowledge_confidence",
      productEntity.confidence,
      `Knowledge graph confidence ${productEntity.confidence}`,
    ),
    buildSignal(
      "opportunity_score",
      brandProduct.opportunityScore,
      `Opportunity score ${brandProduct.opportunityScore}`,
    ),
    buildSignal(
      "supplier_match",
      brandProduct.supplierMatchScore,
      `Supplier match ${brandProduct.supplierMatchScore}`,
    ),
    buildSignal(
      "offer_style",
      offerStyle === "PREMIUM"
        ? 88
        : offerStyle === "VALUE"
          ? 72
          : offerStyle === "PERFORMANCE"
            ? 68
            : 60,
      `Offer style ${offerStyle}`,
    ),
    buildSignal(
      "value_alignment",
      clampScore((brand.confidence + brandProduct.productScore) / 2),
      "Brand and product value alignment",
    ),
    buildSignal("offer_composite", confidence, `Offer confidence ${confidence}`),
  ];

  return {
    brandId: brand.brandId,
    productId: brandProduct.productId,
    offerStyle,
    offerTitle,
    headline,
    valueProposition,
    keyBenefits: template.benefits,
    keyFeatures: buildKeyFeatures(template, productEntity),
    customerProblem,
    customerOutcome,
    callToAction,
    confidence,
    signals,
  };
}

/** Generates offers for multiple brand products. */
export function scoreProductOffers(
  brand: OfferBrandInput,
  brandProducts: OfferBrandProductInput[],
  productEntities: OfferProductKnowledgeInput[],
  portfolioConfidence?: number,
): ProductOfferBreakdown[] {
  return brandProducts.map((brandProduct) => {
    const productEntity =
      productEntities.find((entity) => entity.id === brandProduct.productId) ??
      productEntities.find((entity) => entity.displayName === brandProduct.displayName) ?? {
        id: brandProduct.productId,
        displayName: brandProduct.displayName,
        description: `${brandProduct.displayName} offer`,
        categoryId: undefined,
        confidence: 55,
        tags: [brandProduct.role.toLowerCase()],
      };

    return scoreProductOffer({
      brand,
      brandProduct,
      productEntity,
      portfolioConfidence,
    });
  });
}

export const offerScoring = {
  scoreProductOffer,
  scoreProductOffers,
  weights: OFFER_SIGNAL_WEIGHTS,
  offerStyleTemplates: OFFER_STYLE_TEMPLATES,
};

export type { OfferStyle };
