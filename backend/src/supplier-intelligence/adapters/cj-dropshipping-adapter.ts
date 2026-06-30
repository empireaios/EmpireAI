import { z } from "zod";

/** SUP-003 — CJdropshipping adapter skeleton (architecture only; no fake live API). */
export const CJ_ADAPTER_OPERATIONS = [
  "product_search",
  "product_detail",
  "shipping_estimate",
  "inventory",
  "order_create",
  "tracking",
] as const;

export type CjAdapterOperation = (typeof CJ_ADAPTER_OPERATIONS)[number];

export const cjAdapterOperationSchema = z.object({
  operation: z.enum(CJ_ADAPTER_OPERATIONS),
  supported: z.boolean(),
  liveReady: z.boolean(),
  requiresCredentials: z.boolean(),
  requiresFounderApproval: z.boolean(),
  apiPath: z.string(),
  description: z.string(),
});

export type CjAdapterOperationMap = z.infer<typeof cjAdapterOperationSchema>;

export const CJ_ADAPTER_OPERATION_MAP: CjAdapterOperationMap[] = [
  { operation: "product_search", supported: true, liveReady: false, requiresCredentials: true, requiresFounderApproval: false, apiPath: "/product/list", description: "Search CJ catalog by keyword/category" },
  { operation: "product_detail", supported: true, liveReady: false, requiresCredentials: true, requiresFounderApproval: false, apiPath: "/product/query", description: "Fetch product detail by CJ product ID" },
  { operation: "shipping_estimate", supported: true, liveReady: false, requiresCredentials: true, requiresFounderApproval: false, apiPath: "/logistic/freightCalculate", description: "Estimate shipping cost and delivery window" },
  { operation: "inventory", supported: true, liveReady: false, requiresCredentials: true, requiresFounderApproval: false, apiPath: "/product/stock", description: "Check variant inventory levels" },
  { operation: "order_create", supported: true, liveReady: false, requiresCredentials: true, requiresFounderApproval: true, apiPath: "/shopping/order/createOrder", description: "Create supplier order — blocked until founder approval + live credentials" },
  { operation: "tracking", supported: true, liveReady: false, requiresCredentials: true, requiresFounderApproval: false, apiPath: "/logistic/trackInfo", description: "Sync tracking after order submission" },
];

export const cjAdapterSkeletonSchema = z.object({
  providerId: z.literal("cj-dropshipping"),
  missionId: z.literal("SUP-003"),
  displayName: z.literal("CJdropshipping"),
  architectureOnly: z.literal(true),
  authority: z.literal("empire_intelligence"),
  operations: z.array(cjAdapterOperationSchema),
  blockers: z.array(z.string()),
  computedAt: z.string().datetime({ offset: true }),
});

export type CjAdapterSkeleton = z.infer<typeof cjAdapterSkeletonSchema>;

/** Returns CJ adapter skeleton — never returns mock product data as live. */
export function buildCjAdapterSkeleton(hasCredentials: boolean): CjAdapterSkeleton {
  const blockers: string[] = [];
  if (!hasCredentials) blockers.push("CJ API key not in credential vault");
  blockers.push("Live API execution blocked — architecture skeleton only");
  blockers.push("Order create requires founder approval");

  const operations = CJ_ADAPTER_OPERATION_MAP.map((op) => ({
    ...op,
    liveReady: hasCredentials && op.operation !== "order_create" ? false : false,
  }));

  return {
    providerId: "cj-dropshipping",
    missionId: "SUP-003",
    displayName: "CJdropshipping",
    architectureOnly: true,
    authority: "empire_intelligence",
    operations,
    blockers,
    computedAt: new Date().toISOString(),
  };
}
