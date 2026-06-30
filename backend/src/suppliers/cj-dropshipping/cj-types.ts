/** CJ Dropshipping API authentication token response. */
export type CjAccessTokenResponse = {
  code: number;
  result: boolean;
  message: string;
  data?: {
    accessToken?: string;
    accessTokenExpiryDate?: number;
    refreshToken?: string;
    refreshTokenExpiryDate?: number;
    createDate?: string;
  };
  requestId?: string;
};

/** CJ product variant from API responses. */
export type CjProductVariant = {
  vid: string;
  sku: string;
  variantName?: string;
  variantKey?: string;
  variantImage?: string;
  sellPrice?: number;
  suggestSellPrice?: number;
  weight?: number;
  inventory?: number;
  warehouseInventory?: CjWarehouseInventory[];
};

export type CjWarehouseInventory = {
  warehouseCode?: string;
  warehouseName?: string;
  region?: string;
  inventory?: number;
};

/** CJ product record from list/query endpoints. */
export type CjProduct = {
  pid: string;
  productName: string;
  productNameEn?: string;
  productSku?: string;
  productImage?: string;
  productImageSet?: string[];
  productWeight?: number;
  categoryId?: string;
  categoryName?: string;
  sellPrice?: number;
  suggestSellPrice?: number;
  description?: string;
  remark?: string;
  tags?: string[];
  variants?: CjProductVariant[];
  status?: number;
};

export type CjProductListResponse = {
  code: number;
  result: boolean;
  message: string;
  data?: {
    list?: CjProduct[];
    pageNum?: number;
    pageSize?: number;
    total?: number;
  };
};

export type CjProductQueryResponse = {
  code: number;
  result: boolean;
  message: string;
  data?: CjProduct;
};

export type CjStockResponse = {
  code: number;
  result: boolean;
  message: string;
  data?: Array<{
    sku?: string;
    vid?: string;
    inventory?: number;
    warehouseInventory?: CjWarehouseInventory[];
  }>;
};

export type CjFreightCalculateRequest = {
  startCountryCode: string;
  endCountryCode: string;
  products: Array<{
    quantity: number;
    vid: string;
  }>;
};

export type CjFreightOption = {
  logisticName?: string;
  logisticPrice?: number;
  logisticPriceCn?: number;
  logisticAging?: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
  countryCode?: string;
};

export type CjFreightCalculateResponse = {
  code: number;
  result: boolean;
  message: string;
  data?: CjFreightOption[];
};

export type CjHealthCheckResult = {
  apiReachable: boolean;
  credentialsConfigured: boolean;
  integrationMode: "SANDBOX" | "LIVE";
  healthState: "READY" | "DEGRADED" | "FAILED";
  message: string;
  lastSuccessfulSync: string | null;
  lastFailureReason: string | null;
};

export type CjCatalogSyncOptions = {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  destinationCountryCode?: string;
};

export type CjCatalogSyncResult = {
  products: CjProduct[];
  integrationMode: "SANDBOX" | "LIVE";
  source: "sandbox-fixture" | "live-api";
  syncedAt: string;
};
