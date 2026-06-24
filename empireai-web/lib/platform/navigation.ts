import type { PlatformModule } from "./types";

export const PLATFORM_BASE = "/platform";

export const platformModules: PlatformModule[] = [
  {
    id: "dashboard",
    label: "Founder Dashboard",
    shortLabel: "Dashboard",
    href: `${PLATFORM_BASE}/dashboard`,
    description: "Portfolio command center for every venture you manufacture.",
    category: "command",
  },
  {
    id: "ai-ceo",
    label: "AI CEO",
    href: `${PLATFORM_BASE}/ai-ceo`,
    description: "Strategic intelligence and autonomous executive decisions.",
    category: "command",
  },
  {
    id: "intelligence",
    label: "Product Intelligence",
    shortLabel: "Intelligence",
    href: `${PLATFORM_BASE}/intelligence`,
    description: "Market signals, product scoring, and demand forecasting.",
    category: "manufacturing",
  },
  {
    id: "suppliers",
    label: "Supplier Network",
    shortLabel: "Suppliers",
    href: `${PLATFORM_BASE}/suppliers`,
    description: "Global sourcing, fulfillment health, and auto-recovery.",
    category: "manufacturing",
  },
  {
    id: "store",
    label: "Store Builder",
    shortLabel: "Store",
    href: `${PLATFORM_BASE}/store`,
    description: "AI-built storefronts, catalogs, and brand systems.",
    category: "manufacturing",
  },
  {
    id: "marketing",
    label: "Marketing AI",
    shortLabel: "Marketing",
    href: `${PLATFORM_BASE}/marketing`,
    description: "Content, positioning, and channel strategy at scale.",
    category: "operations",
  },
  {
    id: "ads",
    label: "Ad Manager",
    shortLabel: "Ads",
    href: `${PLATFORM_BASE}/ads`,
    description: "Multi-channel campaigns, budgets, and ROAS optimization.",
    category: "operations",
  },
  {
    id: "finance",
    label: "Finance Dashboard",
    shortLabel: "Finance",
    href: `${PLATFORM_BASE}/finance`,
    description: "Portfolio P&L, cash flow, and capital allocation.",
    category: "operations",
  },
  {
    id: "orders",
    label: "Order Management",
    shortLabel: "Orders",
    href: `${PLATFORM_BASE}/orders`,
    description: "Fulfillment pipeline across every manufactured company.",
    category: "operations",
  },
  {
    id: "support",
    label: "Customer Support AI",
    shortLabel: "Support",
    href: `${PLATFORM_BASE}/support`,
    description: "Autonomous support agents and customer intelligence.",
    category: "operations",
  },
  {
    id: "settings",
    label: "Settings",
    href: `${PLATFORM_BASE}/settings`,
    description: "Workspace, integrations, security, and preferences.",
    category: "system",
  },
  {
    id: "admin",
    label: "Admin Console",
    shortLabel: "Admin",
    href: `${PLATFORM_BASE}/admin`,
    description: "Platform operations, tenants, and agent fleet control.",
    category: "system",
  },
];

export const primaryNavModules = platformModules.filter(
  (m) => m.id !== "settings" && m.id !== "admin",
);

export function getModuleById(id: string) {
  return platformModules.find((m) => m.id === id);
}
