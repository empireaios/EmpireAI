import { COCKPIT_BASE } from "@/lib/cockpit/types";

/** P7-01 — Canonical founder navigation (maps to Cockpit routes). */
export type FounderNavIcon =
  | "home"
  | "businesses"
  | "pillow"
  | "builder"
  | "journey"
  | "production"
  | "commerce"
  | "knowledge"
  | "settings";

export type FounderNavItem = {
  id: string;
  label: string;
  href: string;
  icon: FounderNavIcon;
  description: string;
};

export const founderNavigation: readonly FounderNavItem[] = [
  {
    id: "executive_home",
    label: "Executive Home",
    href: COCKPIT_BASE,
    icon: "home",
    description: "Business · mission · builder · alerts · recommendations",
  },
  {
    id: "businesses",
    label: "Businesses",
    href: `${COCKPIT_BASE}/commerce/workspace`,
    icon: "businesses",
    description: "Business portfolio workspace",
  },
  {
    id: "pillow",
    label: "Pillow",
    href: `${COCKPIT_BASE}/development/pillow`,
    icon: "pillow",
    description: "Primary executive advisor",
  },
  {
    id: "builder",
    label: "Builder",
    href: `${COCKPIT_BASE}/founder/builder`,
    icon: "builder",
    description: "Mission progress · ETA · repository · recovery",
  },
  {
    id: "journey",
    label: "Journey",
    href: `${COCKPIT_BASE}/founder/journey`,
    icon: "journey",
    description: "Empire journey and roadmap",
  },
  {
    id: "production",
    label: "Production",
    href: `${COCKPIT_BASE}/founder/production`,
    icon: "production",
    description: "Production truth and deployment",
  },
  {
    id: "commerce",
    label: "Commerce",
    href: `${COCKPIT_BASE}/commerce/store`,
    icon: "commerce",
    description: "Store · launch · marketing · ads",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    href: `${COCKPIT_BASE}/founder/architecture`,
    icon: "knowledge",
    description: "Repository architecture intelligence",
  },
  {
    id: "settings",
    label: "Settings",
    href: `${COCKPIT_BASE}/governance/settings`,
    icon: "settings",
    description: "Governance and preferences",
  },
] as const;

export const founderNavIcons: Record<FounderNavIcon, string> = {
  home: "◉",
  businesses: "▣",
  pillow: "⌘",
  builder: "⚙",
  journey: "→",
  production: "⛊",
  commerce: "◈",
  knowledge: "◎",
  settings: "⚖",
};

export const founderMissionCentreHref = `${COCKPIT_BASE}/missions`;
