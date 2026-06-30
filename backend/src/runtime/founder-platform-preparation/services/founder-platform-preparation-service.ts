import type { FounderPlatformPreparation } from "../models/founder-platform-preparation.js";

/** REAL-021 — Founder platform preparation architecture (Grand King remains separate). */
export function buildFounderPlatformPreparation(
  workspaceId: string,
  companyId: string,
): FounderPlatformPreparation {
  return {
    moduleId: "founder-platform-preparation",
    missionId: "REAL-021",
    workspaceId,
    companyId,
    grandKingRemainsUnique: true,
    neverMergeWithGrandKing: true,
    surfaces: [
      { surfaceId: "FOUNDER_WORKSPACE", label: "Founder Workspace", route: "/founder/workspace", status: "ARCHITECTURE_READY", grandKingSeparated: true, description: "Multi-tenant founder portfolio — separate auth scope from Grand King" },
      { surfaceId: "FOUNDER_DASHBOARD", label: "Founder Dashboard", route: "/founder/dashboard", status: "ARCHITECTURE_READY", grandKingSeparated: true, description: "Founder-level metrics — not Grand King P&L" },
      { surfaceId: "FOUNDER_REVENUE", label: "Founder Revenue", route: "/founder/revenue", status: "PLANNED", grandKingSeparated: true, description: "Aggregate founder revenue across businesses" },
      { surfaceId: "FOUNDER_PRODUCTS", label: "Founder Products", route: "/founder/products", status: "PLANNED", grandKingSeparated: true, description: "Product portfolio view for founders" },
      { surfaceId: "FOUNDER_MISSIONS", label: "Founder Missions", route: "/founder/missions", status: "ARCHITECTURE_READY", grandKingSeparated: true, description: "Reuses founder-automation journey — distinct from Mission Home" },
      { surfaceId: "FOUNDER_NOTIFICATIONS", label: "Founder Notifications", route: "/founder/notifications", status: "PLANNED", grandKingSeparated: true, description: "Human action queue alerts" },
      { surfaceId: "FOUNDER_REPORTS", label: "Founder Reports", route: "/founder/reports", status: "PLANNED", grandKingSeparated: true, description: "ESIS + MCL reports for founders" },
      { surfaceId: "FOUNDER_APPROVALS", label: "Founder Approvals", route: "/founder/approvals", status: "ARCHITECTURE_READY", grandKingSeparated: true, description: "Runtime activation gates — Founder ≠ Grand King approver" },
    ],
    architecturePercent: 45,
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
