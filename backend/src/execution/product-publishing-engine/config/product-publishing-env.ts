import { z } from "zod";

import { isCjLiveCommerceActivated } from "../../../orchestration/version-1-activation/version-1-activation-config.js";

const productPublishingEnvSchema = z.object({
  PRODUCT_PUBLISHING_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  PRODUCT_PUBLISHING_LIVE_SUPPLIER_SYNC: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  PRODUCT_PUBLISHING_MOCK: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  PRODUCT_PUBLISHING_LOW_STOCK_THRESHOLD: z.coerce.number().int().min(1).default(5),
  PRODUCT_PUBLISHING_DEFAULT_MARKUP: z.coerce.number().min(1).default(2.2),
});

export type ProductPublishingEnv = z.infer<typeof productPublishingEnvSchema>;

export function loadProductPublishingEnv(
  env: NodeJS.ProcessEnv = process.env,
): ProductPublishingEnv {
  const parsed = productPublishingEnvSchema.parse(env);
  const apiKey = env.CJ_DROPSHIPPING_API_KEY ?? env.CJ_API_KEY;
  const apiSecret = env.CJ_DROPSHIPPING_API_SECRET ?? env.CJ_API_SECRET;
  const hasCjCredentials = Boolean(apiKey && apiSecret);
  const liveActivated = isCjLiveCommerceActivated(env);
  const mockMode =
    parsed.PRODUCT_PUBLISHING_MOCK ||
    (!hasCjCredentials && !liveActivated) ||
    (!parsed.PRODUCT_PUBLISHING_LIVE_SUPPLIER_SYNC && !liveActivated);

  return {
    ...parsed,
    PRODUCT_PUBLISHING_LIVE_SUPPLIER_SYNC:
      parsed.PRODUCT_PUBLISHING_LIVE_SUPPLIER_SYNC || liveActivated,
    PRODUCT_PUBLISHING_MOCK: mockMode,
  };
}

export function isProductPublishingEnabled(config: ProductPublishingEnv): boolean {
  return config.PRODUCT_PUBLISHING_ENABLED;
}

export function isLiveSupplierSyncAllowed(config: ProductPublishingEnv): boolean {
  return config.PRODUCT_PUBLISHING_LIVE_SUPPLIER_SYNC && !config.PRODUCT_PUBLISHING_MOCK;
}
