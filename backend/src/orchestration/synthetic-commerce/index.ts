/**
 * Synthetic Amazon US Commerce Foundation V1
 *
 * Controlled fixtures + deterministic rails for Pillow playground economics.
 * Does NOT touch live Amazon / CJ / Stripe adapters.
 */

export type {
  CostCentre,
  CostCentreKind,
  SourceLabel,
  MoneyCurrency,
  MarketplaceCurrency,
  OperatingCurrency,
  TrueProfitLedger,
  TrueProfitLedgerEntry,
  TrueProfitLedgerTotals,
  TrueProfitLedgerLineInputs,
  EligibilityHardStop,
  EligibilityRiskFilter,
  UnitEconomics,
  SyntheticExperimentRecord,
  SyntheticExperimentStatus,
  PortfolioState,
  PortfolioCandidate,
  PortfolioCandidateState,
  SyntheticSupplier,
  SyntheticSupplierApiCapability,
  SyntheticWarehouse,
  SyntheticProduct,
  SyntheticVariant,
  SyntheticStockSnapshot,
  SyntheticOrder,
  SyntheticOrderStatus,
  SyntheticAmazonUsCatalog,
  ForbiddenLiveLedgerFields,
} from "./types.js";

export {
  SYNTHETIC_MARKETPLACE,
  MARKETPLACE_CURRENCY,
  COST_CENTRE_KINDS,
  ELIGIBILITY_HARD_STOPS,
  PORTFOLIO_CANDIDATE_STATES,
} from "./types.js";

export {
  computeProfitLedger,
  realisedNetProfitFromLines,
  moneyRound,
  assertLedgerHasNoLiveFields,
  SyntheticLedgerError,
} from "./ledger.js";

export {
  evaluateEligibilityRiskFilter,
  eligibilityFromProduct,
  type EligibilitySignals,
} from "./eligibility.js";

export {
  computeUnitEconomics,
  unitEconomicsFromProduct,
  type UnitEconomicsInput,
} from "./unit-economics.js";

export { seedSyntheticAmazonUsCatalog } from "./fixtures.js";
