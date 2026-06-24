/** Query parameters for Google Trends observation requests. */
export type TrendsQuery = {
  keyword?: string;
  productTitle?: string;
  category?: string;
  region?: string;
  timeframe?: string;
};
