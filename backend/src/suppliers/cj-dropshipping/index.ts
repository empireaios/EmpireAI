export { loadCjConfig, hasCjCredentials, isCjLiveApiEnabled } from "./cj-config.js";
export type { CjConfig, CjIntegrationMode } from "./cj-config.js";

export { CjApiError, classifyCjApiResponse, classifyCjTransportError } from "./cj-error.js";
export type { CjErrorCode } from "./cj-error.js";

export { CjApiClient, createCjApiClient } from "./cj-api-client.js";
export type { CjRequestOptions } from "./cj-api-client.js";

export { CjRateLimiter } from "./cj-rate-limiter.js";

export { buildCjAuthHeaders, getCjAccessToken, clearCjAuthCache } from "./cj-auth.js";

export {
  mapCjProductToCatalogItem,
  mapCjProductToInventory,
  mapCjProductToPricing,
  mapCjFreightToShippingData,
  mapCjProductsToCatalogItems,
} from "./cj-catalog-mapper.js";

export { CJ_SANDBOX_PRODUCTS, getCjSandboxProducts } from "./cj-sandbox-fixtures.js";

export {
  syncCjCatalog,
  syncCjCatalogItems,
  syncCjInventory,
  syncCjPricing,
  syncCjShippingQuotes,
  checkCjHealth,
  syncCjSupplierCatalogBundle,
  resetCjHealthTelemetry,
} from "./cj-sync-service.js";

export type {
  CjAccessTokenResponse,
  CjProduct,
  CjProductVariant,
  CjWarehouseInventory,
  CjProductListResponse,
  CjProductQueryResponse,
  CjStockResponse,
  CjFreightCalculateRequest,
  CjFreightOption,
  CjFreightCalculateResponse,
  CjHealthCheckResult,
  CjCatalogSyncOptions,
  CjCatalogSyncResult,
} from "./cj-types.js";

export const CJ_API_ENDPOINTS = {
  AUTH_TOKEN: "/authentication/getAccessToken",
  PRODUCT_LIST: "/product/list",
  PRODUCT_QUERY: "/product/query",
  STOCK_BY_PID: "/product/stock/queryByPid",
  FREIGHT_CALCULATE: "/logistic/freightCalculate",
} as const;

export {
  createCjOrderClient,
  CjOrderClient,
  CJ_ORDER_ENDPOINTS as CJ_ORDER_FULFILLMENT_ENDPOINTS,
  buildOrderPayload,
  validateOrder as validateCjOrder,
  requireApprovedForSubmit,
  evaluateFulfillmentHealth,
  resetFulfillmentHealthTelemetry,
  syncSandboxTracking,
  applyTrackingSync,
} from "./orders/index.js";
export type {
  CjOrderPayload,
  CjOrderSubmissionResult,
  CjFulfillmentEstimate,
  CjOrderApprovalInput,
  FulfillmentHealthReport,
  TrackingSyncResult,
} from "./orders/index.js";
