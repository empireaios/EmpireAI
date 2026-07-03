/**
 * G7-05 — Grand King Revenue & Financial Operations Brain module contract.
 */

export const GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_MODULE_ID =
  "grand-king-revenue-financial-operations" as const;

export type GrandKingRevenueFinancialOperationsCapability =
  | "grand-king-revenue-financial-operations.overview"
  | "grand-king-revenue-financial-operations.summary"
  | "grand-king-revenue-financial-operations.dashboard"
  | "grand-king-revenue-financial-operations.profitability"
  | "grand-king-revenue-financial-operations.cash"
  | "grand-king-revenue-financial-operations.advertising"
  | "grand-king-revenue-financial-operations.subscriptions"
  | "grand-king-revenue-financial-operations.risk"
  | "grand-king-revenue-financial-operations.status";

export const GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_CAPABILITIES: GrandKingRevenueFinancialOperationsCapability[] =
  [
    "grand-king-revenue-financial-operations.overview",
    "grand-king-revenue-financial-operations.summary",
    "grand-king-revenue-financial-operations.dashboard",
    "grand-king-revenue-financial-operations.profitability",
    "grand-king-revenue-financial-operations.cash",
    "grand-king-revenue-financial-operations.advertising",
    "grand-king-revenue-financial-operations.subscriptions",
    "grand-king-revenue-financial-operations.risk",
    "grand-king-revenue-financial-operations.status",
  ];

export type GrandKingRevenueFinancialOperationsModuleContract = {
  moduleId: typeof GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_MODULE_ID;
  capabilities: GrandKingRevenueFinancialOperationsCapability[];
  missionId: "G7-05";
  programmeStatus: "revenue-financial-operations-established";
  integratesWith: [
    "grand-king-executive-decision-centre",
    "grand-king-business-automation-operations",
    "grand-king-commerce-operations",
    "grand-king-production-workspace",
    "grand-king-live-operations",
    "production-certification",
    "cockpit",
    "pillow",
    "ekls",
    "brain",
    "registry",
  ];
};

export function createGrandKingRevenueFinancialOperationsModuleContract(): GrandKingRevenueFinancialOperationsModuleContract {
  return {
    moduleId: GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_MODULE_ID,
    capabilities: GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_CAPABILITIES,
    missionId: "G7-05",
    programmeStatus: "revenue-financial-operations-established",
    integratesWith: [
      "grand-king-executive-decision-centre",
      "grand-king-business-automation-operations",
      "grand-king-commerce-operations",
      "grand-king-production-workspace",
      "grand-king-live-operations",
      "production-certification",
      "cockpit",
      "pillow",
      "ekls",
      "brain",
      "registry",
    ],
  };
}
