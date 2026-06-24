/**
 * Route path constants — aligned with docs/NAVIGATION.md
 */
export const paths = {
  home: "/",
  login: "/login",
  signup: "/signup",
  support: "/support",

  setup: {
    category: "/setup/category",
    products: "/setup/products",
    productsResearch: "/setup/products/research",
    brand: "/setup/brand",
    progress: "/setup/progress",
    launch: "/setup/launch",
  },

  dashboard: {
    root: "/dashboard",
    profit: "/dashboard/profit",
    orders: "/dashboard/orders",
    orderDetail: (orderId: string) => `/dashboard/orders/${orderId}`,
    ads: "/dashboard/ads",
    suppliers: "/dashboard/suppliers",
    aiTeam: "/dashboard/ai-team",
    aiEmployee: (slug: string) => `/dashboard/ai-team/${slug}`,
    intelligence: "/dashboard/intelligence",
    intelligenceProducts: "/dashboard/intelligence/products",
    intelligenceProduct: (productId: string) =>
      `/dashboard/intelligence/products/${productId}`,
    billing: "/dashboard/billing",
    settings: "/dashboard/settings",
    settingsAccount: "/dashboard/settings/account",
    settingsStore: "/dashboard/settings/store",
    settingsNotifications: "/dashboard/settings/notifications",
    settingsSecurity: "/dashboard/settings/security",
  },
} as const;

export type DashboardNavId =
  | "home"
  | "orders"
  | "ads"
  | "suppliers"
  | "ai-team"
  | "intelligence"
  | "billing"
  | "settings";

export interface NavItem {
  id: DashboardNavId;
  label: string;
  path: string;
  end?: boolean;
}

/** Sidebar navigation — docs/NAVIGATION.md */
export const dashboardNavItems: NavItem[] = [
  { id: "home", label: "Home", path: paths.dashboard.profit, end: true },
  { id: "orders", label: "Orders", path: paths.dashboard.orders },
  { id: "ads", label: "Ads", path: paths.dashboard.ads },
  { id: "suppliers", label: "Suppliers", path: paths.dashboard.suppliers },
  { id: "ai-team", label: "AI Team", path: paths.dashboard.aiTeam },
  {
    id: "intelligence",
    label: "Intelligence",
    path: paths.dashboard.intelligence,
  },
  { id: "billing", label: "Billing", path: paths.dashboard.billing },
  { id: "settings", label: "Settings", path: paths.dashboard.settings },
];

export const mobilePrimaryNavItems: NavItem[] = [
  { id: "home", label: "Home", path: paths.dashboard.profit, end: true },
  { id: "orders", label: "Orders", path: paths.dashboard.orders },
  { id: "ads", label: "Ads", path: paths.dashboard.ads },
  { id: "ai-team", label: "AI", path: paths.dashboard.aiTeam },
];

export const mobileMoreNavItems: NavItem[] = [
  { id: "suppliers", label: "Suppliers", path: paths.dashboard.suppliers },
  {
    id: "intelligence",
    label: "Intelligence",
    path: paths.dashboard.intelligence,
  },
  { id: "billing", label: "Billing", path: paths.dashboard.billing },
  { id: "settings", label: "Settings", path: paths.dashboard.settings },
];
