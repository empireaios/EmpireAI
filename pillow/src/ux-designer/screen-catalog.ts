import type { ScreenCatalogEntry } from "./types.js";

/** Canonical EmpireAI screen catalog — Phase 4 screen understanding. */
export const SCREEN_CATALOG: ScreenCatalogEntry[] = [
  {
    id: "SCR-001",
    route: "/cockpit",
    pagePath: "empireai-web/app/(cockpit)/cockpit/page.tsx",
    title: "Executive Home",
    purpose: "Grand King executive command centre and operational overview",
    businessFunction: "Executive decision-making, alerts, next actions, engine health",
    department: "Executive",
    componentHierarchy: [
      { name: "ExecutiveHomePage", path: "empireai-web/components/cockpit/pages/ExecutiveHomePage.tsx", role: "page shell" },
      { name: "ExecutiveHomeSyncBar", path: "empireai-web/components/cockpit/widgets/ExecutiveSummaryCards.tsx", role: "sync status" },
      { name: "ExecutivePriorityWidgetGrid", path: "empireai-web/components/cockpit/widgets/ExecutiveSummaryCards.tsx", role: "KPI grid" },
      { name: "ExecutiveAlertsPanel", path: "empireai-web/components/cockpit/widgets/ExecutiveDashboardIntegration.tsx", role: "alerts" },
    ],
    layout: "max-w-7xl vertical stack with gap-6; CockpitShell sidebar + top bar",
    navigation: ["CockpitSidebar", "CockpitTopBar", "ExecutiveCommandStrip"],
    stateSources: ["ExecutiveHomeProvider", "useBrainModule executive-home"],
    dataSources: ["brain/dispatch executive-home", "cockpit-global-assistant context"],
    frontendOwner: "empireai-web/components/cockpit",
    backendDependencies: ["brain", "cockpit-global-assistant"],
  },
  {
    id: "SCR-800",
    route: "/cockpit/development/pillow",
    pagePath: "empireai-web/app/(cockpit)/cockpit/development/pillow/page.tsx",
    title: "Pillow Chat",
    purpose: "Live Pillow conversation and supervisor view",
    businessFunction: "AI operating layer interaction for Grand King",
    department: "Development",
    componentHierarchy: [
      { name: "DevelopmentPillowExperience", path: "empireai-web/components/cockpit/development/DevelopmentPillowExperience.tsx", role: "page" },
      { name: "GlobalAiAssistantPanel", path: "empireai-web/components/cockpit/global-assistant/GlobalAiAssistantPanel.tsx", role: "operating shell" },
    ],
    layout: "PlatformPageHeader + tabbed panels; GlobalAiAssistantPanel fixed aside",
    navigation: ["CockpitSidebar", "Development hub"],
    stateSources: ["GlobalAiAssistantProvider", "pillow session store"],
    dataSources: ["/api/pillow/session", "/api/pillow/chat", "brain/dispatch context"],
    frontendOwner: "empireai-web/lib/cockpit/global-assistant",
    backendDependencies: ["pillow-host", "brain"],
  },
  {
    id: "SCR-COMMERCE-STORE",
    route: "/cockpit/commerce/store",
    pagePath: "empireai-web/app/(cockpit)/cockpit/commerce/store/page.tsx",
    title: "Storefront Engine",
    purpose: "Commerce storefront management and engine centre",
    businessFunction: "Store operations, launch readiness, commerce KPIs",
    department: "Commerce",
    componentHierarchy: [
      { name: "CommerceStorePanel", path: "empireai-web/components/cockpit/widgets/CommerceStorePanel.tsx", role: "store widgets" },
      { name: "EnginePanelFrame", path: "empireai-web/components/cockpit/widgets/EnginePanelFrame.tsx", role: "engine centre frame" },
    ],
    layout: "Engine centre with section panels and metrics grid",
    navigation: ["CockpitSidebar Commerce", "Engine centre nav"],
    stateSources: ["useBrainModule store", "useBrainModule cockpit-engine"],
    dataSources: ["brain/dispatch store", "brain/dispatch cockpit-engine"],
    frontendOwner: "empireai-web/components/cockpit/widgets",
    backendDependencies: ["brain", "registry"],
  },
  {
    id: "SCR-MISSIONS",
    route: "/cockpit/missions",
    pagePath: "empireai-web/app/(cockpit)/cockpit/missions/page.tsx",
    title: "Mission Centre",
    purpose: "Active mission queue, progress, and mission intelligence",
    businessFunction: "Track REAL/UX/Pillow mission execution",
    department: "Governance",
    componentHierarchy: [
      { name: "MissionCentreLiveWidgets", path: "empireai-web/components/cockpit/widgets/MissionCentreLiveWidgets.tsx", role: "mission widgets" },
    ],
    layout: "Mission queue tables and progress indicators",
    navigation: ["CockpitSidebar", "Mission Centre"],
    stateSources: ["useBrainModule cockpit-missions"],
    dataSources: ["brain/dispatch cockpit-missions"],
    frontendOwner: "empireai-web/components/cockpit/widgets",
    backendDependencies: ["brain"],
  },
  {
    id: "SCR-LOGIN",
    route: "/login",
    pagePath: "empireai-web/app/(auth)/login/page.tsx",
    title: "Login",
    purpose: "Grand King authentication entry",
    businessFunction: "Secure access to Cockpit",
    department: "Infrastructure",
    componentHierarchy: [
      { name: "LoginPage", path: "empireai-web/app/(auth)/login/page.tsx", role: "auth form" },
    ],
    layout: "Centred card max-w-md on dark background",
    navigation: [],
    stateSources: ["AuthProvider"],
    dataSources: ["/api/auth/login", "/api/auth/me"],
    frontendOwner: "empireai-web/lib/auth",
    backendDependencies: ["brain/auth"],
  },
  {
    id: "SCR-COMMAND",
    route: "/cockpit/command",
    pagePath: "empireai-web/app/(cockpit)/cockpit/command/page.tsx",
    title: "Command Centre",
    purpose: "Operational command strip and CEO AI interface",
    businessFunction: "High-level operational commands",
    department: "Executive",
    componentHierarchy: [
      { name: "CommandCentrePage", path: "empireai-web/components/cockpit/pages/CommandCentrePage.tsx", role: "page" },
    ],
    layout: "Command panels with live widgets",
    navigation: ["CockpitSidebar", "ExecutiveCommandStrip"],
    stateSources: ["useBrainModule cockpit-command"],
    dataSources: ["brain/dispatch cockpit-command"],
    frontendOwner: "empireai-web/components/cockpit/pages",
    backendDependencies: ["brain"],
  },
];

export function findScreenByRoute(route: string): ScreenCatalogEntry | undefined {
  const normalized = route.replace(/\/$/, "") || "/cockpit";
  return SCREEN_CATALOG.find(
    (s) => s.route === normalized || normalized.startsWith(s.route + "/"),
  );
}

export function findScreenByKeyword(keyword: string): ScreenCatalogEntry | undefined {
  const q = keyword.toLowerCase();
  return SCREEN_CATALOG.find(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.route.includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.purpose.toLowerCase().includes(q) ||
      s.businessFunction.toLowerCase().includes(q),
  );
}

export function findScreenByPath(screenPath?: string): ScreenCatalogEntry | undefined {
  if (!screenPath) return SCREEN_CATALOG[0];
  return findScreenByRoute(screenPath) ?? findScreenByKeyword(screenPath);
}
