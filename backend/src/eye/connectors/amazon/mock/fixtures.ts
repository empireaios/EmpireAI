import type { AmazonProduct } from "../models/amazon-product.js";
import type { ProductRanking } from "../models/product-ranking.js";
import type { ReviewStatistics } from "../models/review-statistics.js";
import type { PriceHistory } from "../interfaces/price-history.js";
import type { BestsellerCategoryNode } from "../interfaces/bestseller-category.js";

export const SAMPLE_ASINS = {
  USB_BLENDER: "B0MOCK001",
  WIRELESS_EARBUDS: "B0MOCK002",
  YOGA_MAT: "B0MOCK003",
} as const;

export const MOCK_BESTSELLER_ASINS: readonly string[] = [
  SAMPLE_ASINS.USB_BLENDER,
  SAMPLE_ASINS.WIRELESS_EARBUDS,
  SAMPLE_ASINS.YOGA_MAT,
];

const NOW = "2026-06-23T12:00:00.000Z";

export const MOCK_AMAZON_PRODUCTS: Record<string, AmazonProduct> = {
  [SAMPLE_ASINS.USB_BLENDER]: {
    asin: SAMPLE_ASINS.USB_BLENDER,
    title: "Portable USB Rechargeable Blender",
    brand: "BlendGo",
    category: "Kitchen & Dining",
    subcategory: "Blenders",
    priceCents: 2999,
    currency: "USD",
    images: [
      { url: "mock://amazon/images/B0MOCK001-primary.jpg", variant: "primary" },
      { url: "mock://amazon/images/B0MOCK001-alt.jpg", variant: "alternate" },
    ],
    featureBullets: ["USB rechargeable", "BPA-free cup", "Portable design"],
    marketplace: "US",
    isPrimeEligible: true,
    availabilityStatus: "in_stock",
    observedAt: NOW,
  },
  [SAMPLE_ASINS.WIRELESS_EARBUDS]: {
    asin: SAMPLE_ASINS.WIRELESS_EARBUDS,
    title: "Wireless Earbuds with Active Noise Cancellation",
    brand: "SoundWave",
    category: "Electronics",
    subcategory: "Headphones",
    priceCents: 4999,
    currency: "USD",
    images: [{ url: "mock://amazon/images/B0MOCK002-primary.jpg", variant: "primary" }],
    marketplace: "US",
    isPrimeEligible: true,
    availabilityStatus: "in_stock",
    observedAt: NOW,
  },
  [SAMPLE_ASINS.YOGA_MAT]: {
    asin: SAMPLE_ASINS.YOGA_MAT,
    title: "Extra Thick Non-Slip Yoga Mat",
    brand: "FlexMat",
    category: "Sports & Outdoors",
    subcategory: "Yoga",
    priceCents: 2499,
    currency: "USD",
    images: [{ url: "mock://amazon/images/B0MOCK003-primary.jpg", variant: "primary" }],
    marketplace: "US",
    isPrimeEligible: false,
    availabilityStatus: "in_stock",
    observedAt: NOW,
  },
};

export const MOCK_PRODUCT_RANKINGS: Record<string, ProductRanking> = {
  [SAMPLE_ASINS.USB_BLENDER]: {
    asin: SAMPLE_ASINS.USB_BLENDER,
    bestsellerRank: 842,
    categoryRank: 12,
    categoryPath: ["Kitchen & Dining", "Blenders"],
    estimatedPopularityScore: 78,
    rankTrend: "rising",
    observedAt: NOW,
  },
  [SAMPLE_ASINS.WIRELESS_EARBUDS]: {
    asin: SAMPLE_ASINS.WIRELESS_EARBUDS,
    bestsellerRank: 156,
    categoryRank: 3,
    categoryPath: ["Electronics", "Headphones"],
    estimatedPopularityScore: 92,
    rankTrend: "stable",
    observedAt: NOW,
  },
  [SAMPLE_ASINS.YOGA_MAT]: {
    asin: SAMPLE_ASINS.YOGA_MAT,
    bestsellerRank: 4200,
    categoryRank: 45,
    categoryPath: ["Sports & Outdoors", "Yoga"],
    estimatedPopularityScore: 55,
    rankTrend: "falling",
    observedAt: NOW,
  },
};

export const MOCK_REVIEW_STATISTICS: Record<string, ReviewStatistics> = {
  [SAMPLE_ASINS.USB_BLENDER]: {
    asin: SAMPLE_ASINS.USB_BLENDER,
    reviewCount: 3842,
    averageRating: 4.3,
    ratingDistribution: { oneStar: 4, twoStar: 6, threeStar: 12, fourStar: 28, fiveStar: 50 },
    verifiedPurchaseRatio: 0.82,
    observedAt: NOW,
  },
  [SAMPLE_ASINS.WIRELESS_EARBUDS]: {
    asin: SAMPLE_ASINS.WIRELESS_EARBUDS,
    reviewCount: 12500,
    averageRating: 4.5,
    ratingDistribution: { oneStar: 3, twoStar: 4, threeStar: 8, fourStar: 25, fiveStar: 60 },
    verifiedPurchaseRatio: 0.91,
    observedAt: NOW,
  },
  [SAMPLE_ASINS.YOGA_MAT]: {
    asin: SAMPLE_ASINS.YOGA_MAT,
    reviewCount: 890,
    averageRating: 4.1,
    ratingDistribution: { oneStar: 5, twoStar: 8, threeStar: 15, fourStar: 30, fiveStar: 42 },
    verifiedPurchaseRatio: 0.75,
    observedAt: NOW,
  },
};

export const MOCK_PRICE_HISTORIES: Record<string, PriceHistory> = {
  [SAMPLE_ASINS.USB_BLENDER]: {
    asin: SAMPLE_ASINS.USB_BLENDER,
    currency: "USD",
    snapshots: [
      { asin: SAMPLE_ASINS.USB_BLENDER, priceCents: 3499, currency: "USD", observedAt: "2026-05-01T00:00:00.000Z", source: "mock" },
      { asin: SAMPLE_ASINS.USB_BLENDER, priceCents: 3199, currency: "USD", observedAt: "2026-06-01T00:00:00.000Z", source: "mock" },
      { asin: SAMPLE_ASINS.USB_BLENDER, priceCents: 2999, currency: "USD", observedAt: NOW, source: "mock" },
    ],
    lowestPriceCents: 2999,
    highestPriceCents: 3499,
    averagePriceCents: 3232,
    priceTrend: "falling",
  },
  [SAMPLE_ASINS.WIRELESS_EARBUDS]: {
    asin: SAMPLE_ASINS.WIRELESS_EARBUDS,
    currency: "USD",
    snapshots: [
      { asin: SAMPLE_ASINS.WIRELESS_EARBUDS, priceCents: 4999, currency: "USD", observedAt: "2026-05-01T00:00:00.000Z", source: "mock" },
      { asin: SAMPLE_ASINS.WIRELESS_EARBUDS, priceCents: 4999, currency: "USD", observedAt: NOW, source: "mock" },
    ],
    lowestPriceCents: 4999,
    highestPriceCents: 4999,
    averagePriceCents: 4999,
    priceTrend: "stable",
  },
  [SAMPLE_ASINS.YOGA_MAT]: {
    asin: SAMPLE_ASINS.YOGA_MAT,
    currency: "USD",
    snapshots: [
      { asin: SAMPLE_ASINS.YOGA_MAT, priceCents: 2299, currency: "USD", observedAt: "2026-05-01T00:00:00.000Z", source: "mock" },
      { asin: SAMPLE_ASINS.YOGA_MAT, priceCents: 2499, currency: "USD", observedAt: NOW, source: "mock" },
    ],
    lowestPriceCents: 2299,
    highestPriceCents: 2499,
    averagePriceCents: 2399,
    priceTrend: "rising",
  },
};

export const MOCK_CATEGORY_TREE: BestsellerCategoryNode[] = [
  {
    categoryId: "kitchen",
    name: "Kitchen & Dining",
    parentId: null,
    depth: 0,
    children: [
      {
        categoryId: "kitchen-blenders",
        name: "Blenders",
        parentId: "kitchen",
        depth: 1,
        productCount: 1200,
      },
    ],
  },
  {
    categoryId: "electronics",
    name: "Electronics",
    parentId: null,
    depth: 0,
    children: [
      {
        categoryId: "electronics-headphones",
        name: "Headphones",
        parentId: "electronics",
        depth: 1,
        productCount: 5400,
      },
    ],
  },
  {
    categoryId: "sports",
    name: "Sports & Outdoors",
    parentId: null,
    depth: 0,
    children: [
      {
        categoryId: "sports-yoga",
        name: "Yoga",
        parentId: "sports",
        depth: 1,
        productCount: 800,
      },
    ],
  },
];
