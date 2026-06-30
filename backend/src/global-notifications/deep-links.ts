import type { GlobalNotificationSource } from "./models/global-notification.js";

/** GC-03 — Deep-link targets for notification navigation. */
export const DEEP_LINKS: Record<GlobalNotificationSource, string> = {
  "executive-surveillance": "/dashboard/command",
  "eye-series": "/dashboard/intelligence",
  "reality-integration": "/dashboard/infrastructure",
  "executive-council": "/dashboard/debate",
  pillow: "/dashboard/pillow",
  ux: "/dashboard",
  "commerce-runtime": "/dashboard/operations",
  "supplier-intelligence": "/dashboard/suppliers",
  "grand-king": "/dashboard/approvals",
};

export function moduleDeepLink(moduleId: string): string {
  if (moduleId.includes("supplier")) return "/dashboard/suppliers";
  if (moduleId.includes("marketplace") || moduleId.includes("amazon")) return "/dashboard/marketplaces";
  if (moduleId.includes("reality")) return "/dashboard/infrastructure";
  if (moduleId.includes("commerce-runtime")) return "/dashboard/operations";
  if (moduleId.includes("executive-council")) return "/dashboard/debate";
  return DEEP_LINKS["executive-surveillance"] as string;
}
