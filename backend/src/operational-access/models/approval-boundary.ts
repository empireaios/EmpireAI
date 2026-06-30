import { z } from "zod";

/** OAR-004 — Approval boundary classification. */
export const APPROVAL_BOUNDARY_TYPES = [
  "safe_automatic",
  "requires_king_approval",
  "requires_external_verification",
  "forbidden",
] as const;

export type ApprovalBoundaryType = (typeof APPROVAL_BOUNDARY_TYPES)[number];

export const ACTION_BOUNDARIES = [
  "connect_platform",
  "verify_credentials",
  "read_catalog",
  "sync_inventory",
  "publish_listing",
  "update_listing",
  "delete_listing",
  "create_order",
  "refund_order",
  "fulfill_order",
  "launch_ads",
  "capture_payment",
  "issue_payout",
  "activate_runtime",
  "revoke_credentials",
  "deploy_production",
] as const;

export type ActionBoundary = (typeof ACTION_BOUNDARIES)[number];

export const actionBoundarySchema = z.object({
  action: z.enum(ACTION_BOUNDARIES),
  displayName: z.string(),
  boundary: z.enum(APPROVAL_BOUNDARY_TYPES),
  rationale: z.string(),
  applicablePlatforms: z.array(z.string()),
});

export type ActionBoundaryRule = z.infer<typeof actionBoundarySchema>;

export const ACTION_BOUNDARY_RULES: ActionBoundaryRule[] = [
  { action: "connect_platform", displayName: "Connect Platform", boundary: "requires_king_approval", rationale: "External credential storage requires founder awareness", applicablePlatforms: ["*"] },
  { action: "verify_credentials", displayName: "Verify Credentials", boundary: "safe_automatic", rationale: "Read-only validation", applicablePlatforms: ["*"] },
  { action: "read_catalog", displayName: "Read Catalog", boundary: "safe_automatic", rationale: "Non-destructive read", applicablePlatforms: ["amazon-seller", "cj-dropshipping", "ebay", "shopee", "lazada"] },
  { action: "sync_inventory", displayName: "Sync Inventory", boundary: "requires_king_approval", rationale: "Inventory changes affect fulfillment", applicablePlatforms: ["amazon-seller", "cj-dropshipping"] },
  { action: "publish_listing", displayName: "Publish Listing", boundary: "requires_king_approval", rationale: "Public listing changes", applicablePlatforms: ["amazon-seller", "ebay", "shopee", "lazada", "tiktok-shop", "walmart", "etsy"] },
  { action: "update_listing", displayName: "Update Listing", boundary: "requires_king_approval", rationale: "Visible catalog mutation", applicablePlatforms: ["amazon-seller", "ebay"] },
  { action: "delete_listing", displayName: "Delete Listing", boundary: "forbidden", rationale: "Irreversible without explicit founder override policy", applicablePlatforms: ["*"] },
  { action: "create_order", displayName: "Create Supplier Order", boundary: "requires_king_approval", rationale: "Commits supplier cost", applicablePlatforms: ["cj-dropshipping"] },
  { action: "refund_order", displayName: "Refund Order", boundary: "requires_king_approval", rationale: "Financial liability", applicablePlatforms: ["stripe", "paypal", "amazon-seller"] },
  { action: "fulfill_order", displayName: "Fulfill Order", boundary: "requires_king_approval", rationale: "Shipping commitment", applicablePlatforms: ["cj-dropshipping", "amazon-seller"] },
  { action: "launch_ads", displayName: "Launch Ads", boundary: "requires_king_approval", rationale: "Ad spend is irreversible", applicablePlatforms: ["meta-ads"] },
  { action: "capture_payment", displayName: "Capture Payment", boundary: "requires_king_approval", rationale: "PCI and chargeback exposure", applicablePlatforms: ["stripe", "paypal"] },
  { action: "issue_payout", displayName: "Issue Payout", boundary: "forbidden", rationale: "Manual treasury action only", applicablePlatforms: ["stripe", "paypal"] },
  { action: "activate_runtime", displayName: "Activate Runtime", boundary: "requires_king_approval", rationale: "Enables live commerce automation", applicablePlatforms: ["amazon-seller", "shopify"] },
  { action: "revoke_credentials", displayName: "Revoke Credentials", boundary: "requires_king_approval", rationale: "Disconnects live access", applicablePlatforms: ["*"] },
  { action: "deploy_production", displayName: "Deploy Production", boundary: "requires_external_verification", rationale: "Vercel / GitHub human deployment approval", applicablePlatforms: ["vercel", "github"] },
];

export function classifyAction(action: ActionBoundary, platformId: string): ActionBoundaryRule | undefined {
  return ACTION_BOUNDARY_RULES.find(
    (r) => r.action === action && (r.applicablePlatforms.includes("*") || r.applicablePlatforms.includes(platformId)),
  );
}

export function listBoundariesForPlatform(platformId: string): ActionBoundaryRule[] {
  return ACTION_BOUNDARY_RULES.filter(
    (r) => r.applicablePlatforms.includes("*") || r.applicablePlatforms.includes(platformId),
  );
}
