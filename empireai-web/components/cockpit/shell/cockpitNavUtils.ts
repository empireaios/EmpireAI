import { COCKPIT_BASE } from "@/lib/cockpit/types";
import type { CockpitNavIcon, CockpitRole } from "@/lib/cockpit/navigation";
import type { UserRole } from "@/lib/auth/types";

export const cockpitNavIcons: Record<CockpitNavIcon, string> = {
  home: "◉",
  command: "♛",
  missions: "⚑",
  intelligence: "◎",
  commerce: "▣",
  operations: "☰",
  finance: "$",
  workforce: "◆",
  infrastructure: "⛊",
  governance: "⚖",
  development: "⌘",
};

export function canAccessCockpitNav(
  roles: readonly CockpitRole[] | undefined,
  userRole: UserRole | undefined,
) {
  if (!roles || !userRole) {
    return true;
  }
  return roles.includes(userRole);
}

export function isCockpitNavActive(pathname: string, href: string) {
  if (href === COCKPIT_BASE) {
    return pathname === COCKPIT_BASE || pathname === `${COCKPIT_BASE}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
