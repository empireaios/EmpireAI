import { workspaceNavItems } from "@/routes/paths";
import type {
  PillowPageContextOverride,
  PillowWorkspaceContext,
} from "@/types/pillow-workspace-context";

type ScreenMeta = {
  screenId: string;
  screenTitle: string;
  uxId?: string;
  purpose?: string;
  module?: string;
  extensionId?: string;
};

const EXTENSION_SCREENS: Array<{ prefix: string; meta: ScreenMeta }> = [
  {
    prefix: "/dashboard/infrastructure/marketplaces",
    meta: {
      screenId: "extension-marketplace",
      screenTitle: "Marketplace Connectors",
      uxId: "UX-020",
      purpose: "Amazon, Shopify, and marketplace portals",
      extensionId: "marketplace-portal",
      module: "marketplace-infrastructure",
    },
  },
  {
    prefix: "/dashboard/infrastructure/suppliers",
    meta: {
      screenId: "extension-supplier",
      screenTitle: "Supplier Connectors",
      uxId: "UX-020",
      purpose: "CJ Dropshipping and supplier portals",
      extensionId: "supplier-portal",
      module: "supplier-intelligence",
    },
  },
  {
    prefix: "/dashboard/infrastructure/payments",
    meta: {
      screenId: "extension-payments",
      screenTitle: "Payment Connectors",
      uxId: "UX-020",
      purpose: "Stripe, PayPal, and payment rails",
      extensionId: "payments-portal",
      module: "reality-integration",
    },
  },
  {
    prefix: "/dashboard/integrations",
    meta: {
      screenId: "integrations-hub",
      screenTitle: "Integrations Hub",
      uxId: "UX-024",
      purpose: "External platform connectivity SSOT",
      extensionId: "integrations-hub",
      module: "integrations-hub",
    },
  },
  {
    prefix: "/dashboard/pillow/learning",
    meta: {
      screenId: "executive-learning",
      screenTitle: "Executive Learning Review",
      uxId: "PILLOW-019",
      purpose: "Executive learning review",
      module: "pillow-executive-learning",
    },
  },
];

function resolveNavScreen(path: string): ScreenMeta | null {
  const sorted = [...workspaceNavItems].sort((a, b) => b.path.length - a.path.length);
  const match = sorted.find(
    (item) => path === item.path || (item.path !== "/dashboard" && path.startsWith(`${item.path}/`)),
  );
  if (!match) return null;
  return {
    screenId: match.id,
    screenTitle: match.label,
    module: match.section,
    purpose: `${match.label} workspace`,
  };
}

function resolveExtensionScreen(path: string): ScreenMeta | null {
  const sorted = [...EXTENSION_SCREENS].sort((a, b) => b.prefix.length - a.prefix.length);
  const match = sorted.find((entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`));
  return match?.meta ?? null;
}

/** Resolve structured screen metadata for Executive Companion context. */
export function resolvePillowScreenContext(screenPath: string): ScreenMeta {
  const normalized = screenPath.split("?")[0] ?? screenPath;

  const extension = resolveExtensionScreen(normalized);
  if (extension) return extension;

  const nav = resolveNavScreen(normalized);
  if (nav) return nav;

  if (normalized === "/dashboard" || normalized === "/dashboard/") {
    return {
      screenId: "mission-home",
      screenTitle: "Mission Home",
      uxId: "UX-002",
      purpose: "Daily mission briefing",
      module: "command",
    };
  }

  if (normalized.startsWith("/dashboard/brands/")) {
    return {
      screenId: "brand-detail",
      screenTitle: "Brand Workspace",
      uxId: "UX-017",
      purpose: "Business entity detail",
      module: "business-workspace",
    };
  }

  if (normalized.startsWith("/dashboard/infrastructure")) {
    return {
      screenId: "infrastructure",
      screenTitle: "Infrastructure",
      uxId: "UX-020",
      purpose: "Connectors and accounts",
      module: "reality-integration",
    };
  }

  return {
    screenId: "unknown",
    screenTitle: "EmpireAI",
    purpose: "General empire operations",
  };
}

export function buildPillowWorkspaceContext(input: {
  screenPath: string;
  navigationHistory: string[];
  kpiLabel?: string | null;
  kpiValue?: string | null;
  pendingApprovals?: number;
  unreadNotifications?: number;
  pageOverride?: PillowPageContextOverride | null;
}): PillowWorkspaceContext {
  const meta = resolvePillowScreenContext(input.screenPath);
  return {
    screenPath: input.screenPath,
    screenId: meta.screenId,
    screenTitle: input.pageOverride?.screenTitle ?? meta.screenTitle,
    module: input.pageOverride?.module ?? meta.module,
    workflow: input.pageOverride?.workflow,
    uxId: meta.uxId,
    purpose: meta.purpose,
    extensionId: input.pageOverride?.extensionId ?? meta.extensionId,
    kpiLabel: input.kpiLabel ?? null,
    kpiValue: input.kpiValue ?? null,
    pendingApprovals: input.pendingApprovals,
    unreadNotifications: input.unreadNotifications,
    navigationHistory: input.navigationHistory,
    selectedRecords: input.pageOverride?.selectedRecords,
    businessEntity: input.pageOverride?.businessEntity,
  };
}
