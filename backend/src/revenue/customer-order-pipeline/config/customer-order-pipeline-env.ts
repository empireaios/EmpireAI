import { z } from "zod";

const customerOrderPipelineEnvSchema = z.object({
  CUSTOMER_ORDER_PIPELINE_LIVE_FULFILLMENT_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  CUSTOMER_ORDER_PIPELINE_DEFAULT_INVENTORY_UNITS: z.coerce.number().default(100),
  CUSTOMER_ORDER_PIPELINE_SHIPPING_ESTIMATE_CENTS: z.coerce.number().default(599),
  CUSTOMER_ORDER_PIPELINE_AUTO_SANDBOX_TRACKING: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export type CustomerOrderPipelineEnv = z.infer<typeof customerOrderPipelineEnvSchema>;

export function loadCustomerOrderPipelineEnv(
  env: NodeJS.ProcessEnv = process.env,
): CustomerOrderPipelineEnv {
  return customerOrderPipelineEnvSchema.parse(env);
}
