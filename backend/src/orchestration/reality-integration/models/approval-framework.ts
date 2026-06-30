import { z } from "zod";

/** REAL-003 — Human approval framework for irreversible actions. */
export const IRREVERSIBLE_ACTIONS = [
  "publish_product",
  "launch_ads",
  "capture_payment",
  "refund",
  "cancel_order",
  "delete_listing",
  "charge_customer",
  "modify_inventory",
  "send_fulfillment",
  "delete_account",
  "activate_runtime",
] as const;

export type IrreversibleAction = (typeof IRREVERSIBLE_ACTIONS)[number];

export const APPROVAL_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type ApprovalRiskLevel = (typeof APPROVAL_RISK_LEVELS)[number];

export const approvalPolicySchema = z.object({
  action: z.enum(IRREVERSIBLE_ACTIONS),
  displayName: z.string(),
  requiresFounderApproval: z.boolean(),
  requiresGovernanceCheck: z.boolean(),
  riskLevel: z.enum(APPROVAL_RISK_LEVELS),
  rationale: z.string(),
  applicableProviderCategories: z.array(z.string()),
  cooldownMinutes: z.number().int().min(0).optional(),
});

export const approvalAssessmentSchema = z.object({
  action: z.enum(IRREVERSIBLE_ACTIONS),
  providerId: z.string().optional(),
  approved: z.boolean(),
  requiresHumanApproval: z.boolean(),
  requiresGovernanceCheck: z.boolean(),
  riskLevel: z.enum(APPROVAL_RISK_LEVELS),
  reason: z.string(),
  policyId: z.string(),
});

export type ApprovalPolicy = z.infer<typeof approvalPolicySchema>;
export type ApprovalAssessment = z.infer<typeof approvalAssessmentSchema>;

export const APPROVAL_POLICIES: ApprovalPolicy[] = [
  { action: "publish_product", displayName: "Publish Product", requiresFounderApproval: true, requiresGovernanceCheck: true, riskLevel: "HIGH", rationale: "Listing changes are publicly visible and may trigger marketplace policy review", applicableProviderCategories: ["commerce"], cooldownMinutes: 0 },
  { action: "launch_ads", displayName: "Launch Ads", requiresFounderApproval: true, requiresGovernanceCheck: true, riskLevel: "CRITICAL", rationale: "Ad spend is irreversible and consumes budget immediately", applicableProviderCategories: ["advertising"], cooldownMinutes: 60 },
  { action: "capture_payment", displayName: "Capture Payment", requiresFounderApproval: true, requiresGovernanceCheck: true, riskLevel: "CRITICAL", rationale: "Payment capture triggers financial liability and chargeback exposure", applicableProviderCategories: ["payments"], cooldownMinutes: 0 },
  { action: "refund", displayName: "Issue Refund", requiresFounderApproval: true, requiresGovernanceCheck: true, riskLevel: "HIGH", rationale: "Refunds reduce revenue and may affect seller metrics", applicableProviderCategories: ["payments"], cooldownMinutes: 0 },
  { action: "cancel_order", displayName: "Cancel Order", requiresFounderApproval: true, requiresGovernanceCheck: true, riskLevel: "HIGH", rationale: "Order cancellation affects fulfillment and customer trust", applicableProviderCategories: ["commerce", "suppliers"], cooldownMinutes: 0 },
  { action: "delete_listing", displayName: "Delete Listing", requiresFounderApproval: true, requiresGovernanceCheck: true, riskLevel: "HIGH", rationale: "Listing deletion removes catalog visibility and ranking history", applicableProviderCategories: ["commerce"], cooldownMinutes: 0 },
  { action: "charge_customer", displayName: "Charge Customer", requiresFounderApproval: true, requiresGovernanceCheck: true, riskLevel: "CRITICAL", rationale: "Direct charges require PCI compliance and dispute handling", applicableProviderCategories: ["payments"], cooldownMinutes: 0 },
  { action: "modify_inventory", displayName: "Modify Inventory", requiresFounderApproval: false, requiresGovernanceCheck: true, riskLevel: "MEDIUM", rationale: "Inventory changes affect fulfillment but are reversible", applicableProviderCategories: ["commerce", "suppliers"], cooldownMinutes: 0 },
  { action: "send_fulfillment", displayName: "Send Fulfillment", requiresFounderApproval: true, requiresGovernanceCheck: true, riskLevel: "HIGH", rationale: "Fulfillment dispatch commits supplier cost and shipping liability", applicableProviderCategories: ["suppliers"], cooldownMinutes: 0 },
  { action: "delete_account", displayName: "Delete Account", requiresFounderApproval: true, requiresGovernanceCheck: true, riskLevel: "CRITICAL", rationale: "Account deletion is permanent and may violate data retention policies", applicableProviderCategories: ["commerce", "payments", "advertising"], cooldownMinutes: 1440 },
  { action: "activate_runtime", displayName: "Activate Runtime Plugin", requiresFounderApproval: true, requiresGovernanceCheck: true, riskLevel: "HIGH", rationale: "Runtime activation enables live commerce automation for a connected marketplace provider", applicableProviderCategories: ["commerce"], cooldownMinutes: 0 },
];
