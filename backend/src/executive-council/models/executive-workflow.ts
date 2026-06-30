/** EC-006 — Permanent commercial workflow through Executive Council. */
export const EXECUTIVE_COMMERCIAL_WORKFLOW = [
  { stage: 1, id: "supplier", label: "Supplier", module: "supplier-intelligence" },
  { stage: 2, id: "cis", label: "Commerce Intelligence Studio", module: "commerce-intelligence-studio" },
  { stage: 3, id: "executive-council", label: "Executive Council", module: "executive-council" },
  { stage: 4, id: "soul-approval", label: "Soul Approval", module: "soul-file" },
  { stage: 5, id: "marketplace-runtime", label: "Marketplace Runtime", module: "commerce-runtime" },
  { stage: 6, id: "customer", label: "Customer", module: "customer-orders" },
  { stage: 7, id: "knowledge", label: "Knowledge", module: "empire-knowledge" },
  { stage: 8, id: "executive-learning", label: "Executive Learning", module: "executive-council" },
] as const;

export type ExecutiveWorkflowStage = (typeof EXECUTIVE_COMMERCIAL_WORKFLOW)[number];
