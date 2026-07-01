import type { UserRole } from "@/api/auth";

/**
 * Route path constants — EmpireAI E-commerce OS (Product Experience Phase 1)
 */
export const paths = {
  home: "/",
  login: "/login",

  dashboard: {
    root: "/dashboard",
    /** Mission-driven morning homepage */
    home: "/dashboard",
    /** Full executive command center */
    command: "/dashboard/command",
    /** Executive Debate — chiefs debate, Soul recommends, King decides */
    debate: "/dashboard/debate",
    /** Soul Decision Chamber — single synthesized recommendation (UX-013 · REAL-056) */
    soul: "/dashboard/soul",
    /** Approvals — Grand King decision queue */
    approvals: "/dashboard/approvals",
    /** King Decision History — logged verdicts, re-open to source (UX-015 · REAL-086) */
    kingHistory: "/dashboard/king-history",
    /** AI Team — executive-council registry of chiefs, dynamically rendered (UX-016 · REAL-031/032/033) */
    aiTeam: "/dashboard/ai-team",
    /** Profit & Operating Cost — net profit and governed spend (UX-010) */
    operatingCost: "/dashboard/operating-cost",
    /** Reports — executive summaries & exports */
    reports: "/dashboard/reports",
    /** Product Discovery — product candidate index (UX-005) */
    intelligence: "/dashboard/intelligence",
    /** Supplier Intelligence — supplier options, risk, sourcing (UX-006 · SUP) */
    suppliers: "/dashboard/suppliers",
    /** Marketplace Intelligence — country/marketplace comparison (UX-007 · REAL-072–076) */
    marketplaces: "/dashboard/marketplaces",
    /** Advertising — ROAS/spend efficiency, GC-02 gated spend (UX-008 · REAL-038) */
    advertising: "/dashboard/advertising",
    /** Expansion — ranked expansion targets, gated + profit-verified (UX-011 · REAL-065/089) */
    expansion: "/dashboard/expansion",
    /** Brand Workspace — business portfolio */
    brands: "/dashboard/brands",
    brandDetail: (opportunityId: string) => `/dashboard/brands/${opportunityId}`,
    businessPreview: (opportunityId: string) => `/dashboard/brands/${opportunityId}/preview`,
    /** Launch Mission */
    launch: "/dashboard/launch",
    /** Commerce Operations — orders & fulfillment */
    operations: "/dashboard/operations",
    /** Integrations Hub — external platform connectivity (UX-024 · REAL-051A) */
    integrations: "/dashboard/integrations",
    /** Infrastructure — ESIS system health (UX-020) */
    infrastructure: "/dashboard/infrastructure",
    infrastructureMarketplaces: "/dashboard/infrastructure/marketplaces",
    infrastructureSuppliers: "/dashboard/infrastructure/suppliers",
    infrastructurePayments: "/dashboard/infrastructure/payments",
    /** SUCCESS-001 Command Center — USD 100K net profit */
    success001: "/dashboard/success-001",
    /** Empire Settings */
    settings: "/dashboard/settings",
    settingsProfile: "/dashboard/settings/profile",
    /** Billing — plan, payment method, invoices (UX-022 · billing module) */
    billing: "/dashboard/billing",
    /** Commercial Explorer — REAL-066 entity index (UX-023) */
    explorer: "/dashboard/explorer",
    /** Pillow Executive Companion — persistent side panel (PILLOW-019) */
    pillow: "/dashboard/pillow",
    pillowLearning: "/dashboard/pillow/learning",

    // Legacy aliases (redirects)
    discovery: "/dashboard/intelligence",
    businesses: "/dashboard/brands",
    orders: "/dashboard/operations",
  },
} as const;

export type WorkspaceNavId =
  | "home"
  | "command"
  | "success001"
  | "debate"
  | "soul"
  | "approvals"
  | "kingHistory"
  | "aiTeam"
  | "intelligence"
  | "suppliers"
  | "marketplaces"
  | "advertising"
  | "expansion"
  | "brands"
  | "launch"
  | "operations"
  | "integrations"
  | "infrastructure"
  | "reports"
  | "operatingCost"
  | "settings"
  | "billing"
  | "explorer"
  | "pillow";

export interface WorkspaceNavItem {
  id: WorkspaceNavId;
  label: string;
  shortLabel?: string;
  path: string;
  end?: boolean;
  section?: "command" | "workspaces" | "system";
  /** When set, nav item is visible only for these roles (GC-01). */
  roles?: readonly UserRole[];
}

export const workspaceNavItems: WorkspaceNavItem[] = [
  { id: "home", label: "Mission Home", shortLabel: "Home", path: paths.dashboard.home, end: true, section: "command", roles: ["founder", "admin"] },
  { id: "command", label: "Empire Command Center", shortLabel: "Command", path: paths.dashboard.command, section: "command", roles: ["founder", "admin"] },
  { id: "success001", label: "SUCCESS-001", shortLabel: "SUCCESS", path: paths.dashboard.success001, section: "command", roles: ["founder", "admin"] },
  { id: "debate", label: "Executive Debate", shortLabel: "Debate", path: paths.dashboard.debate, section: "command", roles: ["founder", "admin"] },
  { id: "soul", label: "Soul Decision Chamber", shortLabel: "Soul", path: paths.dashboard.soul, section: "command", roles: ["founder", "admin"] },
  { id: "approvals", label: "Approvals Center", shortLabel: "Approvals", path: paths.dashboard.approvals, section: "command", roles: ["founder", "admin"] },
  { id: "pillow", label: "Executive Companion", shortLabel: "Pillow", path: paths.dashboard.pillow, section: "command", roles: ["founder", "admin"] },
  { id: "kingHistory", label: "King Decision History", shortLabel: "History", path: paths.dashboard.kingHistory, section: "command", roles: ["founder", "admin"] },
  { id: "aiTeam", label: "AI Team", shortLabel: "Team", path: paths.dashboard.aiTeam, section: "command", roles: ["founder", "admin"] },
  { id: "intelligence", label: "Product Discovery", shortLabel: "Products", path: paths.dashboard.intelligence, section: "workspaces", roles: ["founder", "admin"] },
  { id: "suppliers", label: "Supplier Intelligence", shortLabel: "Suppliers", path: paths.dashboard.suppliers, section: "workspaces", roles: ["founder", "admin"] },
  { id: "marketplaces", label: "Marketplace Intelligence", shortLabel: "Markets", path: paths.dashboard.marketplaces, section: "workspaces", roles: ["founder", "admin"] },
  { id: "advertising", label: "Advertising", shortLabel: "Ads", path: paths.dashboard.advertising, section: "workspaces", roles: ["founder", "admin"] },
  { id: "brands", label: "Brand Workspace", shortLabel: "Brands", path: paths.dashboard.brands, section: "workspaces" },
  { id: "launch", label: "Launch Mission", shortLabel: "Launch", path: paths.dashboard.launch, section: "workspaces" },
  { id: "operations", label: "Commerce Operations", shortLabel: "Ops", path: paths.dashboard.operations, section: "workspaces", roles: ["founder", "admin"] },
  { id: "expansion", label: "Expansion", shortLabel: "Expand", path: paths.dashboard.expansion, section: "workspaces", roles: ["founder", "admin"] },
  { id: "explorer", label: "Commercial Explorer", shortLabel: "Explorer", path: paths.dashboard.explorer, section: "workspaces", roles: ["founder", "admin"] },
  { id: "reports", label: "Reports", shortLabel: "Reports", path: paths.dashboard.reports, section: "system", roles: ["founder", "admin"] },
  { id: "operatingCost", label: "Profit & Operating Cost", shortLabel: "Profit", path: paths.dashboard.operatingCost, section: "system", roles: ["founder", "admin"] },
  { id: "integrations", label: "Integrations Hub", shortLabel: "Integrations", path: paths.dashboard.integrations, section: "system", roles: ["founder", "admin"] },
  { id: "infrastructure", label: "Infrastructure", shortLabel: "Infra", path: paths.dashboard.infrastructure, section: "system", roles: ["founder", "admin"] },
  { id: "billing", label: "Billing", shortLabel: "Billing", path: paths.dashboard.billing, section: "system", roles: ["founder", "admin"] },
  { id: "settings", label: "Empire Settings", shortLabel: "Settings", path: paths.dashboard.settings, section: "system" },
];

export const mobilePrimaryNavItems: WorkspaceNavItem[] = [
  { id: "home", label: "Home", path: paths.dashboard.home, end: true, roles: ["founder", "admin"] },
  { id: "brands", label: "Brands", path: paths.dashboard.brands, roles: ["operator"] },
  { id: "command", label: "Command", path: paths.dashboard.command, roles: ["founder", "admin"] },
  { id: "intelligence", label: "Products", path: paths.dashboard.intelligence, roles: ["founder", "admin"] },
  { id: "launch", label: "Launch", path: paths.dashboard.launch },
];

export const mobileMoreNavItems: WorkspaceNavItem[] = [
  { id: "brands", label: "Brand Workspace", path: paths.dashboard.brands, roles: ["founder", "admin"] },
  { id: "operations", label: "Commerce Operations", path: paths.dashboard.operations, roles: ["founder", "admin"] },
  { id: "integrations", label: "Integrations Hub", path: paths.dashboard.integrations, roles: ["founder", "admin"] },
  { id: "infrastructure", label: "Infrastructure", path: paths.dashboard.infrastructure, roles: ["founder", "admin"] },
  { id: "settings", label: "Empire Settings", path: paths.dashboard.settings },
];

/** @deprecated Use workspaceNavItems */
export type DashboardNavId = WorkspaceNavId;
/** @deprecated Use WorkspaceNavItem */
export type NavItem = WorkspaceNavItem;
/** @deprecated Use workspaceNavItems */
export const dashboardNavItems = workspaceNavItems;
