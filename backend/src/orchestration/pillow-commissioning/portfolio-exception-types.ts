/** Shared portfolio exception types (avoid circular imports). */

export type MonitoringTier = "HOT" | "ACTIVE" | "COLD" | "WATCH" | "UNKNOWN";

export type PortfolioExceptionCode =
  | "STOCK_OUT"
  | "COST_CHANGE"
  | "MARGIN_BREACH"
  | "LISTING_FAILURE"
  | "BUYABLE_FAILURE"
  | "PRICE_POSITION_CHANGE"
  | "ZERO_SALES_REVIEW"
  | "RETURN_ANOMALY"
  | "DELIVERY_DETERIORATION"
  | "DATA_STALE"
  | "POLICY_RISK"
  | "SUPPLIER_FAILURE"
  | "QUALIFICATION_GAP"
  | "NO_AMAZON_ASIN";

export type AggregatedPortfolioException = {
  code: PortfolioExceptionCode;
  title: string;
  affectedCount: number;
  corridor: string;
  firstDetectedAt: string | null;
  economicExposureUsd: number | null;
  confidence: "high" | "medium" | "low" | "unknown";
  recommendedPriority: number;
  autoResolvable: boolean;
  pillowJudgmentRequired: boolean;
};
