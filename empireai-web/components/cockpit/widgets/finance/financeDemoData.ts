export const FINANCE_METRICS = [
  { label: "Profit today", value: "+$4,280", change: "▲ 18%", trend: "up" as const },
  { label: "Profit MTD", value: "+$1.03M", change: "Demo ledger", trend: "up" as const },
  { label: "Net margin", value: "36.3%", change: "Portfolio", trend: "up" as const },
  { label: "Cash position", value: "$2.4M", change: "Treasury demo", trend: "neutral" as const },
];

export const FINANCE_REVENUE_ROWS = [
  { id: "r1", source: "Nova Home", channel: "DTC Store", amount: "$12.4k", period: "MTD" },
  { id: "r2", source: "Vertex SaaS", channel: "Subscriptions", amount: "$84.2k", period: "MTD" },
  { id: "r3", source: "Meridian Beauty", channel: "Marketplace", amount: "$0", period: "MTD" },
];

export const FINANCE_EXPENSE_ROWS = [
  { id: "e1", category: "Ad spend", amount: "$18.2k", trend: "up", status: "tracked" },
  { id: "e2", category: "COGS", amount: "$42.1k", trend: "neutral", status: "tracked" },
  { id: "e3", category: "Platform fees", amount: "$3.8k", trend: "neutral", status: "tracked" },
];

export const FINANCE_TREASURY_ACCOUNTS = [
  { id: "ta1", name: "Operating account", balance: "$840k", status: "active" },
  { id: "ta2", name: "Reserve fund", balance: "$1.2M", status: "active" },
  { id: "ta3", name: "Ad float", balance: "$360k", status: "allocated" },
];

export const FINANCE_PL_WATERFALL = [
  { label: "Revenue", value: "$1.24M" },
  { label: "COGS", value: "-$420k" },
  { label: "Ad spend", value: "-$182k" },
  { label: "Platform fees", value: "-$38k" },
  { label: "Net profit", value: "+$450k" },
];
