import { COCKPIT_BASE } from "@/lib/cockpit/types";

/**
 * REAL-124 — Canonical /platform → /cockpit redirect registry.
 * Consumed by middleware; platform route files remain for rollback safety.
 */
export const platformToCockpitRedirects = {
  "/platform": COCKPIT_BASE,
  "/platform/dashboard": COCKPIT_BASE,
  "/platform/ai-ceo": `${COCKPIT_BASE}/command`,
  "/platform/intelligence": `${COCKPIT_BASE}/intelligence/products`,
  "/platform/suppliers": `${COCKPIT_BASE}/intelligence/suppliers`,
  "/platform/store": `${COCKPIT_BASE}/commerce/store`,
  "/platform/marketing": `${COCKPIT_BASE}/commerce/marketing`,
  "/platform/ads": `${COCKPIT_BASE}/commerce/ads`,
  "/platform/finance": `${COCKPIT_BASE}/finance/profit`,
  "/platform/orders": `${COCKPIT_BASE}/operations/orders`,
  "/platform/support": `${COCKPIT_BASE}/operations/support`,
  "/platform/settings": `${COCKPIT_BASE}/governance/settings`,
  "/platform/admin": `${COCKPIT_BASE}/infrastructure/admin`,
} as const satisfies Record<string, string>;

export type PlatformRedirectPath = keyof typeof platformToCockpitRedirects;

export function getCockpitRedirectForPlatformPath(pathname: string): string | null {
  if (pathname in platformToCockpitRedirects) {
    return platformToCockpitRedirects[pathname as PlatformRedirectPath];
  }
  return null;
}
