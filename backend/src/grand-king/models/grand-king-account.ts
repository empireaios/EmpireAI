import { z } from "zod";

export const GrandKingProductSchema = z.object({
  productId: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  category: z.string(),
  status: z.enum(["DRAFT", "REVIEW", "LISTED", "PAUSED", "REMOVED"]),
  marginPercent: z.number(),
  listingScore: z.number().int().min(0).max(100),
  supplierName: z.string().optional(),
  updatedAt: z.string(),
});
export type GrandKingProduct = z.infer<typeof GrandKingProductSchema>;

export const GrandKingTaskSchema = z.object({
  taskId: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "BLOCKED"]),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  source: z.string(),
  dueAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GrandKingTask = z.infer<typeof GrandKingTaskSchema>;

export const GrandKingSupplierSchema = z.object({
  supplierId: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  platform: z.string(),
  status: z.enum(["CONNECTED", "PENDING", "DEGRADED", "DISCONNECTED"]),
  reliability: z.number(),
  avgShipDays: z.number(),
  updatedAt: z.string(),
});
export type GrandKingSupplier = z.infer<typeof GrandKingSupplierSchema>;

export const GrandKingOrderSchema = z.object({
  orderId: z.string(),
  workspaceId: z.string(),
  productName: z.string(),
  totalCents: z.number().int(),
  profitCents: z.number().int(),
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "REFUNDED"]),
  createdAt: z.string(),
});
export type GrandKingOrder = z.infer<typeof GrandKingOrderSchema>;

export const GrandKingAiDecisionSchema = z.object({
  decisionId: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  module: z.string(),
  status: z.enum(["PENDING", "APPROVED", "DENIED"]),
  confidence: z.number().int().min(0).max(100),
  rationale: z.string().optional(),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
});
export type GrandKingAiDecision = z.infer<typeof GrandKingAiDecisionSchema>;

export const GrandKingAccountDashboardSchema = z.object({
  accountId: z.literal("grand-king"),
  workspaceId: z.string(),
  companyId: z.string(),
  accountName: z.string(),
  products: z.array(GrandKingProductSchema),
  tasks: z.array(GrandKingTaskSchema),
  suppliers: z.array(GrandKingSupplierSchema),
  orders: z.array(GrandKingOrderSchema),
  aiDecisions: z.array(GrandKingAiDecisionSchema),
  summary: z.object({
    productCount: z.number(),
    pendingTasks: z.number(),
    supplierCount: z.number(),
    orderCount: z.number(),
    pendingDecisions: z.number(),
    revenueTodayCents: z.number(),
  }),
  computedAt: z.string(),
});
export type GrandKingAccountDashboard = z.infer<typeof GrandKingAccountDashboardSchema>;
