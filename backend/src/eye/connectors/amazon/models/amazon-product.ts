/** Amazon product snapshot — observation-only, no live API coupling. */

export type AmazonProductImage = {
  url: string;
  variant: "primary" | "alternate";
  width?: number;
  height?: number;
};

export type AmazonProduct = {
  asin: string;
  title: string;
  brand: string;
  category: string;
  subcategory?: string;
  priceCents: number;
  currency: string;
  images: AmazonProductImage[];
  description?: string;
  featureBullets?: string[];
  marketplace: string;
  isPrimeEligible?: boolean;
  availabilityStatus?: "in_stock" | "out_of_stock" | "unknown";
  observedAt: string;
};

export type AmazonProductQuery = {
  asin?: string;
  productTitle?: string;
  category?: string;
  marketplace?: string;
};
