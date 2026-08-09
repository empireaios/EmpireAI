import { COCKPIT_BASE } from "@/lib/cockpit/types";
import type { CockpitCentreNavItem } from "./types";

/**
 * P7-02 canonical Executive Cockpit navigation.
 * Single source for sidebar, mobile nav, and workspace routing.
 */
export const COCKPIT_UX_NAVIGATION: readonly CockpitCentreNavItem[] = [
  {
    id: "executive_home",
    label: "Executive Home",
    href: COCKPIT_BASE,
    icon: "◉",
    description: "Empire health · mission · alerts · Pillow · one-screen awareness",
    group: "primary",
  },
  {
    id: "mission_centre",
    label: "Mission Centre",
    href: `${COCKPIT_BASE}/missions`,
    icon: "⚑",
    description: "Active missions · progress · ETA · queue",
    group: "primary",
  },
  {
    id: "pillow",
    label: "Pillow Centre",
    href: `${COCKPIT_BASE}/development/pillow`,
    icon: "⌘",
    description: "Executive intelligence · recommendations · architecture",
    group: "primary",
  },
  {
    id: "builder",
    label: "Builder Console",
    href: `${COCKPIT_BASE}/founder/builder`,
    icon: "⚙",
    description: "Builder missions · ETA · repository · recovery",
    group: "operations",
  },
  {
    id: "supervisor",
    label: "Supervisor Centre",
    href: `${COCKPIT_BASE}/founder/supervisor`,
    icon: "◫",
    description: "Current mission · step · progress · mission health",
    group: "operations",
  },
  {
    id: "journey",
    label: "Journey Centre",
    href: `${COCKPIT_BASE}/founder/journey`,
    icon: "→",
    description: "Roadmap · journey position · mission history",
    group: "operations",
  },
  {
    id: "production",
    label: "Production Centre",
    href: `${COCKPIT_BASE}/founder/production`,
    icon: "⛊",
    description: "Production truth · deployment · browser verification",
    group: "operations",
  },
  {
    id: "guardian",
    label: "Guardian Centre",
    href: `${COCKPIT_BASE}/founder/guardian`,
    icon: "⛨",
    description: "Runtime · infrastructure · performance · availability",
    group: "operations",
  },
  {
    id: "business",
    label: "Business Centre",
    href: `${COCKPIT_BASE}/commerce/workspace`,
    icon: "▣",
    description: "Current business · portfolio · business health",
    group: "operations",
  },
  {
    id: "commerce",
    label: "Commerce Centre",
    href: `${COCKPIT_BASE}/commerce/store`,
    icon: "◈",
    description: "Store · launch · marketing · ads",
    group: "operations",
  },
  {
    id: "knowledge",
    label: "Knowledge Centre",
    href: `${COCKPIT_BASE}/founder/architecture`,
    icon: "◎",
    description: "Repository architecture · institutional memory (certified) · engineering intelligence",
    group: "system",
  },
  {
    id: "explainability",
    label: "Explainability",
    href: `${COCKPIT_BASE}/founder/explainability`,
    icon: "◇",
    description: "Constitutional WHY · WHAT · HOW · PROOF",
    group: "system",
  },
  {
    id: "live_eta",
    label: "Live ETA",
    href: `${COCKPIT_BASE}/founder/live-eta`,
    icon: "⏱",
    description: "Mission ETA · live progress timing",
    group: "system",
  },
  {
    id: "settings",
    label: "Settings",
    href: `${COCKPIT_BASE}/governance/settings`,
    icon: "⚖",
    description: "Governance · founder preferences",
    group: "system",
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
