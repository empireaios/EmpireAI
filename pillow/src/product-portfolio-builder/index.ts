/** PILLOW-PPB-001 — Product Portfolio Builder exports (X1-08). */

export {
  ProductPortfolioBuilder,
  createProductPortfolioBuilder,
  resetProductPortfolioBuilderForTesting,
  type ProductPortfolioBuilderDependencies,
  type ProductPortfolioBuilderOptions,
} from "./engine.js";

export {
  buildProductPortfolioBuilderConfiguration,
  DEFAULT_PRODUCT_PORTFOLIO_BUILDER_CONFIGURATION,
  type ProductPortfolioBuilderConfiguration,
} from "./configuration.js";

export {
  PRODUCT_PORTFOLIO_BUILDER_SYSTEM_PATH,
  PPB_METADATA_VERSION,
  PRODUCT_PORTFOLIO_BUILDER_ID,
  PPB_CAPABILITIES,
} from "./paths.js";

export { appendPpbLog, getPpbLogs, resetPpbLogsForTesting } from "./ppb-logging.js";

export type {
  ProductPortfolioBuilderState,
  ProductPortfolioRecord,
  ProductPortfolioRunReport,
  ProductPortfolioEngineRecord,
  ProductPortfolioCockpitSnapshot,
  ProductPortfolioHealthReport,
  ProductPortfolioPerformanceStats,
  ConnectProductPortfolioBuilderInput,
  BuildPortfolioInput,
  PortfolioActionInput,
} from "./types.js";
