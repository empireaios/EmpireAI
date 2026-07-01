/**
 * REAL-124 / REAL-126 — Vite /dashboard/* → Cockpit canonical paths.
 * Host resolved at runtime via VITE_COCKPIT_ORIGIN (defaults to same origin in prod).
 */
const COCKPIT_ORIGIN =
  (import.meta.env.VITE_COCKPIT_ORIGIN as string | undefined)?.replace(/\/$/, "") ?? "";

const COCKPIT_BASE = "/cockpit";

export const dashboardToCockpitRedirects: Readonly<Record<string, string>> = {
  "/dashboard": COCKPIT_BASE,
  "/dashboard/command": `${COCKPIT_BASE}/command`,
  "/dashboard/approvals": `${COCKPIT_BASE}/missions`,
  "/dashboard/intelligence": `${COCKPIT_BASE}/intelligence/products`,
  "/dashboard/suppliers": `${COCKPIT_BASE}/intelligence/suppliers`,
  "/dashboard/marketplaces": `${COCKPIT_BASE}/intelligence/marketplace`,
  "/dashboard/brands": `${COCKPIT_BASE}/commerce/workspace`,
  "/dashboard/launch": `${COCKPIT_BASE}/commerce/launch`,
  "/dashboard/advertising": `${COCKPIT_BASE}/commerce/ads`,
  "/dashboard/operating-cost": `${COCKPIT_BASE}/finance/profit`,
  "/dashboard/billing": `${COCKPIT_BASE}/finance/billing`,
  "/dashboard/operations": `${COCKPIT_BASE}/operations/orders`,
  "/dashboard/integrations": `${COCKPIT_BASE}/infrastructure/integrations`,
  "/dashboard/infrastructure": `${COCKPIT_BASE}/infrastructure`,
  "/dashboard/settings": `${COCKPIT_BASE}/governance/settings`,
  "/dashboard/success-001": `${COCKPIT_BASE}/governance/v1`,
  "/dashboard/pillow": `${COCKPIT_BASE}/development/pillow`,
  "/dashboard/pillow/learning": `${COCKPIT_BASE}/development/learning`,
  "/dashboard/ai-team": `${COCKPIT_BASE}/workforce`,
  "/dashboard/reports": `${COCKPIT_BASE}/finance/pl`,
  "/dashboard/explorer": `${COCKPIT_BASE}/intelligence/discovery`,
  "/dashboard/debate": `${COCKPIT_BASE}/governance/council`,
  "/dashboard/soul": `${COCKPIT_BASE}/governance/soul`,
  "/dashboard/king-history": `${COCKPIT_BASE}/governance/decisions`,
};

export function resolveCockpitRedirect(pathname: string): string | null {
  if (pathname in dashboardToCockpitRedirects) {
    return dashboardToCockpitRedirects[pathname];
  }
  if (pathname.startsWith("/dashboard/brands/")) {
    const suffix = pathname.slice("/dashboard/brands".length);
    return `${COCKPIT_BASE}/commerce/workspace${suffix}`;
  }
  if (pathname.startsWith("/dashboard/infrastructure/")) {
    const suffix = pathname.slice("/dashboard/infrastructure".length);
    return `${COCKPIT_BASE}/infrastructure${suffix}`;
  }
  if (pathname.startsWith("/dashboard/settings/")) {
    return `${COCKPIT_BASE}/governance/settings`;
  }
  if (pathname.startsWith("/dashboard/")) {
    return COCKPIT_BASE;
  }
  return null;
}

export function buildCockpitRedirectUrl(pathname: string): string {
  const target = resolveCockpitRedirect(pathname) ?? COCKPIT_BASE;
  return `${COCKPIT_ORIGIN}${target}`;
}
