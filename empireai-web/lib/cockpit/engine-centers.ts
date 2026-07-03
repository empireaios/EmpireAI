import { COCKPIT_BASE } from "@/lib/cockpit/types";

/** G4-04 — Canonical engine center routes (mirrors backend ENGINE_CENTER_ROUTES). */
export const ENGINE_CENTER_ROUTES = {
  supplier: `${COCKPIT_BASE}/intelligence/suppliers`,
  marketplace: `${COCKPIT_BASE}/intelligence/marketplace`,
  storefront: `${COCKPIT_BASE}/commerce/store`,
  advertising: `${COCKPIT_BASE}/commerce/marketing`,
  payment: `${COCKPIT_BASE}/finance/billing`,
  logistics: `${COCKPIT_BASE}/operations/fulfillment`,
  analytics: `${COCKPIT_BASE}/finance/profit`,
  "quantitative-intelligence": `${COCKPIT_BASE}/intelligence/discovery`,
  "pillow-supervisor": `${COCKPIT_BASE}/development/pillow`,
} as const;

export type EngineCenterId = keyof typeof ENGINE_CENTER_ROUTES;

export const ENGINE_CENTER_NAV: readonly {
  id: EngineCenterId;
  label: string;
  href: string;
  department: string;
}[] = [
  { id: "supplier", label: "Supplier Engine", href: ENGINE_CENTER_ROUTES.supplier, department: "Intelligence" },
  { id: "marketplace", label: "Marketplace Engine", href: ENGINE_CENTER_ROUTES.marketplace, department: "Intelligence" },
  { id: "quantitative-intelligence", label: "Quantitative Intelligence", href: ENGINE_CENTER_ROUTES["quantitative-intelligence"], department: "Intelligence" },
  { id: "storefront", label: "Storefront Engine", href: ENGINE_CENTER_ROUTES.storefront, department: "Commerce" },
  { id: "advertising", label: "Advertising Engine", href: ENGINE_CENTER_ROUTES.advertising, department: "Commerce" },
  { id: "payment", label: "Payment Engine", href: ENGINE_CENTER_ROUTES.payment, department: "Finance" },
  { id: "analytics", label: "Analytics Engine", href: ENGINE_CENTER_ROUTES.analytics, department: "Finance" },
  { id: "logistics", label: "Logistics Engine", href: ENGINE_CENTER_ROUTES.logistics, department: "Operations" },
  { id: "pillow-supervisor", label: "Pillow Supervisor", href: ENGINE_CENTER_ROUTES["pillow-supervisor"], department: "Development" },
];

export function engineCenterHref(engineId: string): string {
  return ENGINE_CENTER_ROUTES[engineId as EngineCenterId] ?? COCKPIT_BASE;
}
