import { COCKPIT_BASE } from "@/lib/cockpit/types";
import type { CockpitCentreNavItem } from "./types";

/**
 * P7-02 / Mission 007 canonical Executive Cockpit navigation.
 * Availability is honest — unavailable centres must not pretend to be complete.
 */
export const COCKPIT_UX_NAVIGATION: readonly CockpitCentreNavItem[] = [
  {
    id: "executive_home",
    label: "Executive Home",
    href: COCKPIT_BASE,
    icon: "◉",
    description: "What needs attention · Pillow · decisions · money truth",
    group: "primary",
    availability: "live",
  },
  {
    id: "mission_centre",
    label: "Mission Centre",
    href: `${COCKPIT_BASE}/missions`,
    icon: "⚑",
    description: "Active missions · blockers · approvals queue",
    group: "primary",
    availability: "live",
  },
  {
    id: "pillow",
    label: "Pillow Centre",
    href: `${COCKPIT_BASE}/development/pillow`,
    icon: "⌘",
    description: "Dedicated Pillow workspace · recommendations",
    group: "primary",
    availability: "live",
  },
  {
    id: "builder",
    label: "Builder Console",
    href: `${COCKPIT_BASE}/founder/builder`,
    icon: "⚙",
    description: "Builder missions · repository work",
    group: "operations",
    availability: "partial",
  },
  {
    id: "supervisor",
    label: "Supervisor Centre",
    href: `${COCKPIT_BASE}/founder/supervisor`,
    icon: "◫",
    description: "Mission supervision · progress",
    group: "operations",
    availability: "partial",
  },
  {
    id: "journey",
    label: "Journey Centre",
    href: `${COCKPIT_BASE}/founder/journey`,
    icon: "→",
    description: "Roadmap position · journey history",
    group: "operations",
    availability: "partial",
  },
  {
    id: "production",
    label: "Production Centre",
    href: `${COCKPIT_BASE}/founder/production`,
    icon: "⛊",
    description: "Production truth · deployment health",
    group: "operations",
    availability: "partial",
  },
  {
    id: "guardian",
    label: "Guardian Centre",
    href: `${COCKPIT_BASE}/founder/guardian`,
    icon: "⛨",
    description: "Runtime · infrastructure · availability",
    group: "operations",
    availability: "partial",
  },
  {
    id: "business",
    label: "Business Centre",
    href: `${COCKPIT_BASE}/commerce/workspace`,
    icon: "▣",
    description: "Portfolio workspace · business health",
    group: "operations",
    availability: "partial",
  },
  {
    id: "commerce",
    label: "Commerce Centre",
    href: `${COCKPIT_BASE}/commerce/operating`,
    icon: "◈",
    description: "Operating commerce · funnel · approvals",
    group: "operations",
    availability: "live",
  },
  {
    id: "knowledge",
    label: "Knowledge Centre",
    href: `${COCKPIT_BASE}/founder/architecture`,
    icon: "◎",
    description: "Architecture · institutional memory",
    group: "system",
    availability: "partial",
  },
  {
    id: "explainability",
    label: "Explainability",
    href: `${COCKPIT_BASE}/founder/explainability`,
    icon: "◇",
    description: "Why · what · how · proof",
    group: "system",
    availability: "partial",
  },
  {
    id: "live_eta",
    label: "Live ETA",
    href: `${COCKPIT_BASE}/founder/live-eta`,
    icon: "⏱",
    description: "Mission timing · live progress",
    group: "system",
    availability: "partial",
  },
  {
    id: "settings",
    label: "Settings",
    href: `${COCKPIT_BASE}/governance/settings`,
    icon: "⚖",
    description: "Governance · founder preferences",
    group: "system",
    availability: "unavailable",
    unavailableReason:
      "Settings and governance preferences are not yet an operating Grand King surface. Cost Guard and finance controls live under Finance / Cost Centre.",
  },
] as const;

export const COCKPIT_UX_MOBILE_PRIMARY: readonly CockpitCentreNavItem["id"][] = [
  "executive_home",
  "pillow",
  "mission_centre",
  "builder",
  "commerce",
] as const;

export function resolveCockpitCentreId(pathname: string): CockpitCentreNavItem["id"] {
  const sorted = [...COCKPIT_UX_NAVIGATION].sort((a, b) => b.href.length - a.href.length);
  const match = sorted.find(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`) ||
      (item.href.endsWith("/cockpit") && pathname.startsWith("/cockpit")),
  );
  return match?.id ?? "executive_home";
}

export function getCockpitCentreById(id: CockpitCentreNavItem["id"]) {
  return COCKPIT_UX_NAVIGATION.find((item) => item.id === id);
}
