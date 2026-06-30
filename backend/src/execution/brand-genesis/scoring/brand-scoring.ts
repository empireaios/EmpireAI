import type { CapitalAllocation } from "../../../revenue/capital-allocation-intelligence/models/capital-allocation.js";
import type { PortfolioEntry } from "../../../revenue/opportunity-portfolio/models/portfolio-entry.js";
import type {
  RevenueOpportunity,
  RevenueOpportunityType,
} from "../../../revenue/revenue-opportunity-synthesis/models/revenue-opportunity.js";
import type { BrandIdentity } from "../models/brand-identity.js";
import type { BrandPositioning } from "../models/brand-positioning.js";
import type { BrandProfileCreateInput } from "../models/brand-profile.js";

export type BrandGenesisRevenueOpportunityInput = Pick<
  RevenueOpportunity,
  | "opportunityId"
  | "productId"
  | "opportunityType"
  | "confidence"
  | "expectedValue"
  | "expectedDifficulty"
  | "recommendedAction"
  | "reasons"
>;

export type BrandGenesisPortfolioEntryInput = Pick<
  PortfolioEntry,
  | "entryId"
  | "revenueOpportunityId"
  | "productId"
  | "state"
  | "portfolioScore"
  | "capitalPriority"
>;

export type BrandGenesisCapitalAllocationInput = Pick<
  CapitalAllocation,
  | "allocationId"
  | "opportunityId"
  | "productId"
  | "portfolioState"
  | "allocationPercentage"
  | "riskAdjustedAllocation"
  | "confidence"
>;

export type BrandGenesisInput = {
  revenueOpportunity: BrandGenesisRevenueOpportunityInput;
  portfolioEntry: BrandGenesisPortfolioEntryInput;
  capitalAllocation: BrandGenesisCapitalAllocationInput;
};

export type BrandGenesisBreakdown = BrandProfileCreateInput;

type BrandTemplate = {
  suffix: string;
  niche: string;
  slogan: string;
  audience: string;
  positioningPrefix: string;
  companionProduct: string;
};

const BRAND_TEMPLATES: Record<RevenueOpportunityType, BrandTemplate> = {
  DROPSHIPPING: {
    suffix: "Supply Co.",
    niche: "Curated ecommerce essentials",
    slogan: "Quality you can ship today",
    audience: "Online shoppers seeking fast, reliable product discovery",
    positioningPrefix: "Trusted direct-to-consumer",
    companionProduct: "Starter bundle kit",
  },
  AFFILIATE: {
    suffix: "Review Hub",
    niche: "Trusted product recommendations",
    slogan: "Honest picks, smarter buys",
    audience: "Research-driven buyers comparing options before purchase",
    positioningPrefix: "Independent recommendation",
    companionProduct: "Comparison guide",
  },
  CONTENT: {
    suffix: "Media Lab",
    niche: "Trend-led lifestyle content",
    slogan: "Ideas that move markets",
    audience: "Social-first consumers discovering products through content",
    positioningPrefix: "Editorial trend authority",
    companionProduct: "Content starter pack",
  },
  LEAD_GENERATION: {
    suffix: "Demand Studio",
    niche: "High-intent buyer capture",
    slogan: "Connect demand before you launch",
    audience: "Prospects ready to evaluate solutions before committing",
    positioningPrefix: "Lead-first growth",
    companionProduct: "Lead magnet offer",
  },
  DIGITAL_PRODUCT: {
    suffix: "Digital Works",
    niche: "Expert digital offers",
    slogan: "Knowledge packaged for action",
    audience: "Buyers seeking immediate digital value without inventory risk",
    positioningPrefix: "Expert digital authority",
    companionProduct: "Digital starter course",
  },
};

const PORTFOLIO_POSITIONING: Record<PortfolioEntry["state"], string> = {
  SCALING: "category leader ready to scale",
  ACTIVE: "reliable challenger brand",
  WATCHLIST: "emerging niche explorer",
  DISCOVERED: "early-stage test brand",
  RETIRED: "legacy test brand",
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatProductLabel(productId: string): string {
  return productId
    .replace(/^prod-m\d+-/i, "")
    .replace(/^prod-/i, "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function computeConfidence(input: BrandGenesisInput): number {
  const { revenueOpportunity, portfolioEntry, capitalAllocation } = input;
  const allocationBoost = Math.min(100, capitalAllocation.allocationPercentage * 1.5);

  return clampScore(
    revenueOpportunity.confidence * 0.35 +
      portfolioEntry.portfolioScore * 0.25 +
      capitalAllocation.confidence * 0.25 +
      allocationBoost * 0.15,
  );
}

function buildIdentity(input: BrandGenesisInput): BrandIdentity {
  const { revenueOpportunity } = input;
  const template = BRAND_TEMPLATES[revenueOpportunity.opportunityType];
  const productLabel = formatProductLabel(revenueOpportunity.productId);

  return {
    brandName: `${productLabel} ${template.suffix}`,
    slogan: template.slogan,
    niche: template.niche,
  };
}

function buildPositioning(input: BrandGenesisInput, identity: BrandIdentity): BrandPositioning {
  const { revenueOpportunity, portfolioEntry, capitalAllocation } = input;
  const template = BRAND_TEMPLATES[revenueOpportunity.opportunityType];
  const productLabel = formatProductLabel(revenueOpportunity.productId);
  const portfolioDescriptor = PORTFOLIO_POSITIONING[portfolioEntry.state];
  const primaryReason = revenueOpportunity.reasons[0] ?? "Validated market demand";

  const positioning = `${template.positioningPrefix} ${portfolioDescriptor} in ${identity.niche.toLowerCase()}`;
  const valueProposition = `${revenueOpportunity.recommendedAction}. ${primaryReason}.`;
  const recommendedProducts = [
    productLabel,
    template.companionProduct,
    `${productLabel} premium edition`,
  ];

  if (capitalAllocation.riskAdjustedAllocation >= 2500) {
    recommendedProducts.push(`${productLabel} launch bundle`);
  }

  return {
    targetAudience: template.audience,
    positioning,
    valueProposition,
    recommendedProducts,
  };
}

/** Generates a brand profile from revenue, portfolio, and allocation inputs. */
export function scoreBrandGenesis(input: BrandGenesisInput): BrandGenesisBreakdown {
  const { revenueOpportunity, portfolioEntry, capitalAllocation } = input;
  const identity = buildIdentity(input);
  const positioningProfile = buildPositioning(input, identity);
  const confidence = computeConfidence(input);

  return {
    opportunityId: revenueOpportunity.opportunityId,
    productId: revenueOpportunity.productId,
    portfolioEntryId: portfolioEntry.entryId,
    allocationId: capitalAllocation.allocationId,
    brandName: identity.brandName,
    slogan: identity.slogan,
    niche: identity.niche,
    targetAudience: positioningProfile.targetAudience,
    positioning: positioningProfile.positioning,
    valueProposition: positioningProfile.valueProposition,
    recommendedProducts: positioningProfile.recommendedProducts,
    confidence,
    identity,
    positioningProfile,
  };
}

export const brandScoring = {
  scoreBrandGenesis,
  templates: BRAND_TEMPLATES,
  portfolioPositioning: PORTFOLIO_POSITIONING,
};

export type { RevenueOpportunityType };
