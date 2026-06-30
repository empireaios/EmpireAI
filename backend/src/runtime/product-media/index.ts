export { productMediaPackageSchema } from "./models/product-media-package.js";
export type { ProductMediaPackage } from "./models/product-media-package.js";

export { buildProductMediaIntelligence } from "./services/product-media-service.js";

export { registerProductMediaRoutes } from "./routes/product-media-routes.js";
export { productMediaTools } from "./tools/product-media-tools.js";

export const PRODUCT_MEDIA_MODULE_ID = "product-media" as const;
export const PRODUCT_MEDIA_MISSION_IDS = ["REAL-005"] as const;
