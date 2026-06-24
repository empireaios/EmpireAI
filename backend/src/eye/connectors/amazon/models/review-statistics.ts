/** Review and rating aggregates for an Amazon ASIN. */

export type RatingDistribution = {
  oneStar: number;
  twoStar: number;
  threeStar: number;
  fourStar: number;
  fiveStar: number;
};

export type ReviewStatistics = {
  asin: string;
  reviewCount: number;
  averageRating: number;
  ratingDistribution: RatingDistribution;
  verifiedPurchaseRatio?: number;
  observedAt: string;
};
