export const OPERATIONS_ORDER_METRICS = [
  { label: "Orders today", value: "24", change: "Demo queue", trend: "neutral" as const },
  { label: "Processing", value: "3", change: "Awaiting fulfillment", trend: "neutral" as const },
  { label: "Shipped", value: "18", change: "On track", trend: "up" as const },
  { label: "Profit today", value: "+$1.2k", change: "Sandbox ledger", trend: "up" as const },
];

export const OPERATIONS_ORDERS = [
  { id: "ORD-1042", company: "Nova Home", product: "Ambient Lamp Pro", status: "processing", total: "$79.00" },
  { id: "ORD-1041", company: "Vertex SaaS", product: "Pro Plan", status: "shipped", total: "$149.00" },
  { id: "ORD-1040", company: "Nova Home", product: "Linen Throw Set", status: "delivered", total: "$54.00" },
];

export const OPERATIONS_FULFILLMENT_STEPS = [
  { step: "Prepare order", status: "complete", progress: 100 },
  { step: "Draft supplier submit", status: "in_progress", progress: 60 },
  { step: "Founder approve", status: "pending", progress: 0 },
  { step: "Submit to supplier", status: "pending", progress: 0 },
  { step: "Tracking update", status: "pending", progress: 0 },
];

export const OPERATIONS_SUPPORT_TICKETS = [
  { id: "TK-88", customer: "Alex M.", subject: "Delivery ETA for lamp order", priority: "medium", status: "open" },
  { id: "TK-87", customer: "Jordan K.", subject: "Return policy question", priority: "low", status: "pending" },
  { id: "TK-86", customer: "Sam R.", subject: "Product compatibility", priority: "high", status: "resolved" },
];
