import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { ProductEntity } from "../../../intelligence/product-knowledge-graph/models/product-entity.js";
import type { ProductRelationship } from "../../../intelligence/product-knowledge-graph/models/product-relationship.js";
import type { ProductOpportunity } from "../../../intelligence/product-opportunity/models/product-opportunity.js";
import type { SupplierOpportunityMatch } from "../../../intelligence/supplier-opportunity-matching/models/supplier-opportunity-match.js";
import type { BrandProductPortfolioCreateInput } from "../models/brand-product-portfolio.js";
import type { BrandProduct, BrandProductRole } from "../models/brand-product.js";
import type { BrandProductSignal, BrandProductSignalType } from "../models/brand-product-signal.js";

export const BRAND_PRODUCT_SIGNAL_WEIGHTS: Record<BrandProductSignalType, number> = {
  hero_fit: 0.2,
  supporting_fit: 0.16,
  bundle_fit: 0.14,
  opportunity_score: 0.16,
  supplier_match: 0.14,
  relationship_strength: 0.1,
  entity_confidence: 0.06,
  portfolio_composite: 0.04,
};

export type BrandProductBrandInput = Pick<
  BrandProfile,
  "brandId" | "productId" | "brandName" | "niche" | "recommendedProducts" | "confidence"
>;

export type BrandProductKnowledgeInput = Pick<
  ProductEntity,
  "id" | "displayName" | "categoryId" | "confidence" | "tags"
>;

export type BrandProductRelationshipInput = Pick<
  ProductRelationship,
  "sourceProductId" | "targetProductId" | "relationshipType" | "strength"
>;

export type BrandProductOpportunityInput = Pick<
  ProductOpportunity,
  "productId" | "opportunityScore" | "opportunityTier" | "confidence" | "strengths"
>;

export type BrandProductSupplierMatchInput = Pick<
  SupplierOpportunityMatch,
  "productId" | "matchScore" | "matchTier" | "confidence" | "recommendedUse"
>;

export type BrandProductPortfolioInput = {
  brand: BrandProductBrandInput;
  heroProduct: BrandProductKnowledgeInput;
  relatedProducts: BrandProductKnowledgeInput[];
  relationships: BrandProductRelationshipInput[];
  opportunities: BrandProductOpportunityInput[];
  supplierMatches: BrandProductSupplierMatchInput[];
};

export type BrandProductPortfolioBreakdown = BrandProductPortfolioCreateInput;

type ScoredCandidate = BrandProduct & {
  relationshipType: ProductRelationship["relationshipType"] | "primary";
};

const ROLE_WEIGHTS: Record<BrandProductRole, number> = {
  HERO: 1,
  SUPPORTING: 0.72,
  BUNDLE: 0.88,
  EXPERIMENTAL: 0.45,
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignal(
  signalType: BrandProductSignalType,
  score: number,
  detail: string,
): BrandProductSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: BRAND_PRODUCT_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function findOpportunity(
  productId: string,
  opportunities: BrandProductOpportunityInput[],
): BrandProductOpportunityInput | undefined {
  return opportunities.find((opportunity) => opportunity.productId === productId);
}

function findSupplierMatch(
  productId: string,
  supplierMatches: BrandProductSupplierMatchInput[],
): BrandProductSupplierMatchInput | undefined {
  return supplierMatches.find((match) => match.productId === productId);
}

function findRelationshipStrength(
  sourceProductId: string,
  targetProductId: string,
  relationships: BrandProductRelationshipInput[],
): { strength: number; relationshipType: ProductRelationship["relationshipType"] | "primary" } {
  if (sourceProductId === targetProductId) {
    return { strength: 100, relationshipType: "primary" };
  }

  const relationship = relationships.find(
    (entry) =>
      (entry.sourceProductId === sourceProductId && entry.targetProductId === targetProductId) ||
      (entry.sourceProductId === targetProductId && entry.targetProductId === sourceProductId),
  );

  if (!relationship) {
    return { strength: 35, relationshipType: "related" };
  }

  return {
    strength: relationship.strength,
    relationshipType: relationship.relationshipType,
  };
}

function computeProductScore(
  opportunityScore: number,
  supplierMatchScore: number,
  relationshipStrength: number,
  entityConfidence: number,
): number {
  return clampScore(
    opportunityScore * 0.35 +
      supplierMatchScore * 0.25 +
      relationshipStrength * 0.2 +
      entityConfidence * 0.2,
  );
}

function resolveRole(
  productId: string,
  heroProductId: string,
  relationshipType: ProductRelationship["relationshipType"] | "primary",
  relationshipStrength: number,
  opportunityTier: ProductOpportunity["opportunityTier"] | undefined,
  productScore: number,
): BrandProductRole {
  if (productId === heroProductId) {
    return "HERO";
  }

  if (
    relationshipType === "complementary" &&
    relationshipStrength >= 55 &&
    productScore >= 55
  ) {
    return "SUPPORTING";
  }

  if (
    relationshipType === "related" &&
    relationshipStrength >= 55 &&
    productScore >= 50
  ) {
    return "SUPPORTING";
  }

  if (
    relationshipStrength >= 30 &&
    relationshipStrength < 55 &&
    opportunityTier !== "high"
  ) {
    return "EXPERIMENTAL";
  }

  if (productScore >= 45) {
    return "EXPERIMENTAL";
  }

  return "EXPERIMENTAL";
}

function scoreCandidate(
  brand: BrandProductBrandInput,
  heroProductId: string,
  entity: BrandProductKnowledgeInput,
  relationships: BrandProductRelationshipInput[],
  opportunities: BrandProductOpportunityInput[],
  supplierMatches: BrandProductSupplierMatchInput[],
): ScoredCandidate {
  const opportunity = findOpportunity(entity.id, opportunities);
  const supplierMatch = findSupplierMatch(entity.id, supplierMatches);
  const relationship = findRelationshipStrength(heroProductId, entity.id, relationships);

  const opportunityScore = opportunity?.opportunityScore ?? 52;
  const supplierMatchScore = supplierMatch?.matchScore ?? 48;
  const entityConfidence = entity.confidence;
  const productScore = computeProductScore(
    opportunityScore,
    supplierMatchScore,
    relationship.strength,
    entityConfidence,
  );

  const role = resolveRole(
    entity.id,
    heroProductId,
    relationship.relationshipType,
    relationship.strength,
    opportunity?.opportunityTier,
    productScore,
  );

  return {
    productId: entity.id,
    displayName: entity.displayName,
    role,
    productScore,
    supplierMatchScore,
    opportunityScore,
    relationshipStrength: relationship.strength,
    relationshipType: relationship.relationshipType,
  };
}

function buildBundleProducts(
  hero: ScoredCandidate,
  supporting: ScoredCandidate[],
  brand: BrandProductBrandInput,
): BrandProduct[] {
  const topSupporting = supporting.slice(0, 2);
  const bundles: BrandProduct[] = [
    {
      productId: `bundle-${slugify(hero.displayName)}-starter`,
      displayName: `${hero.displayName} Starter Bundle`,
      role: "BUNDLE",
      productScore: clampScore(hero.productScore * 0.55 + average(topSupporting.map((item) => item.productScore)) * 0.45),
      supplierMatchScore: clampScore(
        hero.supplierMatchScore * 0.6 + average(topSupporting.map((item) => item.supplierMatchScore)) * 0.4,
      ),
      opportunityScore: clampScore(
        hero.opportunityScore * 0.65 + average(topSupporting.map((item) => item.opportunityScore)) * 0.35,
      ),
      relationshipStrength: clampScore(
        hero.relationshipStrength * 0.5 + average(topSupporting.map((item) => item.relationshipStrength)) * 0.5,
      ),
    },
  ];

  if (topSupporting[0]) {
    bundles.push({
      productId: `bundle-${slugify(hero.displayName)}-${slugify(topSupporting[0].displayName)}`,
      displayName: `${hero.displayName} + ${topSupporting[0].displayName} Bundle`,
      role: "BUNDLE",
      productScore: clampScore((hero.productScore + topSupporting[0].productScore) / 2 + 8),
      supplierMatchScore: clampScore((hero.supplierMatchScore + topSupporting[0].supplierMatchScore) / 2),
      opportunityScore: clampScore((hero.opportunityScore + topSupporting[0].opportunityScore) / 2),
      relationshipStrength: clampScore((hero.relationshipStrength + topSupporting[0].relationshipStrength) / 2),
    });
  }

  if (brand.recommendedProducts.some((name) => /premium|launch/i.test(name))) {
    bundles.push({
      productId: `bundle-${slugify(brand.brandName)}-launch`,
      displayName: `${brand.brandName} Launch Bundle`,
      role: "BUNDLE",
      productScore: clampScore(hero.productScore + 6),
      supplierMatchScore: hero.supplierMatchScore,
      opportunityScore: clampScore(hero.opportunityScore + 4),
      relationshipStrength: hero.relationshipStrength,
    });
  }

  return bundles;
}

function computePortfolioScore(products: BrandProduct[]): number {
  if (products.length === 0) return 0;

  const weightedTotal = products.reduce(
    (total, product) => total + product.productScore * ROLE_WEIGHTS[product.role],
    0,
  );
  const weightSum = products.reduce((total, product) => total + ROLE_WEIGHTS[product.role], 0);
  return clampScore(weightedTotal / weightSum);
}

function computeConfidence(
  brand: BrandProductBrandInput,
  products: BrandProduct[],
  opportunities: BrandProductOpportunityInput[],
  supplierMatches: BrandProductSupplierMatchInput[],
  portfolioScore: number,
): number {
  const opportunityConfidence = average(opportunities.map((entry) => entry.confidence));
  const supplierConfidence = average(supplierMatches.map((entry) => entry.confidence));
  const productConfidence = average(products.map((product) => product.productScore));

  return clampScore(
    brand.confidence * 0.35 +
      opportunityConfidence * 0.25 +
      supplierConfidence * 0.2 +
      productConfidence * 0.1 +
      portfolioScore * 0.1,
  );
}

/** Determines which products belong to a generated brand. */
export function scoreBrandProductPortfolio(
  input: BrandProductPortfolioInput,
): BrandProductPortfolioBreakdown {
  const { brand, heroProduct, relatedProducts, relationships, opportunities, supplierMatches } =
    input;

  const candidates = [heroProduct, ...relatedProducts].map((entity) =>
    scoreCandidate(
      brand,
      heroProduct.id,
      entity,
      relationships,
      opportunities,
      supplierMatches,
    ),
  );

  const stripCandidate = ({ relationshipType: _relationshipType, ...product }: ScoredCandidate): BrandProduct =>
    product;

  const heroProducts = candidates.filter((product) => product.role === "HERO");
  const supportingProducts = candidates.filter((product) => product.role === "SUPPORTING");
  const hero = heroProducts[0] ?? candidates[0]!;
  const bundleProducts = buildBundleProducts(hero, supportingProducts, brand);

  const recommendedProducts = [...candidates.map(stripCandidate), ...bundleProducts];
  const portfolioScore = computePortfolioScore(recommendedProducts);
  const confidence = computeConfidence(
    brand,
    recommendedProducts,
    opportunities,
    supplierMatches,
    portfolioScore,
  );

  const signals: BrandProductSignal[] = [
    buildSignal("hero_fit", hero.productScore, `Hero product ${hero.displayName}`),
    buildSignal(
      "supporting_fit",
      supportingProducts.length
        ? average(supportingProducts.map((product) => product.productScore))
        : 40,
      `${supportingProducts.length} supporting products selected`,
    ),
    buildSignal(
      "bundle_fit",
      average(bundleProducts.map((product) => product.productScore)),
      `${bundleProducts.length} bundle products generated`,
    ),
    buildSignal(
      "opportunity_score",
      average(recommendedProducts.map((product) => product.opportunityScore)),
      "Average opportunity score across portfolio",
    ),
    buildSignal(
      "supplier_match",
      average(recommendedProducts.map((product) => product.supplierMatchScore)),
      "Average supplier match score across portfolio",
    ),
    buildSignal(
      "relationship_strength",
      average(recommendedProducts.map((product) => product.relationshipStrength)),
      "Average relationship strength across portfolio",
    ),
    buildSignal(
      "entity_confidence",
      average([heroProduct, ...relatedProducts].map((entity) => entity.confidence)),
      "Average knowledge graph entity confidence",
    ),
    buildSignal("portfolio_composite", portfolioScore, `Portfolio score ${portfolioScore}`),
  ];

  return {
    brandId: brand.brandId,
    recommendedProducts,
    heroProducts: heroProducts.map(stripCandidate),
    supportingProducts: supportingProducts.map(stripCandidate),
    bundleProducts,
    portfolioScore,
    confidence,
    signals,
  };
}

export const brandProductScoring = {
  scoreBrandProductPortfolio,
  weights: BRAND_PRODUCT_SIGNAL_WEIGHTS,
  roleWeights: ROLE_WEIGHTS,
};

export type { BrandProductRole };
