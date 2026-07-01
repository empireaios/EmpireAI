import { COCKPIT_BASE, type CockpitScreenId } from "@/lib/cockpit/types";

/** Auth screen — outside Cockpit route group but part of the canonical screen map. */
export type CockpitAuthScreenId = "SCR-000";

export type CockpitRegistryScreenId = CockpitScreenId | CockpitAuthScreenId;

export type CockpitRole = "founder" | "admin" | "operator";

export type CockpitNavIcon =
  | "home"
  | "command"
  | "missions"
  | "intelligence"
  | "commerce"
  | "operations"
  | "finance"
  | "workforce"
  | "infrastructure"
  | "governance"
  | "development";

/** Nine department groups plus executive command surfaces (REAL-079 IA). */
export type CockpitDepartmentId =
  | "executive"
  | "command"
  | "missions"
  | "intelligence"
  | "commerce"
  | "operations"
  | "finance"
  | "workforce"
  | "infrastructure"
  | "governance"
  | "development";

export type CockpitNavLevel = "primary" | "tab" | "detail" | "auth";

export type CockpitNavTab = {
  id: string;
  label: string;
  href: string;
  screenId: CockpitScreenId;
  department: CockpitDepartmentId;
  navLevel: "tab";
  roles?: readonly CockpitRole[];
};

export type CockpitNavItem = {
  id: string;
  label: string;
  href: string;
  screenId: CockpitScreenId;
  icon: CockpitNavIcon;
  department: CockpitDepartmentId;
  navLevel: "primary";
  roles?: readonly CockpitRole[];
  tabs?: readonly CockpitNavTab[];
};

export type CockpitScreenRoute = {
  screenId: CockpitRegistryScreenId;
  href: string;
  label: string;
  department: CockpitDepartmentId | "auth";
  navLevel: CockpitNavLevel;
  roles?: readonly CockpitRole[];
  /** Dynamic App Router segment (e.g. workspace detail). */
  dynamic?: boolean;
};

const founderAdmin: readonly CockpitRole[] = ["founder", "admin"];
const allRoles: readonly CockpitRole[] = ["founder", "admin", "operator"];

/**
 * Canonical sidebar navigation tree — REAL-080 Migration Plan §3.
 * Consumed by CockpitSidebar in REAL-084.
 */
export const cockpitNavigation = [
  {
    id: "home",
    label: "Executive Home",
    href: COCKPIT_BASE,
    screenId: "SCR-001",
    icon: "home",
    department: "executive",
    navLevel: "primary",
    roles: allRoles,
  },
  {
    id: "command",
    label: "Command Centre",
    href: `${COCKPIT_BASE}/command`,
    screenId: "SCR-010",
    icon: "command",
    department: "command",
    navLevel: "primary",
    roles: founderAdmin,
  },
  {
    id: "missions",
    label: "Mission Centre",
    href: `${COCKPIT_BASE}/missions`,
    screenId: "SCR-020",
    icon: "missions",
    department: "missions",
    navLevel: "primary",
    roles: founderAdmin,
  },
  {
    id: "intelligence",
    label: "Intelligence",
    href: `${COCKPIT_BASE}/intelligence/products`,
    screenId: "SCR-100",
    icon: "intelligence",
    department: "intelligence",
    navLevel: "primary",
    roles: allRoles,
    tabs: [
      {
        id: "products",
        label: "Products",
        href: `${COCKPIT_BASE}/intelligence/products`,
        screenId: "SCR-100",
        department: "intelligence",
        navLevel: "tab",
      },
      {
        id: "suppliers",
        label: "Suppliers",
        href: `${COCKPIT_BASE}/intelligence/suppliers`,
        screenId: "SCR-101",
        department: "intelligence",
        navLevel: "tab",
      },
      {
        id: "discovery",
        label: "Discovery",
        href: `${COCKPIT_BASE}/intelligence/discovery`,
        screenId: "SCR-102",
        department: "intelligence",
        navLevel: "tab",
      },
      {
        id: "marketplace",
        label: "Marketplace",
        href: `${COCKPIT_BASE}/intelligence/marketplace`,
        screenId: "SCR-103",
        department: "intelligence",
        navLevel: "tab",
      },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    href: `${COCKPIT_BASE}/commerce/store`,
    screenId: "SCR-200",
    icon: "commerce",
    department: "commerce",
    navLevel: "primary",
    roles: allRoles,
    tabs: [
      {
        id: "store",
        label: "Store",
        href: `${COCKPIT_BASE}/commerce/store`,
        screenId: "SCR-200",
        department: "commerce",
        navLevel: "tab",
      },
      {
        id: "launch",
        label: "Launch",
        href: `${COCKPIT_BASE}/commerce/launch`,
        screenId: "SCR-201",
        department: "commerce",
        navLevel: "tab",
      },
      {
        id: "marketing",
        label: "Marketing",
        href: `${COCKPIT_BASE}/commerce/marketing`,
        screenId: "SCR-202",
        department: "commerce",
        navLevel: "tab",
      },
      {
        id: "ads",
        label: "Ads",
        href: `${COCKPIT_BASE}/commerce/ads`,
        screenId: "SCR-203",
        department: "commerce",
        navLevel: "tab",
      },
      {
        id: "workspace",
        label: "Workspace",
        href: `${COCKPIT_BASE}/commerce/workspace`,
        screenId: "SCR-204",
        department: "commerce",
        navLevel: "tab",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    href: `${COCKPIT_BASE}/operations/orders`,
    screenId: "SCR-300",
    icon: "operations",
    department: "operations",
    navLevel: "primary",
    roles: allRoles,
    tabs: [
      {
        id: "orders",
        label: "Orders",
        href: `${COCKPIT_BASE}/operations/orders`,
        screenId: "SCR-300",
        department: "operations",
        navLevel: "tab",
      },
      {
        id: "fulfillment",
        label: "Fulfillment",
        href: `${COCKPIT_BASE}/operations/fulfillment`,
        screenId: "SCR-301",
        department: "operations",
        navLevel: "tab",
      },
      {
        id: "support",
        label: "Support",
        href: `${COCKPIT_BASE}/operations/support`,
        screenId: "SCR-302",
        department: "operations",
        navLevel: "tab",
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    href: `${COCKPIT_BASE}/finance/profit`,
    screenId: "SCR-400",
    icon: "finance",
    department: "finance",
    navLevel: "primary",
    roles: founderAdmin,
    tabs: [
      {
        id: "profit",
        label: "Profit",
        href: `${COCKPIT_BASE}/finance/profit`,
        screenId: "SCR-400",
        department: "finance",
        navLevel: "tab",
      },
      {
        id: "pl",
        label: "P&L",
        href: `${COCKPIT_BASE}/finance/pl`,
        screenId: "SCR-401",
        department: "finance",
        navLevel: "tab",
      },
      {
        id: "billing",
        label: "Billing",
        href: `${COCKPIT_BASE}/finance/billing`,
        screenId: "SCR-402",
        department: "finance",
        navLevel: "tab",
      },
      {
        id: "costs",
        label: "Costs",
        href: `${COCKPIT_BASE}/finance/costs`,
        screenId: "SCR-403",
        department: "finance",
        navLevel: "tab",
      },
    ],
  },
  {
    id: "workforce",
    label: "AI Workforce",
    href: `${COCKPIT_BASE}/workforce`,
    screenId: "SCR-500",
    icon: "workforce",
    department: "workforce",
    navLevel: "primary",
    roles: founderAdmin,
    tabs: [
      {
        id: "roster",
        label: "Roster",
        href: `${COCKPIT_BASE}/workforce`,
        screenId: "SCR-500",
        department: "workforce",
        navLevel: "tab",
      },
      {
        id: "activity",
        label: "Activity",
        href: `${COCKPIT_BASE}/workforce/activity`,
        screenId: "SCR-501",
        department: "workforce",
        navLevel: "tab",
      },
      {
        id: "audit",
        label: "Audit",
        href: `${COCKPIT_BASE}/workforce/audit`,
        screenId: "SCR-502",
        department: "workforce",
        navLevel: "tab",
      },
    ],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    href: `${COCKPIT_BASE}/infrastructure/integrations`,
    screenId: "SCR-600",
    icon: "infrastructure",
    department: "infrastructure",
    navLevel: "primary",
    roles: founderAdmin,
    tabs: [
      {
        id: "integrations",
        label: "Integrations",
        href: `${COCKPIT_BASE}/infrastructure/integrations`,
        screenId: "SCR-600",
        department: "infrastructure",
        navLevel: "tab",
      },
      {
        id: "deployments",
        label: "Deployments",
        href: `${COCKPIT_BASE}/infrastructure/deployments`,
        screenId: "SCR-601",
        department: "infrastructure",
        navLevel: "tab",
      },
      {
        id: "health",
        label: "Health",
        href: `${COCKPIT_BASE}/infrastructure/health`,
        screenId: "SCR-602",
        department: "infrastructure",
        navLevel: "tab",
      },
      {
        id: "admin",
        label: "Admin",
        href: `${COCKPIT_BASE}/infrastructure/admin`,
        screenId: "SCR-603",
        department: "infrastructure",
        navLevel: "tab",
        roles: ["admin"],
      },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    href: `${COCKPIT_BASE}/governance/settings`,
    screenId: "SCR-700",
    icon: "governance",
    department: "governance",
    navLevel: "primary",
    roles: allRoles,
    tabs: [
      {
        id: "settings",
        label: "Settings",
        href: `${COCKPIT_BASE}/governance/settings`,
        screenId: "SCR-700",
        department: "governance",
        navLevel: "tab",
      },
      {
        id: "soul",
        label: "Soul",
        href: `${COCKPIT_BASE}/governance/soul`,
        screenId: "SCR-701",
        department: "governance",
        navLevel: "tab",
        roles: founderAdmin,
      },
      {
        id: "decisions",
        label: "Decisions",
        href: `${COCKPIT_BASE}/governance/decisions`,
        screenId: "SCR-702",
        department: "governance",
        navLevel: "tab",
        roles: founderAdmin,
      },
      {
        id: "council",
        label: "Council",
        href: `${COCKPIT_BASE}/governance/council`,
        screenId: "SCR-703",
        department: "governance",
        navLevel: "tab",
        roles: founderAdmin,
      },
      {
        id: "v1",
        label: "V1 Certification",
        href: `${COCKPIT_BASE}/governance/v1`,
        screenId: "SCR-704",
        department: "governance",
        navLevel: "tab",
        roles: founderAdmin,
      },
    ],
  },
  {
    id: "development",
    label: "Development",
    href: `${COCKPIT_BASE}/development/pillow`,
    screenId: "SCR-800",
    icon: "development",
    department: "development",
    navLevel: "primary",
    roles: founderAdmin,
    tabs: [
      {
        id: "pillow",
        label: "Pillow",
        href: `${COCKPIT_BASE}/development/pillow`,
        screenId: "SCR-800",
        department: "development",
        navLevel: "tab",
      },
      {
        id: "approvals",
        label: "Approvals",
        href: `${COCKPIT_BASE}/development/approvals`,
        screenId: "SCR-801",
        department: "development",
        navLevel: "tab",
      },
      {
        id: "inspection",
        label: "Inspection",
        href: `${COCKPIT_BASE}/development/inspection`,
        screenId: "SCR-802",
        department: "development",
        navLevel: "tab",
      },
      {
        id: "learning",
        label: "Learning",
        href: `${COCKPIT_BASE}/development/learning`,
        screenId: "SCR-803",
        department: "development",
        navLevel: "tab",
      },
    ],
  },
] as const satisfies readonly CockpitNavItem[];

/** Flat route registry — REAL-079 master screen index + workspace detail route. */
export const cockpitScreenRoutes: readonly CockpitScreenRoute[] = [
  {
    screenId: "SCR-000",
    href: "/login",
    label: "Login",
    department: "auth",
    navLevel: "auth",
    roles: allRoles,
  },
  {
    screenId: "SCR-001",
    href: COCKPIT_BASE,
    label: "Executive Home",
    department: "executive",
    navLevel: "primary",
    roles: allRoles,
  },
  {
    screenId: "SCR-010",
    href: `${COCKPIT_BASE}/command`,
    label: "Command Centre",
    department: "command",
    navLevel: "primary",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-020",
    href: `${COCKPIT_BASE}/missions`,
    label: "Mission Centre",
    department: "missions",
    navLevel: "primary",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-100",
    href: `${COCKPIT_BASE}/intelligence`,
    label: "Intelligence",
    department: "intelligence",
    navLevel: "primary",
    roles: allRoles,
  },
  {
    screenId: "SCR-100",
    href: `${COCKPIT_BASE}/intelligence/products`,
    label: "Products",
    department: "intelligence",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-101",
    href: `${COCKPIT_BASE}/intelligence/suppliers`,
    label: "Suppliers",
    department: "intelligence",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-102",
    href: `${COCKPIT_BASE}/intelligence/discovery`,
    label: "Discovery",
    department: "intelligence",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-103",
    href: `${COCKPIT_BASE}/intelligence/marketplace`,
    label: "Marketplace",
    department: "intelligence",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-200",
    href: `${COCKPIT_BASE}/commerce`,
    label: "Commerce",
    department: "commerce",
    navLevel: "primary",
    roles: allRoles,
  },
  {
    screenId: "SCR-200",
    href: `${COCKPIT_BASE}/commerce/store`,
    label: "Store",
    department: "commerce",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-201",
    href: `${COCKPIT_BASE}/commerce/launch`,
    label: "Launch",
    department: "commerce",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-202",
    href: `${COCKPIT_BASE}/commerce/marketing`,
    label: "Marketing",
    department: "commerce",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-203",
    href: `${COCKPIT_BASE}/commerce/ads`,
    label: "Ads",
    department: "commerce",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-204",
    href: `${COCKPIT_BASE}/commerce/workspace`,
    label: "Business Workspace",
    department: "commerce",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-204",
    href: `${COCKPIT_BASE}/commerce/workspace/[id]`,
    label: "Business Detail",
    department: "commerce",
    navLevel: "detail",
    roles: allRoles,
    dynamic: true,
  },
  {
    screenId: "SCR-300",
    href: `${COCKPIT_BASE}/operations`,
    label: "Operations",
    department: "operations",
    navLevel: "primary",
    roles: allRoles,
  },
  {
    screenId: "SCR-300",
    href: `${COCKPIT_BASE}/operations/orders`,
    label: "Orders",
    department: "operations",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-301",
    href: `${COCKPIT_BASE}/operations/fulfillment`,
    label: "Fulfillment",
    department: "operations",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-302",
    href: `${COCKPIT_BASE}/operations/support`,
    label: "Support",
    department: "operations",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-400",
    href: `${COCKPIT_BASE}/finance`,
    label: "Finance",
    department: "finance",
    navLevel: "primary",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-400",
    href: `${COCKPIT_BASE}/finance/profit`,
    label: "Profit",
    department: "finance",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-401",
    href: `${COCKPIT_BASE}/finance/pl`,
    label: "P&L",
    department: "finance",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-402",
    href: `${COCKPIT_BASE}/finance/billing`,
    label: "Billing",
    department: "finance",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-403",
    href: `${COCKPIT_BASE}/finance/costs`,
    label: "Operating Costs",
    department: "finance",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-500",
    href: `${COCKPIT_BASE}/workforce`,
    label: "AI Workforce Roster",
    department: "workforce",
    navLevel: "primary",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-501",
    href: `${COCKPIT_BASE}/workforce/activity`,
    label: "Agent Activity",
    department: "workforce",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-502",
    href: `${COCKPIT_BASE}/workforce/audit`,
    label: "Audit Log",
    department: "workforce",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-600",
    href: `${COCKPIT_BASE}/infrastructure/integrations`,
    label: "Integrations",
    department: "infrastructure",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-601",
    href: `${COCKPIT_BASE}/infrastructure/deployments`,
    label: "Deployments",
    department: "infrastructure",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-602",
    href: `${COCKPIT_BASE}/infrastructure/health`,
    label: "Health",
    department: "infrastructure",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-603",
    href: `${COCKPIT_BASE}/infrastructure/admin`,
    label: "Admin Console",
    department: "infrastructure",
    navLevel: "tab",
    roles: ["admin"],
  },
  {
    screenId: "SCR-700",
    href: `${COCKPIT_BASE}/governance/settings`,
    label: "Settings",
    department: "governance",
    navLevel: "tab",
    roles: allRoles,
  },
  {
    screenId: "SCR-701",
    href: `${COCKPIT_BASE}/governance/soul`,
    label: "Soul Decision Chamber",
    department: "governance",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-702",
    href: `${COCKPIT_BASE}/governance/decisions`,
    label: "Decision History",
    department: "governance",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-703",
    href: `${COCKPIT_BASE}/governance/council`,
    label: "Executive Council",
    department: "governance",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-704",
    href: `${COCKPIT_BASE}/governance/v1`,
    label: "V1 Certification",
    department: "governance",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-800",
    href: `${COCKPIT_BASE}/development`,
    label: "Development",
    department: "development",
    navLevel: "primary",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-800",
    href: `${COCKPIT_BASE}/development/pillow`,
    label: "Pillow",
    department: "development",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-801",
    href: `${COCKPIT_BASE}/development/approvals`,
    label: "Approvals",
    department: "development",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-802",
    href: `${COCKPIT_BASE}/development/inspection`,
    label: "ESIS Inspection",
    department: "development",
    navLevel: "tab",
    roles: founderAdmin,
  },
  {
    screenId: "SCR-803",
    href: `${COCKPIT_BASE}/development/learning`,
    label: "Executive Learning",
    department: "development",
    navLevel: "tab",
    roles: founderAdmin,
  },
] as const;

/** Department-only entries from the navigation tree (8 IA departments). */
export const cockpitDepartmentNavigation = cockpitNavigation.filter(
  (item) =>
    item.department !== "executive" &&
    item.department !== "command" &&
    item.department !== "missions",
);

/** Executive command surfaces: Home, Command Centre, Mission Centre. */
export const cockpitCommandNavigation = cockpitNavigation.filter(
  (item) =>
    item.department === "executive" ||
    item.department === "command" ||
    item.department === "missions",
);

export function getCockpitNavItemById(id: string) {
  return cockpitNavigation.find((item) => item.id === id);
}

export function getCockpitScreenByHref(href: string) {
  return cockpitScreenRoutes.find((route) => route.href === href);
}

export function getCockpitScreenById(screenId: CockpitRegistryScreenId) {
  return cockpitScreenRoutes.filter((route) => route.screenId === screenId);
}

export function getCockpitDepartmentById(department: CockpitDepartmentId) {
  return cockpitNavigation.find((item) => item.department === department);
}

export function getCockpitNavTabs(departmentNavId: string) {
  const item = getCockpitNavItemById(departmentNavId);
  return item && "tabs" in item ? (item.tabs ?? []) : [];
}

/** All static hrefs declared in the navigation registry (excludes dynamic segments). */
export function getCockpitStaticHrefs() {
  return cockpitScreenRoutes.filter((route) => !route.dynamic).map((route) => route.href);
}
